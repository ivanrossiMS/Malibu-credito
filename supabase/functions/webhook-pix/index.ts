import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("DB_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("DB_SERVICE_KEY")!;

serve(async (req) => {
    const payload = await req.json();
    const event_id = payload.id; // Assume the provider sends a unique event id

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Idempotency Check
    const { data: existingEvent } = await supabase
        .from("webhook_events")
        .select("*")
        .eq("event_id", event_id)
        .maybeSingle();

    if (existingEvent) {
        return new Response("OK", { status: 200 });
    }

    // 2. Log Event
    await supabase.from("webhook_events").insert({
        provider: "GENERIC",
        event_id: event_id,
        payload: payload,
        status: "PENDING"
    });

    try {
        // 3. Process Payment
        const txid = payload.txid; // Find the txid in the payload
        const { data: charge, error: chargeError } = await supabase
            .from("pix_charges")
            .select("*")
            .eq("txid", txid)
            .single();

        if (chargeError || !charge) {
            throw new Error("Charge not found for txid: " + txid);
        }

        if (charge.status === "PAID") {
            return new Response("OK", { status: 200 });
        }

        // 4. Update Charge
        await supabase.from("pix_charges").update({
            status: "PAID",
            paid_at: new Date().toISOString()
        }).eq("id", charge.id);

        // 5. Update Installment
        await supabase.from("installments").update({
            status: "PAID"
        }).eq("id", charge.installment_id);

        // 6. Check Loan Status (Optional/Triggers could do this better)
        // For now we assume logic is handled by service or triggers in DB.

        // 7. Success
        await supabase.from("webhook_events").update({ status: "PROCESSED" }).eq("event_id", event_id);

        return new Response("OK", { status: 200 });
    } catch (err) {
        await supabase.from("webhook_events").update({ status: "ERROR", error_message: err.message }).eq("event_id", event_id);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
});
