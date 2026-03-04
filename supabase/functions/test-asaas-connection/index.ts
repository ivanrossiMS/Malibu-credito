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
    const keyBytes = hexToBytes(MASTER_ENCRYPTION_KEY.substring(0, 64).padEnd(64, '0'));
    return await crypto.subtle.importKey(
        "raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
    );
}

async function decryptApiKey(encrypted: string, ivB64: string): Promise<string> {
    const key = await getMasterKey();
    const iv = base64ToBytes(ivB64);
    const cipherBytes = base64ToBytes(encrypted);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipherBytes);
    return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
    const result = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        result[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return result;
}

function base64ToBytes(b64: string): Uint8Array {
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return bytes;
}

// =====================================================

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { company_id } = body;

        if (!company_id) throw new Error("company_id é obrigatório.");
        if (!MASTER_ENCRYPTION_KEY) throw new Error("MASTER_ENCRYPTION_KEY não configurada nas Supabase Function Secrets.");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Buscar integração da empresa
        const { data: integration, error: intErr } = await supabase
            .from("company_integrations")
            .select("*")
            .eq("company_id", company_id)
            .eq("provider", "asaas")
            .maybeSingle();

        if (intErr) throw new Error(`Erro ao buscar integração: ${intErr.message}`);
        if (!integration) throw new Error(`Empresa ${company_id} não possui configuração ASAAS. Configure primeiro.`);
        if (!integration.api_key_encrypted || !integration.api_key_iv) {
            throw new Error(`A empresa ${company_id} não possui API Key configurada no sistema.`);
        }

        // Descriptografar
        const apiKey = await decryptApiKey(integration.api_key_encrypted, integration.api_key_iv);

        // Determinar URL do ASAAS
        const asaasUrl = integration.environment === 'production'
            ? "https://www.asaas.com/api/v3"
            : "https://sandbox.asaas.com/api/v3";

        // Testar chamada simples: buscar dados da conta (myAccount)
        const testRes = await fetch(`${asaasUrl}/myAccount`, {
            headers: { 'access_token': apiKey }
        });
        const testData = await testRes.json();

        const isOk = testRes.ok && !testData.errors;
        const timestamp = new Date().toISOString();

        // Atualizar status do último teste em company_integrations
        await supabase
            .from("company_integrations")
            .update({ last_test_ok: isOk, last_test_at: timestamp })
            .eq("company_id", company_id)
            .eq("provider", "asaas");

        if (!isOk) {
            const errMsg = testData.errors?.[0]?.description || testData.error || `HTTP ${testRes.status}`;
            return new Response(JSON.stringify({
                ok: false,
                message: `Falha na conexão ASAAS: ${errMsg}`,
                environment: integration.environment,
                tested_at: timestamp
            }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            ok: true,
            message: `Conexão OK — ${integration.environment === 'production' ? 'Produção' : 'Sandbox'}`,
            account_name: testData.name || testData.tradingName || 'Conta verificada',
            environment: integration.environment,
            tested_at: timestamp
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        console.error("test-asaas-connection error:", err.message);
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
