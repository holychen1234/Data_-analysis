const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AI_API_TOKEN = Deno.env.get("AI_API_TOKEN_29132ba50817");
    if (!AI_API_TOKEN) {
      throw new Error("AI_API_TOKEN is not configured");
    }

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 10) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits. You need at least 10 credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { file_name, headers, rows, summary, requirements } = await req.json();

    const reportTitle = `Analysis of ${file_name}`;
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert({
        user_id: user.id,
        title: reportTitle,
        file_name,
        status: "processing",
        credits_used: 10,
      })
      .select()
      .single();

    if (reportError) throw reportError;

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
  "summary": "A comprehensive paragraph summarizing the key findings from the data analysis",
  "stats": [
    { "label": "Stat Name", "value": "value or number", "change": "+X% vs avg", "trend": "up|down|neutral" }
  ],
  "charts": [
    {
      "title": "Chart Title",
      "type": "bar|line|pie|area|radar",
      "data": [{"name": "Category", "value": 100, ...}],
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
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ]
}

Requirements:
- Generate 3-6 meaningful statistics
- Generate 2-4 relevant charts (choose appropriate chart types based on data)
- Generate 1-2 summary tables with the most important data
- Generate 3-6 actionable insights
- All chart data must use actual values from the dataset
- For pie charts, use "nameKey" and "valueKey" instead of "xKey"/"yKeys"
- Return ONLY the JSON object, nothing else`;

    console.log("Calling AI API for analysis...");

    const aiResponse = await fetch("https://api.enter.pro/code/api/v1/ai/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4.5",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 8000,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      throw new Error("AI analysis failed. Please try again.");
    }

    const aiData = await aiResponse.json();
    console.log("AI response received successfully");
    
    const textContent = aiData.content?.find((c: { type: string }) => c.type === "text")?.text || "";

    let reportData;
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", textContent.substring(0, 500));
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      throw new Error("Failed to parse analysis results");
    }

    await supabase
      .from("reports")
      .update({
        status: "completed",
        report_data: reportData,
        report_html: JSON.stringify(reportData),
      })
      .eq("id", report.id);

    await supabase
      .from("profiles")
      .update({ credits: profile.credits - 10 })
      .eq("id", user.id);

    await supabase.from("credit_transactions").insert({
      user_id: user.id,
      amount: -10,
      type: "consume",
      description: `Analysis: ${reportTitle}`,
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
