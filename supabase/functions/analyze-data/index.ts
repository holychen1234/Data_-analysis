const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { file_name, headers, rows, summary, requirements, model_id } = await req.json();

    // Fetch model config from database
    let modelConfig;
    if (model_id) {
      const { data } = await supabase
        .from("ai_models")
        .select("*")
        .eq("id", model_id)
        .eq("is_active", true)
        .single();
      modelConfig = data;
    }
    if (!modelConfig) {
      // Fallback to first active model
      const { data } = await supabase
        .from("ai_models")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();
      modelConfig = data;
    }
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: "No active AI model configured. Contact admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const costPerAnalysis = modelConfig.cost_per_analysis || 10;

    // Check user credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < costPerAnalysis) {
      return new Response(
        JSON.stringify({ error: `Insufficient credits. Need ${costPerAnalysis}, have ${profile?.credits || 0}.` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create report record
    const reportTitle = `Analysis of ${file_name}`;
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        title: reportTitle,
        file_name,
        status: "processing",
        credits_used: costPerAnalysis,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    // Build prompt
    const dataPreview = JSON.stringify(rows.slice(0, 30), null, 2);
    const prompt = `You are a professional data analyst. Analyze the following dataset and return a detailed analysis report as a JSON object.

## Dataset Info
- File: ${file_name}
- Rows: ${summary.totalRows}, Columns: ${summary.totalColumns}
- Headers: ${headers.join(", ")}
- Column Types: ${JSON.stringify(summary.columnTypes)}

## Data Preview (first 30 rows):
${dataPreview}

## User Requirements:
${requirements}

## Output Format
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "summary": "A comprehensive paragraph summarizing the key findings",
  "stats": [
    { "label": "Stat Name", "value": "value", "change": "+X% vs avg", "trend": "up|down|neutral" }
  ],
  "charts": [
    {
      "title": "Chart Title",
      "type": "bar|line|pie|area|radar",
      "data": [{"name": "Category", "value": 100}],
      "xKey": "name",
      "yKeys": ["value"],
      "nameKey": "name",
      "valueKey": "value"
    }
  ],
  "tables": [
    {
      "title": "Table Title",
      "headers": ["Col1", "Col2"],
      "rows": [["val1", "val2"]]
    }
  ],
  "insights": ["Key insight 1", "Key insight 2"]
}

Requirements:
- Generate 3-6 statistics, 2-4 charts, 1-2 tables, 3-6 insights
- Use actual data values
- For pie charts use "nameKey" and "valueKey"
- Return ONLY the JSON object`;

    console.log("Calling AI API:", modelConfig.model_id, "via", modelConfig.api_endpoint);

    // Get the API key from env
    const apiKey = Deno.env.get(modelConfig.api_key_env);
    if (!apiKey) {
      console.error("API key env not found:", modelConfig.api_key_env);
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      return new Response(
        JSON.stringify({ error: `API key not configured (${modelConfig.api_key_env}). Contact admin.` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch(modelConfig.api_endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelConfig.model_id,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: modelConfig.max_tokens || 8000,
        temperature: modelConfig.temperature || 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      throw new Error(`AI analysis failed (${aiResponse.status}). Please try again.`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    const textContent = aiData.content?.find((c: { type: string }) => c.type === "text")?.text
      || aiData.choices?.[0]?.message?.content
      || "";

    let reportData;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in AI response");
      }
    } catch (parseError) {
      console.error("Parse error:", textContent.substring(0, 500));
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      throw new Error("Failed to parse analysis results");
    }

    // Update report
    await supabase
      .from("reports")
      .update({
        status: "completed",
        report_data: reportData,
        report_html: JSON.stringify(reportData),
      })
      .eq("id", report.id);

    // Deduct credits
    await supabase
      .from("profiles")
      .update({ credits: profile.credits - costPerAnalysis })
      .eq("id", user.id);

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -costPerAnalysis,
      type: "consume",
      description: `Analysis: ${reportTitle} (${modelConfig.name})`,
    });

    console.log("Report completed:", report.id);

    return new Response(
      JSON.stringify({ report_id: report.id, status: "completed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
