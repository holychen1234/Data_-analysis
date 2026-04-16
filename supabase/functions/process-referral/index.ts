const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { referral_code } = await req.json();
    if (!referral_code) {
      return new Response(JSON.stringify({ error: "Missing referral_code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check the new user hasn't already used a referral code
    const { data: existingUsage } = await supabase
      .from("referral_usages")
      .select("id")
      .eq("new_user_id", user.id)
      .maybeSingle();

    if (existingUsage) {
      return new Response(JSON.stringify({ error: "You have already used a referral code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find referral code
    const { data: codeRecord } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("code", referral_code.toUpperCase())
      .maybeSingle();

    if (!codeRecord) {
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Can't refer yourself
    if (codeRecord.referrer_id === user.id) {
      return new Response(JSON.stringify({ error: "Cannot use your own referral code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const REFERRAL_BONUS = 300;

    // Record usage
    await supabase.from("referral_usages").insert({
      referral_code_id: codeRecord.id,
      new_user_id: user.id,
      credits_granted: REFERRAL_BONUS,
    });

    // Get referrer's current credits
    const { data: referrerProfile } = await supabase
      .from("profiles")
      .select("credits, display_name")
      .eq("id", codeRecord.referrer_id)
      .single();

    if (referrerProfile) {
      // Grant 300 credits to referrer
      await supabase
        .from("profiles")
        .update({ credits: referrerProfile.credits + REFERRAL_BONUS })
        .eq("id", codeRecord.referrer_id);

      await supabase.from("credit_transactions").insert({
        user_id: codeRecord.referrer_id,
        amount: REFERRAL_BONUS,
        type: "recharge",
        description: `推广奖励：新用户 ${user.email} 通过您的链接注册`,
      });
    }

    // Update referral code stats
    await supabase
      .from("referral_codes")
      .update({
        used_count: codeRecord.used_count + 1,
        total_credits_earned: codeRecord.total_credits_earned + REFERRAL_BONUS,
      })
      .eq("id", codeRecord.id);

    console.log(`Referral processed: code=${referral_code}, new_user=${user.id}, referrer=${codeRecord.referrer_id}`);

    return new Response(
      JSON.stringify({ success: true, credits_granted: REFERRAL_BONUS }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
