import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Webhook ASAAS por empresa — Multi-Tenant Seguro
 *
 * URL esperada:
 *   POST /webhook-pix?company_id=<ID>&token=<WEBHOOK_TOKEN>
 *
 * O token é validado contra company_integrations.webhook_token.
 * Nenhum dado de outra empresa é modificado.
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const companyId = url.searchParams.get("company_id");
    const token = url.searchParams.get("token");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ─── Variáveis para log ────────────────────────────────────────────────
    let eventType = "UNKNOWN";
    let asaasEventId = `evt_${Date.now()}`;
    let rawPayload: unknown = null;

    try {
        rawPayload = await req.json();

        eventType = (rawPayload as Record<string, string>)?.event || "UNKNOWN";
        asaasEventId = (rawPayload as Record<string, string>)?.id || asaasEventId;
        const payment = (rawPayload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;

        // ─── 1. Validar company_id e token (OBRIGATÓRIO para segurança) ─────
        if (!companyId || !token) {
            await logWebhook(supabase, null, eventType, asaasEventId, rawPayload, false,
                "company_id ou token ausente na URL do webhook.");
            return new Response("Unauthorized: company_id e token são obrigatórios.", { status: 401 });
        }

        const { data: integration, error: intErr } = await supabase
            .from("company_integrations")
            .select("webhook_token, is_enabled")
            .eq("company_id", companyId)
            .eq("provider", "asaas")
            .maybeSingle();

        if (intErr || !integration) {
            await logWebhook(supabase, Number(companyId), eventType, asaasEventId, rawPayload, false,
                `Integração ASAAS não encontrada para empresa ${companyId}.`);
            return new Response("Unauthorized: empresa não encontrada.", { status: 401 });
        }

        if (!integration.is_enabled) {
            await logWebhook(supabase, Number(companyId), eventType, asaasEventId, rawPayload, false,
                `Integração ASAAS desabilitada para empresa ${companyId}.`);
            return new Response("Forbidden: integração desabilitada.", { status: 403 });
        }

        // Comparação timing-safe para evitar timing attacks
        if (!timingSafeEqual(token, integration.webhook_token || '')) {
            await logWebhook(supabase, Number(companyId), eventType, asaasEventId, rawPayload, false,
                "Token de webhook inválido.");
            return new Response("Unauthorized: token inválido.", { status: 401 });
        }

        // ─── 2. Idempotência: verificar se este evento já foi processado ────
        const { data: existingLog } = await supabase
            .from("logs_webhook")
            .select("id, processed_ok")
            .eq("provider", "asaas")
            .eq("asaas_event_id", asaasEventId)
            .eq("company_id", companyId)
            .maybeSingle();

        if (existingLog?.processed_ok) {
            console.log(`[Webhook] Evento duplicado ignorado: ${asaasEventId} (company: ${companyId})`);
            return new Response("OK (duplicate)", { status: 200 });
        }

        // ─── 3. Processar eventos de pagamento ──────────────────────────────
        let processedOk = true;
        let errorMsg: string | null = null;

        if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
            try {
                const asaasPaymentId = payment?.id as string;
                if (!asaasPaymentId) throw new Error("payment.id ausente no payload.");

                // Buscar cobrança LOCAL filtrando SOMENTE pela empresa correta (isolamento total)
                const { data: charge, error: chargeErr } = await supabase
                    .from("pix_charges")
                    .select("*, installment:installments(*, loan:loans(*))")
                    .eq("asaas_payment_id", asaasPaymentId)
                    .eq("company_id", companyId)       // ← nunca atualiza outra empresa
                    .maybeSingle();

                if (chargeErr) throw new Error(`Erro ao buscar cobrança: ${chargeErr.message}`);

                if (!charge) {
                    console.warn(`[Webhook] Cobrança ASAAS ${asaasPaymentId} não encontrada para empresa ${companyId}.`);
                    // Retornar 200 para ASAAS não reenviar; mas logamos como warning
                    processedOk = true;
                    errorMsg = `Cobrança ${asaasPaymentId} não encontrada localmente para empresa ${companyId}`;
                } else if (charge.status !== "PAID") {

                    // 3a. Atualizar status da cobrança
                    await supabase.from("pix_charges")
                        .update({ status: "PAID", paid_at: new Date().toISOString() })
                        .eq("id", charge.id);

                    // 3b. Atualizar status da parcela (SOMENTE desta empresa)
                    await supabase.from("installments")
                        .update({ status: "paga" })
                        .eq("id", charge.installment_id)
                        .eq("company_id", companyId);   // ← dupla proteção

                    // 3c. Registrar pagamento
                    const paymentDate = (payment?.paymentDate as string) || new Date().toISOString().split('T')[0];
                    const amount = (payment?.value as number) || charge.amount;
                    const loanId = charge.installment?.loanid || charge.installment?.loan_id || charge.installment?.loan?.id;
                    const clientId = charge.installment?.loan?.clientid || charge.installment?.loan?.client_id;

                    await supabase.from("payments").insert({
                        installment_id: charge.installment_id,
                        installmentid: charge.installment_id,
                        loan_id: loanId,
                        client_id: clientId,
                        company_id: companyId,           // ← isolamento garantido
                        amount,
                        payment_date: paymentDate,
                        method: 'PIX',
                        created_at: new Date().toISOString()
                    });

                    console.log(`[Webhook] ✅ Parcela ${charge.installment_id} baixada para empresa ${companyId}.`);
                } else {
                    console.log(`[Webhook] Parcela ${charge.installment_id} já estava paga.`);
                }
            } catch (e) {
                processedOk = false;
                errorMsg = e.message;
                console.error(`[Webhook] Erro ao processar ${eventType}:`, e.message);
            }
        }

        // ─── 4. Registrar log do webhook ────────────────────────────────────
        await logWebhook(supabase, Number(companyId), eventType, asaasEventId, rawPayload, processedOk, errorMsg);

        return new Response("OK", { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error("[Webhook] Erro crítico:", err.message);
        // Tentar logar mesmo em caso de erro crítico
        try {
            await logWebhook(supabase, companyId ? Number(companyId) : null, eventType, asaasEventId,
                rawPayload, false, err.message);
        } catch (_) { /* silenciar erros de log para não mascarar o erro original */ }

        // Retornar 200 para ASAAS não reenfileirar (erro está no log)
        return new Response("OK (with internal error)", { status: 200 });
    }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logWebhook(
    supabase: ReturnType<typeof createClient>,
    companyId: number | null,
    eventType: string,
    asaasEventId: string,
    payload: unknown,
    processedOk: boolean,
    errorMessage: string | null = null
): Promise<void> {
    try {
        await supabase.from("logs_webhook").upsert([{
            company_id: companyId,
            provider: "asaas",
            event_type: eventType,
            asaas_event_id: asaasEventId,
            payload,
            received_at: new Date().toISOString(),
            processed_ok: processedOk,
            error_message: errorMessage
        }], { onConflict: 'provider,asaas_event_id' });
    } catch (e) {
        console.warn("[Webhook Log] Falha ao salvar log:", e.message);
    }
}

/** Comparação timing-safe simples para tokens de comprimento fixo */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
