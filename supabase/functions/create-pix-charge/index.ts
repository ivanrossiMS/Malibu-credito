import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MASTER_ENCRYPTION_KEY = Deno.env.get("MASTER_ENCRYPTION_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============ Crypto Helpers ============

async function getMasterKey(): Promise<CryptoKey> {
    if (!MASTER_ENCRYPTION_KEY) throw new Error("MASTER_ENCRYPTION_KEY não configurada nas Supabase Function Secrets.");
    const keyBytes = hexToBytes(MASTER_ENCRYPTION_KEY.substring(0, 64).padEnd(64, '0'));
    return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function decryptApiKey(encrypted: string, ivB64: string): Promise<string> {
    const key = await getMasterKey();
    const iv = base64ToBytes(ivB64);
    const cipher = base64ToBytes(encrypted);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(decrypted);
}

// CORRECTED: substring(i, i+2) — was substring(i, 2) which read same 2 chars every iteration
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

// ============ ASAAS Request Helper ============

async function asaasGet(url: string, apiKey: string) {
    const res = await fetch(url, {
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    console.log(`ASAAS GET ${url} → status:${res.status}`, JSON.stringify(data).substring(0, 200));
    return { status: res.status, data };
}

async function asaasPost(url: string, apiKey: string, body: unknown) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'access_token': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log(`ASAAS POST ${url} → status:${res.status}`, JSON.stringify(data).substring(0, 300));
    return { status: res.status, data };
}

// =====================================================

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    const steps: string[] = [];
    const log = (msg: string) => { steps.push(msg); console.log(msg); };

    try {
        const body = await req.json();
        const installment_id = body.installment_id;
        if (!installment_id) throw new Error("ID da parcela não informado.");
        log(`[1] installment_id=${installment_id}`);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { db: { schema: 'public' } });

        // ─── 1. Buscar parcela ─────────────────────────────────────────────
        const { data: inst, error: instError } = await supabase
            .from("installments")
            .select("*, loan:loans(*, client:clients(*))")
            .eq("id", installment_id)
            .maybeSingle();

        if (instError) throw new Error(`[Banco] Parcela: ${instError.message}`);
        if (!inst) throw new Error(`Parcela ${installment_id} não encontrada.`);
        log(`[2] Parcela encontrada: amount=${inst.amount || inst.installment_value}, company_id=${inst.company_id}`);

        // ─── 2. Resolver company_id ────────────────────────────────────────
        const companyId = inst.company_id || inst.loan?.company_id;
        if (!companyId) throw new Error(
            `Parcela ${installment_id} sem company_id. Execute o SQL migration_v3_final.sql no Supabase para migrar os dados.`
        );
        log(`[3] company_id=${companyId}`);

        // ─── 3. Buscar integração ASAAS ───────────────────────────────────
        const { data: integration, error: intErr } = await supabase
            .from("company_integrations")
            .select("environment,api_key_encrypted,api_key_iv,is_enabled")
            .eq("company_id", companyId)
            .eq("provider", "asaas")
            .maybeSingle();

        if (intErr) throw new Error(`[Banco] company_integrations: ${intErr.message} (tabela existe?)`);
        if (!integration) throw new Error(`Empresa ${companyId} sem integração ASAAS. Configure em Admin → Empresas → Integração ASAAS.`);
        if (!integration.is_enabled) throw new Error(`Integração ASAAS da empresa ${companyId} está desabilitada.`);
        if (!integration.api_key_encrypted) throw new Error(`Empresa ${companyId}: API Key ASAAS não configurada. Salve a API Key em Admin → Empresas.`);
        log(`[4] Integração encontrada: env=${integration.environment}`);

        // ─── 4. Descriptografar API Key ───────────────────────────────────
        let apiKey: string;
        try {
            apiKey = await decryptApiKey(integration.api_key_encrypted, integration.api_key_iv);
            if (!apiKey || apiKey.length < 10) throw new Error("API Key descriptografada parece inválida (muito curta).");
        } catch (cryptoErr) {
            throw new Error(`Falha ao descriptografar API Key: ${cryptoErr.message}. Verifique se MASTER_ENCRYPTION_KEY está configurada e se a API Key foi salva APÓS o deploy da função corrigida.`);
        }
        log(`[5] API Key descriptografada (${apiKey.length} chars)`);

        const asaasBase = integration.environment === 'production'
            ? "https://www.asaas.com/api/v3"
            : "https://sandbox.asaas.com/api/v3";
        log(`[6] ASAAS URL: ${asaasBase}`);

        // ─── 5. Idempotência: verificar cobrança existente com QR Code válido
        const { data: existingCharge } = await supabase
            .from("pix_charges")
            .select("*")
            .eq("installment_id", installment_id)
            .eq("company_id", companyId)
            .eq("status", "CREATED")
            .maybeSingle();

        if (existingCharge?.qr_code_url || existingCharge?.copy_paste) {
            log(`[7] Reutilizando cobrança existente id=${existingCharge.id}`);
            return new Response(JSON.stringify(existingCharge), {
                status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }
        log(`[7] Sem cobrança existente válida — criando nova`);

        // ─── 6. Dados da parcela ──────────────────────────────────────────
        const rawAmount = inst.amount ?? inst.installment_amount ?? inst.installment_value ?? inst.valor ?? inst.value;
        const paymentValue = parseFloat(rawAmount?.toString() || "0");
        if (paymentValue <= 0) throw new Error(`Valor inválido: ${paymentValue}. Parcela ${installment_id} não tem valor.`);

        const client = inst.loan?.client;
        if (!client) throw new Error("Cliente não encontrado para esta parcela (join loan→client falhou).");
        if (!client.cpf_cnpj) throw new Error(`Cliente "${client.name}" sem CPF/CNPJ cadastrado — obrigatório para PIX.`);
        log(`[8] Cliente: ${client.name}, CPF/CNPJ: ${client.cpf_cnpj}, Valor: R$${paymentValue}`);

        const cpfCnpj = client.cpf_cnpj.replace(/\D/g, '');

        // ─── 7. Buscar ou criar cliente no ASAAS ─────────────────────────
        const { status: searchStatus, data: searchData } = await asaasGet(
            `${asaasBase}/customers?cpfCnpj=${cpfCnpj}`, apiKey
        );
        if (searchStatus !== 200) throw new Error(`ASAAS busca cliente: HTTP ${searchStatus}. Verifique a API Key.`);

        let asaasCustomerId: string;
        if (searchData.data && searchData.data.length > 0) {
            asaasCustomerId = searchData.data[0].id;
            log(`[9] Cliente ASAAS existente: ${asaasCustomerId}`);
        } else {
            const { status: createStatus, data: newCust } = await asaasPost(`${asaasBase}/customers`, apiKey, {
                name: client.name,
                cpfCnpj,
                email: client.email || undefined,
                mobilePhone: (client.phone || '').replace(/\D/g, '') || undefined,
                externalReference: `malibu_client_${client.id}`
            });
            if (createStatus !== 200 || newCust.errors) {
                const errMsg = newCust.errors?.[0]?.description || `HTTP ${createStatus}`;
                throw new Error(`ASAAS criar cliente: ${errMsg}`);
            }
            asaasCustomerId = newCust.id;
            log(`[9] Cliente ASAAS criado: ${asaasCustomerId}`);
        }

        // ─── 8. Criar cobrança PIX ────────────────────────────────────────
        // Garantir dueDate é hoje ou futuro (ASAAS rejeita datas passadas)
        const today = new Date().toISOString().split('T')[0];
        const rawDue = inst.due_date || inst.dueDate || inst.vencimento;
        const dueDate = rawDue && rawDue >= today ? rawDue : today;

        const { status: payStatus, data: payData } = await asaasPost(`${asaasBase}/payments`, apiKey, {
            customer: asaasCustomerId,
            billingType: "PIX",
            value: paymentValue,
            dueDate,
            description: `Parcela ${inst.number || installment_id} — ${inst.loan?.loan_code || 'Malibu'}`,
            externalReference: `malibu_inst_${inst.id}_co_${companyId}`
        });

        if (payStatus !== 200 || payData.errors) {
            const errMsg = payData.errors?.[0]?.description || payData.message || `HTTP ${payStatus}`;
            throw new Error(`ASAAS criar cobrança: ${errMsg}`);
        }
        log(`[10] Cobrança ASAAS criada: id=${payData.id}, status=${payData.status}`);

        // ─── 9. Buscar QR Code ────────────────────────────────────────────
        // Tentar duas vezes com delay (ASAAS pode precisar de alguns ms)
        let qrData: { payload?: string; encodedImage?: string; expirationDate?: string } = {};
        for (let attempt = 1; attempt <= 2; attempt++) {
            if (attempt === 2) await new Promise(r => setTimeout(r, 1500)); // aguardar 1.5s na 2a tentativa
            const { status: qrStatus, data: qrResult } = await asaasGet(
                `${asaasBase}/payments/${payData.id}/pixQrCode`, apiKey
            );
            log(`[11.${attempt}] QR Code status=${qrStatus}, payload=${!!qrResult.payload}, encodedImage=${!!qrResult.encodedImage}`);
            if (qrStatus === 200 && (qrResult.payload || qrResult.encodedImage)) {
                qrData = qrResult;
                break;
            }
        }

        const copyPaste = qrData.payload || null;
        const qrCodeUrl = qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null;

        if (!copyPaste && !qrCodeUrl) {
            log(`[AVISO] QR Code não disponível. payData.status=${payData.status}, payData.id=${payData.id}`);
        }

        // ─── 10. Salvar no banco (side-effect — não bloqueia o retorno) ───
        const chargeData = {
            installment_id: inst.id,
            company_id: companyId,
            txid: payData.id,
            asaas_payment_id: payData.id,
            amount: paymentValue,
            status: "CREATED",
            copy_paste: copyPaste,
            qr_code_url: qrCodeUrl,
            expires_at: payData.dueDate || dueDate,
            pix_payload: { asaas_id: payData.id, customer: asaasCustomerId, value: paymentValue, dueDate, environment: integration.environment }
        };

        // Salvar sem bloquear o retorno
        supabase.from("pix_charges").upsert([chargeData], { onConflict: "installment_id,company_id", ignoreDuplicates: false })
            .select().single().then(({ error: saveErr }) => {
                if (saveErr) console.error("pix_charges save error (non-blocking):", saveErr.message);
            });

        // ─── 11. Retornar dados DIRETAMENTE DO ASAAS (não depende do banco) ──
        const responsePayload = {
            ...chargeData,
            asaas_status: payData.status,
            asaas_id: payData.id,
            // Campos que o frontend espera (snake_case)
            qr_code_url: qrCodeUrl,
            copy_paste: copyPaste,
            // Info de diagnóstico (visível no console do dev)
            _debug: { steps, qr_available: !!(copyPaste || qrCodeUrl), environment: integration.environment }
        };

        return new Response(JSON.stringify(responsePayload), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        const error = err as Error;
        console.error("create-pix-charge FATAL:", error.message, "Steps:", steps.join(" → "));
        return new Response(JSON.stringify({
            error: error.message,
            debug_steps: steps,
            hint: "Veja os logs completos em Supabase → Edge Functions → create-pix-charge → Logs"
        }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
