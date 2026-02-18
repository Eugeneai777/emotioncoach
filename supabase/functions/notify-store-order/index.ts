import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNo, productName, price, partnerId, buyerName, buyerPhone, buyerAddress } = await req.json();

    if (!partnerId || !orderNo) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get partner info to find notification target
    const { data: partner } = await supabase
      .from("partners")
      .select("id, user_id, company_name, contact_person")
      .eq("id", partnerId)
      .single();

    if (!partner) {
      return new Response(JSON.stringify({ error: "Partner not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create in-app notification if partner has a user account
    if (partner.user_id) {
      await supabase.from("smart_notifications").insert({
        user_id: partner.user_id,
        notification_type: "reminder",
        scenario: "store_new_order",
        title: "🛒 新商城订单",
        message: `您的商品「${productName}」收到新订单，金额 ¥${price}。买家：${buyerName}，请尽快处理发货。`,
        icon: "ShoppingCart",
        action_text: "查看订单",
        action_type: "navigate",
        action_data: { path: "/partner" },
        priority: 4,
        coach_type: "general",
      });
    }

    // Try sending WeChat template notification (non-blocking)
    try {
      if (partner.user_id) {
        const { data: secrets } = await supabase
          .from("user_integration_secrets")
          .select("wechat_openid")
          .eq("user_id", partner.user_id)
          .single();

        if (secrets?.wechat_openid) {
          await supabase.functions.invoke("send-wechat-template-message", {
            body: {
              openid: secrets.wechat_openid,
              templateType: "default",
              data: {
                first: "您收到一笔新的商城订单",
                keyword1: productName,
                keyword2: `¥${price}`,
                keyword3: `${buyerName} ${buyerPhone}`,
                keyword4: buyerAddress || "未填写",
                remark: `订单号: ${orderNo}，请尽快发货`,
              },
            },
          });
        }
      }
    } catch (e) {
      console.error("WeChat notification failed (non-blocking):", e);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-store-order error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
