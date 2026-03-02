import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const payload = await req.json();

        // Asaas Webhook Event Structure: { event: "PAYMENT_RECEIVED", payment: { id: "pay_...", ... } }
        const eventType = payload.event;
        const payment = payload.payment;
        const event_id = payload.id || `evt_${Date.now()}`;

        console.log(`Received Webhook Event: ${eventType} for Payment ID: ${payment?.id}`);

        // 1. Idempotency Check (Optional logging to webhook_events if exists)
        try {
            const { data: existingEvent } = await supabase
                .from("webhook_events")
                .select("*")
                .eq("event_id", event_id)
                .maybeSingle();

            if (existingEvent) {
                return new Response("OK (Duplicate)", { status: 200, headers: corsHeaders });
            }

            // Log Event
            await supabase.from("webhook_events").insert({
                provider: "ASAAS",
                event_id: event_id,
                payload: payload,
                status: "PENDING"
            });
        } catch (e) {
            console.warn("webhook_events table might be missing, skipping log:", e.message);
        }

        // 2. Process ONLY payment confirmation events
        if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
            const asaasPaymentId = payment.id;

            // Find our local charge with related info
            const { data: charge, error: chargeError } = await supabase
                .from("pix_charges")
                .select("*, installment:installments(*, loan:loans(*))")
                .eq("txid", asaasPaymentId)
                .maybeSingle();

            if (chargeError || !charge) {
                console.warn("Charge not found locally for Asaas payment:", asaasPaymentId);
                return new Response("OK (Not Found Locally)", { status: 200, headers: corsHeaders });
            }

            if (charge.status !== "PAID") {
                // 3. Update Charge Status
                await supabase.from("pix_charges").update({
                    status: "PAID",
                    paid_at: new Date().toISOString()
                }).eq("id", charge.id);

                // 4. Update Installment Status
                await supabase.from("installments").update({
                    status: "PAID"
                }).eq("id", charge.installment_id);

                // 5. Register Payment Record (with company_id from charge context)
                const paymentDate = payment.paymentDate || new Date().toISOString().split('T')[0];
                const amount = payment.value || charge.amount;

                // Get ID references from charge relations
                const loanId = charge.installment?.loanid || charge.installment?.loan_id || charge.installment?.loan?.id;
                const clientId = charge.installment?.loan?.clientid || charge.installment?.loan?.client_id;
                const companyId = charge.installment?.company_id || charge.installment?.loan?.company_id;

                await supabase.from("payments").insert({
                    installment_id: charge.installment_id,
                    installmentid: charge.installment_id,
                    loan_id: loanId,
                    client_id: clientId,
                    company_id: companyId,
                    amount: amount,
                    payment_date: paymentDate,
                    method: 'PIX',
                    created_at: new Date().toISOString()
                });

                console.log(`Successfully settled installment ${charge.installment_id} for Company ${companyId} via Asaas Webhook.`);
            }
        }

        // 6. Finalize Log if table exists
        try {
            await supabase.from("webhook_events").update({ status: "PROCESSED" }).eq("event_id", event_id);
        } catch (e) { /* ignore missing table */ }

        return new Response("OK", { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error("Webhook processing error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 200, // Return 200 to Asaas to avoid retries on code errors, but log it
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
