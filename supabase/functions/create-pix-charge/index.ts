import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Use built-in Supabase environment variables for Edge Functions
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Asaas configuration
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
            throw new Error("SECRET 'ASAAS_API_KEY' não configurada nas Functions do Supabase.");
        }

        const body = await req.json();
        const installment_id = body.installment_id;
        if (!installment_id) throw new Error("ID da parcela não informado (Missing installment_id)");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Get Installment and Client Data
        const { data: inst, error: instError } = await supabase
            .from("installments")
            .select("*, loan:loans(*, client:clients(*))")
            .eq("id", installment_id)
            .maybeSingle();

        if (instError) throw new Error(`Erro de Banco de Dados: ${instError.message}`);
        if (!inst) throw new Error(`Parcela com ID ${installment_id} não encontrada no sistema.`);

        // Log the installment to debug field names
        console.log("Dados da Parcela recuperados:", JSON.stringify(inst));

        // Asaas requires a numeric value. We check 'amount' and fallback for safety if needed
        const rawValue = inst.amount || inst.installment_amount || inst.installment_value;
        const paymentValue = parseFloat(rawValue?.toString() || "0");

        if (paymentValue <= 0) {
            throw new Error(`O valor da parcela estah invahlido ou zerado: ${paymentValue}. Verifique a coluna 'amount' na tabela installments.`);
        }

        const client = inst.loan?.client;
        if (!client) throw new Error("Contrato ou Cliente não encontrado para esta parcela.");
        if (!client.cpf_cnpj) throw new Error(`O cliente ${client.name || ''} não possui CPF/CNPJ cadastrado.`);

        // 2. Check for existing charge in our DB
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
        console.log(`Buscando cliente no Asaas: ${client.cpf_cnpj}`);
        const customerSearchRes = await fetch(`${ASAAS_URL}/customers?cpfCnpj=${client.cpf_cnpj}`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        if (!customerSearchRes.ok) {
            const errData = await customerSearchRes.json();
            throw new Error(`Asaas (Busca Cliente): ${errData.errors?.[0]?.description || customerSearchRes.statusText}`);
        }

        const customerSearchData = await customerSearchRes.json();
        let asaasCustomerId: string;

        if (customerSearchData.data && customerSearchData.data.length > 0) {
            asaasCustomerId = customerSearchData.data[0].id;
        } else {
            console.log(`Criando novo cliente no Asaas: ${client.name}`);
            const createCustomerRes = await fetch(`${ASAAS_URL}/customers`, {
                method: 'POST',
                headers: {
                    'access_token': ASAAS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: client.name,
                    cpfCnpj: client.cpf_cnpj,
                    email: client.email || undefined,
                    mobilePhone: client.phone || undefined,
                    externalReference: client.id.toString()
                })
            });

            if (!createCustomerRes.ok) {
                const errData = await createCustomerRes.json();
                throw new Error(`Asaas (Criar Cliente): ${errData.errors?.[0]?.description || createCustomerRes.statusText}`);
            }

            const newCustomer = await createCustomerRes.json();
            asaasCustomerId = newCustomer.id;
        }

        // 4. Asaas Integration: Create Payment (PIX)
        console.log(`Criando cobrança PIX no Asaas para cliente ${asaasCustomerId} com valor ${paymentValue}`);
        const createPaymentRes = await fetch(`${ASAAS_URL}/payments`, {
            method: 'POST',
            headers: {
                'access_token': ASAAS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customer: asaasCustomerId,
                billingType: "PIX",
                value: paymentValue,
                dueDate: inst.due_date,
                description: `Parcela ${inst.number} - Empréstimo ${inst.loan.loan_code || inst.loan.id}`,
                externalReference: inst.id.toString()
            })
        });

        if (!createPaymentRes.ok) {
            const errData = await createPaymentRes.json();
            throw new Error(`Asaas (Criar Pagamento): ${errData.errors?.[0]?.description || createPaymentRes.statusText}`);
        }

        const paymentData = await createPaymentRes.json();

        // 5. Get PIX QR Code
        const qrCodeRes = await fetch(`${ASAAS_URL}/payments/${paymentData.id}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        });

        if (!qrCodeRes.ok) {
            throw new Error("Asaas: Erro ao gerar QR Code do PIX.");
        }

        const qrData = await qrCodeRes.json();

        // 6. Save to DB
        const chargeData = {
            installment_id: inst.id,
            txid: paymentData.id,
            amount: paymentValue,
            status: "CREATED",
            copy_paste: qrData.payload,
            qr_code_url: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null,
            expires_at: paymentData.dueDate
        };

        const { data: savedCharge, error: saveError } = await supabase
            .from("pix_charges")
            .insert(chargeData)
            .select()
            .single();

        if (saveError) throw new Error(`Banco de Dados (pix_charges): ${saveError.message}`);

        return new Response(JSON.stringify(savedCharge), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("PIX Charge Error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
