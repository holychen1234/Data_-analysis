const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isSandboxMode(): boolean {
  return !Deno.env.get("ALIPAY_PRIVATE_KEY") && !Deno.env.get("WECHAT_API_KEY");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id;
    const confirmPayment = body.confirm === true;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Missing order_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch order (must belong to this user)
    const { data: order } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already completed
    if (order.status === "paid") {
      return new Response(
        JSON.stringify({ status: "paid", credits_added: order.credits }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status === "failed" || order.status === "expired") {
      return new Response(
        JSON.stringify({ status: order.status }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiry
    if (new Date(order.expires_at) < new Date()) {
      await supabase.from("payment_orders").update({ status: "expired" }).eq("id", order.id);
      return new Response(
        JSON.stringify({ status: "expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sandbox = isSandboxMode();

    // Sandbox: confirm if requested
    if (sandbox && confirmPayment) {
      return await processPaymentSuccess(supabase, order, user.id, corsHeaders);
    }

    if (!sandbox) {
      // TODO: query real payment status
      // Alipay: alipay.trade.query
      // WeChat: /pay/orderquery
    }

    return new Response(
      JSON.stringify({ status: "pending" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function processPaymentSuccess(
  supabase: ReturnType<typeof import("https://esm.sh/@supabase/supabase-js@2").createClient>,
  order: Record<string, unknown>,
  userId: string,
  corsHeaders: Record<string, string>
) {
  await supabase.from("payment_orders").update({
    status: "paid",
    paid_at: new Date().toISOString(),
  }).eq("id", order.id as string);

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  const newCredits = ((profile as { credits: number } | null)?.credits || 0) + (order.credits as number);

  await supabase.from("profiles").update({ credits: newCredits }).eq("id", userId);

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: order.credits,
    type: "recharge",
    description: `购买套餐充值 ${order.credits} 积分（订单 ${order.order_no}）`,
  });

  console.log(`Payment success: order=${order.order_no}, user=${userId}, credits=${order.credits}`);

  return new Response(
    JSON.stringify({ status: "paid", credits_added: order.credits }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
