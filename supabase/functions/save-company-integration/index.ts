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
    if (!MASTER_ENCRYPTION_KEY) {
        throw new Error("MASTER_ENCRYPTION_KEY não configurada nas variáveis de ambiente da Edge Function.");
    }
    // A MASTER_ENCRYPTION_KEY deve ser uma string hex de 64 chars (32 bytes)
    const keyBytes = hexToBytes(MASTER_ENCRYPTION_KEY.substring(0, 64).padEnd(64, '0'));
    return await crypto.subtle.importKey(
        "raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]
    );
}

async function encryptApiKey(plaintext: string): Promise<{ encrypted: string; iv: string }> {
    const key = await getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const encodedText = new TextEncoder().encode(plaintext);
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedText);
    return {
        encrypted: bytesToBase64(new Uint8Array(cipherBuffer)),
        iv: bytesToBase64(iv)
    };
}

// FIXED: substring(i, i+2) — was substring(i, 2) which is wrong and caused crypto failures
function hexToBytes(hex: string): Uint8Array {
    const result = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        result[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return result;
}

function bytesToBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
}

// ============ Authorization Helper ============

/**
 * Verifica autorização:
 * - MASTER pode salvar integração de qualquer empresa.
 * - Admin da empresa pode ver o status mas NÃO pode alterar a API key.
 * - Clientes: acesso negado.
 *
 * Usa service_role para verificar no banco — o frontend não pode mentir sobre o role.
 */
async function verifyMasterRole(
    supabase: ReturnType<typeof createClient>,
    requestingUserId: string | number | null
): Promise<{ authorized: boolean; error?: string }> {
    if (!requestingUserId) {
        return { authorized: false, error: "requesting_user_id é obrigatório para autenticar a operação." };
    }

    const { data: user, error } = await supabase
        .from("users")
        .select("id, role, status")
        .eq("id", requestingUserId)
        .maybeSingle();

    if (error || !user) {
        return { authorized: false, error: `Usuário ${requestingUserId} não encontrado no sistema.` };
    }

    if (user.status !== 'ativo') {
        return { authorized: false, error: "Usuário inativo. Acesso negado." };
    }

    const isMaster = user.role === 'master' || user.role === 'MASTER';
    if (!isMaster) {
        return {
            authorized: false,
            error: `Permissão insuficiente. Apenas MASTER pode configurar integrações ASAAS. Role atual: ${user.role}`
        };
    }

    return { authorized: true };
}

// =====================================================

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { company_id, api_key, environment, webhook_token, requesting_user_id } = body;

        if (!company_id) throw new Error("company_id é obrigatório.");

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // ─── 1. Verificar autorização — apenas MASTER pode configurar ─────────────
        const authCheck = await verifyMasterRole(supabase, requesting_user_id);
        if (!authCheck.authorized) {
            return new Response(JSON.stringify({ error: authCheck.error }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        // ─── 2. Verificar que a empresa existe ────────────────────────────────────
        const { data: company, error: compErr } = await supabase
            .from("companies")
            .select("id, name")
            .eq("id", company_id)
            .single();
        if (compErr || !company) throw new Error(`Empresa ${company_id} não encontrada.`);

        // ─── 3. Gerar token seguro se não fornecido ───────────────────────────────
        const finalToken = webhook_token || generateSecureToken();

        // ─── 4. Preparar payload de integração ────────────────────────────────────
        const integrationPayload: Record<string, unknown> = {
            company_id,
            provider: 'asaas',
            environment: environment || 'sandbox',
            webhook_token: finalToken,
            is_enabled: true,
            updated_at: new Date().toISOString()
        };

        // ─── 5. Criptografar a API key APENAS se fornecida (e não vazia) ──────────
        if (api_key && api_key.trim() !== '') {
            if (!MASTER_ENCRYPTION_KEY) {
                throw new Error("MASTER_ENCRYPTION_KEY não configurada. Configure-a nas Supabase Function Secrets antes de salvar API Keys.");
            }
            const { encrypted, iv } = await encryptApiKey(api_key.trim());
            integrationPayload.api_key_encrypted = encrypted;
            integrationPayload.api_key_iv = iv;
        }

        // ─── 6. Upsert em company_integrations ────────────────────────────────────
        const { data: saved, error: saveErr } = await supabase
            .from("company_integrations")
            .upsert([integrationPayload], { onConflict: 'company_id,provider' })
            .select()
            .single();

        if (saveErr) throw new Error(`Erro ao salvar integração: ${saveErr.message}`);

        // ─── 7. NUNCA retornar a encrypted key ao frontend ────────────────────────
        const safeResponse = {
            id: saved.id,
            company_id: saved.company_id,
            provider: saved.provider,
            environment: saved.environment,
            webhook_token: saved.webhook_token,
            is_enabled: saved.is_enabled,
            has_api_key: !!(saved.api_key_encrypted),
            updated_at: saved.updated_at,
            // Informar status de segurança
            security: {
                encryption: 'AES-256-GCM',
                key_stored: 'server-side-only',
                key_visible_to_frontend: false,
                authorized_by: `user_id:${requesting_user_id}`
            }
        };

        return new Response(JSON.stringify(safeResponse), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (err) {
        const error = err as Error;
        console.error("save-company-integration error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});

function generateSecureToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
