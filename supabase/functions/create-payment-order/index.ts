const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateOrderNo(): string {
  const now = new Date();
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `${date}${time}${rand}`;
}

function isSandboxMode(): boolean {
  const alipayKey = Deno.env.get("ALIPAY_PRIVATE_KEY");
  const wechatKey = Deno.env.get("WECHAT_API_KEY");
  return !alipayKey && !wechatKey;
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

    const { package_id, payment_method } = await req.json();

    if (!package_id || !payment_method) {
      return new Response(JSON.stringify({ error: "Missing package_id or payment_method" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch package
    const { data: pkg } = await supabase
      .from("payment_packages")
      .select("*")
      .eq("id", package_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!pkg) {
      return new Response(JSON.stringify({ error: "套餐不存在或已下线" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderNo = generateOrderNo();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from("payment_orders")
      .insert({
        order_no: orderNo,
        user_id: user.id,
        package_id: pkg.id,
        credits: pkg.credits,
        amount_yuan: pkg.price_yuan,
        payment_method,
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const sandbox = isSandboxMode();
    let paymentUrl = null;
    let qrCode = null;

    if (sandbox) {
      // Sandbox mode: no real API call
      qrCode = "sandbox";
      paymentUrl = null;
      console.log(`[SANDBOX] Order created: ${orderNo}, ¥${pkg.price_yuan}, ${pkg.credits} credits`);
    } else {
      // TODO: Real payment integration
      // Alipay: call alipay.trade.precreate or alipay.trade.page.pay
      // WeChat: call /pay/unifiedorder with trade_type=NATIVE
      console.log(`[REAL] Order created: ${orderNo} - payment API integration pending`);
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        order_no: orderNo,
        credits: pkg.credits,
        amount_yuan: pkg.price_yuan,
        package_name: pkg.name,
        expires_at: expiresAt,
        payment_url: paymentUrl,
        qr_code: qrCode,
        sandbox,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
