import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const ASAAS_URL = Deno.env.get("ASAAS_URL") || "https://www.asaas.com/api/v3";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        if (!ASAAS_API_KEY) {
            throw new Error("SECRET 'ASAAS_API_KEY' não configurada.");
        }

        const body = await req.json();
        const installment_id = body.installment_id;
        if (!installment_id) throw new Error("ID da parcela não informado.");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            db: { schema: 'public' }
        });

        // 1. Get Installment, Client and Company Data
        const { data: inst, error: instError } = await supabase
            .from("installments")
            .select("*, loan:loans(*, client:clients(*)), company:companies(*)")
            .eq("id", installment_id)
            .maybeSingle();

        if (instError) throw new Error(`Banco (Parcela): ${instError.message}`);
        if (!inst) throw new Error(`Parcela ${installment_id} não encontrada.`);

        // 2. Identify and Validate Asaas API Key and Environment
        const company = inst.company;
        const dynamicApiKey = company?.asaas_api_key;
        const environment = company?.asaas_environment || 'sandbox';
        const dynamicAsaasUrl = environment === 'production'
            ? "https://www.asaas.com/api/v3"
            : "https://sandbox.asaas.com/api/v3";

        if (!dynamicApiKey) {
            throw new Error(`A empresa "${company?.name || 'Desconhecida'}" nao possui chave de API asaas_api_key configurada. Operacao cancelada para evitar uso de conta mestre.`);
        }

        // Robust value extraction to handle naming variations in the DB
        console.log("DEBUG Parcela Content:", JSON.stringify(inst));
        const rawAmount = inst.amount ?? inst.installment_amount ?? inst.installment_value ?? inst.valor ?? inst.value;
        const paymentValue = parseFloat(rawAmount?.toString() || "0");

        if (paymentValue <= 0) {
            throw new Error(`O valor da parcela estah zerado ou nulo (${paymentValue}). Isso ocorre se o emprestimo foi gerado sem valor. Verifique a coluna 'amount' da parcela ${installment_id} no Banco de Dados.`);
        }

        const client = inst.loan?.client;
        if (!client) throw new Error("Cliente nao vinculado a esta parcela.");
        if (!client.cpf_cnpj) throw new Error(`O cliente ${client.name || 'Desconhecido'} nao possui CPF/CNPJ cadastrado no Malibu.`);

        // 2. Check existing charge
        const { data: existingCharge } = await supabase
            .from("pix_charges")
            .select("*")
            .eq("installment_id", installment_id)
            .eq("status", "CREATED")
            .maybeSingle();

        if (existingCharge) {
            return new Response(JSON.stringify(existingCharge), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 3. Asaas Integration: Customer
        const searchRes = await fetch(`${dynamicAsaasUrl}/customers?cpfCnpj=${client.cpf_cnpj.replace(/\D/g, '')}`, {
            headers: { 'access_token': dynamicApiKey }
        });
        const searchData = await searchRes.json();
        let asaasCustomerId: string;

        if (searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
        } else {
            console.log(`Criando novo cliente no Asaas: ${client.name}`);
            const createRes = await fetch(`${dynamicAsaasUrl}/customers`, {
                method: 'POST',
                headers: { 'access_token': dynamicApiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: client.name,
                    cpfCnpj: client.cpf_cnpj.replace(/\D/g, ''),
                    email: client.email || undefined,
                    mobilePhone: client.phone || undefined,
                    externalReference: client.id.toString()
                })
            });
            const newCust = await createRes.json();
            if (newCust.errors) throw new Error(`Asaas (Cliente): ${newCust.errors[0].description}`);
            asaasCustomerId = newCust.id;
        }

        // 4. Create Payment
        const dueDate = inst.due_date || new Date().toISOString().split('T')[0];

        const payRes = await fetch(`${dynamicAsaasUrl}/payments`, {
            method: 'POST',
            headers: { 'access_token': dynamicApiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: asaasCustomerId,
                billingType: "PIX",
                value: paymentValue,
                dueDate: dueDate,
                description: `Parcela ${inst.number} - Emprestimo ${inst.loan?.loan_code || inst.loan?.id || 'MAL'}`,
                externalReference: inst.id.toString()
            })
        });

        const payData = await payRes.json();
        if (payData.errors) throw new Error(`Asaas (Pagamento): ${payData.errors[0].description}`);

        // 5. Get QR Code
        const qrRes = await fetch(`${dynamicAsaasUrl}/payments/${payData.id}/pixQrCode`, {
            headers: { 'access_token': dynamicApiKey }
        });
        const qrData = await qrRes.json();

        // 6. Save locally
        const chargeData = {
            installment_id: inst.id,
            txid: payData.id,
            amount: paymentValue,
            status: "CREATED",
            copy_paste: qrData.payload,
            qr_code_url: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null,
            expires_at: payData.dueDate
        };

        const { data: saved, error: saveErr } = await supabase
            .from("pix_charges")
            .insert(chargeData)
            .select()
            .single();

        if (saveErr) throw new Error(`Banco (pix_charges): ${saveErr.message}`);

        return new Response(JSON.stringify(saved), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("PIX Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
