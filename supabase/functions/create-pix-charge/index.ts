import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("DB_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("DB_SERVICE_KEY")!;

serve(async (req) => {
    const { installment_id } = await req.json();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Get Installment
    const { data: installment, error: instError } = await supabase
        .from("installments")
        .select("*, loan:loans(*, client:clients(*))")
        .eq("id", installment_id)
        .single();

    if (instError || !installment) {
        return new Response(JSON.stringify({ error: "Installment not found" }), { status: 404 });
    }

    // 2. Check if already has a CREATED charge
    const { data: existingCharge } = await supabase
        .from("pix_charges")
        .select("*")
        .eq("installment_id", installment_id)
        .eq("status", "CREATED")
        .maybeSingle();

    if (existingCharge) {
        return new Response(JSON.stringify(existingCharge), { status: 200 });
    }

    // 3. Create PIX Charge at Provider (Generic Abstaction)
    const txid = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const amount = installment.installment_value;

    // NOTE: Here you would call your PIX provider API (MercadoPago, Efí, etc.)
    // We will simulate a successful creation
    const mockCharge = {
        installment_id,
        txid,
        amount,
        status: "CREATED",
        copy_paste: "00020126360014BR.GOV.BCB.PIX0114" + txid,
        qr_code_url: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=example",
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
    };

    const { data: newCharge, error: chargeError } = await supabase
        .from("pix_charges")
        .insert(mockCharge)
        .select()
        .single();

    if (chargeError) {
        return new Response(JSON.stringify({ error: chargeError.message }), { status: 500 });
    }

    return new Response(JSON.stringify(newCharge), { status: 200 });
});
