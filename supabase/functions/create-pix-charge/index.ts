import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MASTER_ENCRYPTION_KEY = Deno.env.get("MASTER_ENCRYPTION_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Crypto Helpers (AES-256-GCM) ============

async function getMasterKey(): Promise<CryptoKey> {
    if (!MASTER_ENCRYPTION_KEY) throw new Error("MASTER_ENCRYPTION_KEY não configurada.");
    const keyBytes = hexToBytes(MASTER_ENCRYPTION_KEY.substring(0, 64).padEnd(64, '0'));
    return await crypto.subtle.importKey(
        "raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
    );
}

async function decryptApiKey(encrypted: string, ivB64: string): Promise<string> {
    const key = await getMasterKey();
    const iv = base64ToBytes(ivB64);
    const cipher = base64ToBytes(encrypted);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    return bytes;
}

function base64ToBytes(b64: string): Uint8Array {
    const str = atob(b64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
    return bytes;
}

// =====================================================

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const installment_id = body.installment_id;
        if (!installment_id) throw new Error("ID da parcela não informado.");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
            db: { schema: 'public' }
        });

        // 1. Buscar parcela com empréstimo, cliente e empresa
        const { data: inst, error: instError } = await supabase
            .from("installments")
            .select("*, loan:loans(*, client:clients(*))")
            .eq("id", installment_id)
            .maybeSingle();

        if (instError) throw new Error(`Banco (Parcela): ${instError.message}`);
        if (!inst) throw new Error(`Parcela ${installment_id} não encontrada.`);

        // 2. Descobrir company_id de forma segura (não confiar no frontend)
        const companyId = inst.company_id || inst.loan?.company_id;
        if (!companyId) throw new Error(`Parcela ${installment_id} não possui company_id. Execute a migração multi-tenant.`);

        // 3. Buscar credenciais ASAAS da empresa em company_integrations (NUNCA de companies)
        const { data: integration, error: intErr } = await supabase
            .from("company_integrations")
            .select("*")
            .eq("company_id", companyId)
            .eq("provider", "asaas")
            .eq("is_enabled", true)
            .maybeSingle();

        if (intErr) throw new Error(`Erro ao buscar integração ASAAS: ${intErr.message}`);
        if (!integration) throw new Error(`Empresa ${companyId} não possui integração ASAAS configurada. Configure no painel Admin > Empresas > Integração ASAAS.`);
        if (!integration.api_key_encrypted || !integration.api_key_iv) {
            throw new Error(`Empresa ${companyId} possui integração configurada, mas a API Key não foi definida. Acesse Admin > Empresas e configure a API Key.`);
        }

        // 4. Descriptografar API Key (operação 100% server-side, chave NUNCA sai da função)
        const apiKey = await decryptApiKey(integration.api_key_encrypted, integration.api_key_iv);
        const asaasUrl = integration.environment === 'production'
            ? "https://www.asaas.com/api/v3"
            : "https://sandbox.asaas.com/api/v3";

        // 5. Verificar cobrança existente (idempotência por company_id + installment_id)
        const { data: existingCharge } = await supabase
            .from("pix_charges")
            .select("*")
            .eq("installment_id", installment_id)
            .eq("company_id", companyId)
            .eq("status", "CREATED")
            .maybeSingle();

        if (existingCharge) {
            return new Response(JSON.stringify(existingCharge), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // 6. Extrair dados financeiros da parcela
        const rawAmount = inst.amount ?? inst.installment_amount ?? inst.installment_value ?? inst.valor ?? inst.value;
        const paymentValue = parseFloat(rawAmount?.toString() || "0");

        if (paymentValue <= 0) {
            throw new Error(`Valor da parcela inválido (${paymentValue}). Verifique a coluna 'amount' da parcela ${installment_id}.`);
        }

        const client = inst.loan?.client;
        if (!client) throw new Error("Cliente não vinculado a esta parcela.");
        if (!client.cpf_cnpj) throw new Error(`Cliente ${client.name || 'Desconhecido'} sem CPF/CNPJ cadastrado.`);

        // 7. Buscar ou criar cliente no ASAAS desta empresa
        const cpfCnpj = client.cpf_cnpj.replace(/\D/g, '');
        const searchRes = await fetch(`${asaasUrl}/customers?cpfCnpj=${cpfCnpj}`, {
            headers: { 'access_token': apiKey }
        });
        const searchData = await searchRes.json();
        let asaasCustomerId: string;

        if (searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
        } else {
            const createRes = await fetch(`${asaasUrl}/customers`, {
                method: 'POST',
                headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: client.name,
                    cpfCnpj,
                    email: client.email || undefined,
                    mobilePhone: client.phone || undefined,
                    externalReference: `malibu_client_${client.id}`
                })
            });
            const newCust = await createRes.json();
            if (newCust.errors) throw new Error(`ASAAS (Cliente): ${newCust.errors[0].description}`);
            asaasCustomerId = newCust.id;
        }

        // 8. Criar cobrança PIX no ASAAS desta empresa
        const dueDate = inst.due_date || new Date().toISOString().split('T')[0];
        const payRes = await fetch(`${asaasUrl}/payments`, {
            method: 'POST',
            headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customer: asaasCustomerId,
                billingType: "PIX",
                value: paymentValue,
                dueDate,
                description: `Parcela ${inst.number} — Empréstimo ${inst.loan?.loan_code || inst.loan?.id || `mal-${companyId}`}`,
                externalReference: `malibu_inst_${inst.id}_company_${companyId}`
            })
        });
        const payData = await payRes.json();
        if (payData.errors) throw new Error(`ASAAS (Pagamento): ${payData.errors[0].description}`);

        // 9. Buscar QR Code
        const qrRes = await fetch(`${asaasUrl}/payments/${payData.id}/pixQrCode`, {
            headers: { 'access_token': apiKey }
        });
        const qrData = await qrRes.json();

        // 10. Salvar localmente em pix_charges com company_id
        const chargeData = {
            installment_id: inst.id,
            company_id: companyId,                   // ← Isolamento multi-tenant garantido
            txid: payData.id,
            asaas_payment_id: payData.id,            // campo dedicado para busca por webhook
            amount: paymentValue,
            status: "CREATED",
            copy_paste: qrData.payload || null,
            qr_code_url: qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null,
            expires_at: payData.dueDate,
            pix_payload: {                            // payload estruturado para auditoria
                asaas_id: payData.id,
                customer: asaasCustomerId,
                value: paymentValue,
                dueDate,
                environment: integration.environment,
                externalReference: payData.externalReference
            }
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
        console.error("create-pix-charge error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
