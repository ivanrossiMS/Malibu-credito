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

        // 1. Get Installment and Client Data
        const { data: inst, error: instError } = await supabase
            .from("installments")
            .select("*, loan:loans(*, client:clients(*))")
            .eq("id", installment_id)
            .maybeSingle();

        if (instError) throw new Error(`Banco (Parcela): ${instError.message}`);
        if (!inst) throw new Error(`Parcela ${installment_id} não encontrada.`);

        // EXPLORATORY LOGGING - Find common amount fields if 'amount' is empty
        console.log("DEBUG Parcela:", JSON.stringify(inst));

        // We try common names for the amount field
        const rawAmount = inst.amount ?? inst.valor ?? inst.valor_parcela ?? inst.value ?? inst.total;
        const paymentValue = parseFloat(rawAmount?.toString() || "0");

        if (paymentValue <= 0) {
            throw new Error(`O valor da parcela estah zerado ou nulo (${paymentValue}). Verifique o campo 'amount' no banco de dados.`);
        }

        const client = inst.loan?.client;
        if (!client) throw new Error("Cliente nao vinculado a esta parcela.");
        if (!client.cpf_cnpj) throw new Error(`O cliente ${client.name} nao possui CPF/CNPJ cadastrado.`);

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
        const searchRes = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${client.cpf_cnpj}`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const searchData = await searchRes.json();
        let asaasCustomerId: string;

        if (searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
        } else {
            const createRes = await fetch(`${ASAAS_URL}/customers`, {
                method: 'POST',
                headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: client.name,
                    cpfCnpj: client.cpf_cnpj,
                    email: client.email || undefined,
                    mobilePhone: client.phone || undefined
                })
            });
            const newCust = await createRes.json();
            if (newCust.errors) throw new Error(`Asaas (Cliente): ${newCust.errors[0].description}`);
            asaasCustomerId = newCust.id;
        }

        // 4. Create Payment
        const dueDate = inst.due_date || inst.data_vencimento || new Date().toISOString().split('T')[0];

        const payRes = await fetch(`${ASAAS_URL}/payments`, {
            method: 'POST',
            headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: asaasCustomerId,
                billingType: "PIX",
                value: paymentValue,
                dueDate: dueDate,
                description: `Parcela ${inst.number} - Emprestimo ${inst.loan.loan_code || inst.loan.id}`,
                externalReference: inst.id.toString()
            })
        });

        const payData = await payRes.json();
        if (payData.errors) throw new Error(`Asaas (Pagamento): ${payData.errors[0].description}`);

        // 5. Get QR Code
        const qrRes = await fetch(`${ASAAS_URL}/payments/${payData.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });
        const qrData = await qrRes.json();

        // 6. Save
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
