import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, shippingInfo } = await req.json();

    if (!orderNo || !shippingInfo) {
      return new Response(
        JSON.stringify({ error: "Missing orderNo or shippingInfo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { buyerName, buyerPhone, buyerAddress } = shippingInfo;
    if (!buyerName || !buyerPhone || !buyerAddress) {
      return new Response(
        JSON.stringify({ error: "Incomplete shipping info" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update order shipping info using service_role to bypass RLS
    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        buyer_address: buyerAddress,
        shipping_status: "pending",
      })
      .eq("order_no", orderNo)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Update error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, orderId: data?.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
