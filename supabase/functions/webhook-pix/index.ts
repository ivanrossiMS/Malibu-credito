import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("DB_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("DB_SERVICE_KEY")!;

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

        // 1. Idempotency Check
        const { data: existingEvent } = await supabase
            .from("webhook_events")
            .select("*")
            .eq("event_id", event_id)
            .maybeSingle();

        if (existingEvent) {
            return new Response("OK (Duplicate)", { status: 200, headers: corsHeaders });
        }

        // 2. Log Event
        await supabase.from("webhook_events").insert({
            provider: "ASAAS",
            event_id: event_id,
            payload: payload,
            status: "PENDING"
        });

        // 3. Process ONLY payment confirmation events
        if (eventType === "PAYMENT_RECEIVED" || eventType === "PAYMENT_CONFIRMED") {
            const asaasPaymentId = payment.id;

            // Find our local charge
            const { data: charge, error: chargeError } = await supabase
                .from("pix_charges")
                .select("*")
                .eq("txid", asaasPaymentId)
                .single();

            if (chargeError || !charge) {
                console.warn("Charge not found locally for Asaas payment:", asaasPaymentId);
                // We acknowledge but don't error out, maybe it's not a PIX charge from this system
                return new Response("OK (Not Found Locally)", { status: 200, headers: corsHeaders });
            }

            if (charge.status !== "PAID") {
                // 4. Update Charge Status
                await supabase.from("pix_charges").update({
                    status: "PAID",
                    paid_at: new Date().toISOString()
                }).eq("id", charge.id);

                // 5. Update Installment Status
                await supabase.from("installments").update({
                    status: "PAID"
                }).eq("id", charge.installment_id);

                console.log(`Successfully settled installment ${charge.installment_id} via Asaas Webhook.`);
            }
        }

        // 6. Success
        await supabase.from("webhook_events").update({ status: "PROCESSED" }).eq("event_id", event_id);

        return new Response("OK", { status: 200, headers: corsHeaders });

    } catch (err) {
        console.error("Webhook processing error:", err.message);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
