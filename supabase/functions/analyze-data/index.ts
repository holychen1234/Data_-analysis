const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pre-compute rich statistics for each column
function computeColumnStats(headers: string[], rows: Record<string, unknown>[]) {
  const stats: Record<string, unknown> = {};
  for (const col of headers) {
    const values = rows.map((r) => r[col]).filter((v) => v !== null && v !== undefined && v !== "");
    const numericValues = values
      .map((v) => parseFloat(String(v).replace(/,/g, "")))
      .filter((v) => !isNaN(v));

    if (numericValues.length > values.length * 0.5) {
      // Numeric column
      const sorted = [...numericValues].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const mean = sum / sorted.length;
      const median = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / sorted.length;
      const stdDev = Math.sqrt(variance);
      stats[col] = {
        type: "numeric",
        count: sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        sum: Math.round(sum * 100) / 100,
        mean: Math.round(mean * 100) / 100,
        median: Math.round(median * 100) / 100,
        std_dev: Math.round(stdDev * 100) / 100,
        q1: sorted[Math.floor(sorted.length * 0.25)],
        q3: sorted[Math.floor(sorted.length * 0.75)],
      };
    } else {
      // Categorical column
      const freq: Record<string, number> = {};
      for (const v of values) {
        const key = String(v);
        freq[key] = (freq[key] || 0) + 1;
      }
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
      stats[col] = {
        type: "categorical",
        count: values.length,
        unique_count: sorted.length,
        top_values: sorted.slice(0, 15).map(([name, count]) => ({
          name,
          count,
          pct: Math.round((count / values.length) * 1000) / 10,
        })),
      };
    }
  }
  return stats;
}

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

    // Fetch model config
    let modelConfig;
    if (model_id) {
      const { data } = await supabase
        .from("ai_models")
        .select("*")
        .eq("id", model_id)
        .eq("is_active", true)
        .maybeSingle();
      modelConfig = data;
    }
    if (!modelConfig) {
      const { data } = await supabase
        .from("ai_models")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      modelConfig = data;
    }
    if (!modelConfig) {
      return new Response(
        JSON.stringify({ error: "No active AI model configured. Contact admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const costPerAnalysis = modelConfig.cost_per_analysis || 100;

    // Check credits
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < costPerAnalysis) {
      return new Response(
        JSON.stringify({ error: `积分不足。需要 ${costPerAnalysis}，当前余额 ${profile?.credits || 0}。` }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create report
    const reportTitle = `${file_name} 分析报告`;
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

    // ── Pre-compute statistics ──────────────────────────────────────────────
    const columnStats = computeColumnStats(headers, rows);

    // Send up to 100 rows as sample
    const sampleRows = rows.slice(0, 100);

    // Identify numeric and categorical columns
    const numericCols = headers.filter((h: string) => (columnStats[h] as Record<string, unknown>)?.type === "numeric");
    const categoricalCols = headers.filter((h: string) => (columnStats[h] as Record<string, unknown>)?.type === "categorical");

    // ── Build prompt ────────────────────────────────────────────────────────
    const systemPrompt = `You are an expert data analyst. Your job is to analyze datasets and produce accurate, insightful reports in a specific JSON format. You MUST:
- Use the pre-computed statistics provided — do NOT re-estimate or round numbers differently
- Generate charts using actual data values from column statistics or sample rows
- Provide actionable, specific insights (not generic statements)
- Always respond with ONLY a valid JSON object — no markdown, no explanation, no code blocks
- All text fields (summary, labels, insights) should be written in Chinese (中文)`;

    const userPrompt = `## 数据集信息
- 文件名: ${file_name}
- 总行数: ${summary.totalRows}，总列数: ${summary.totalColumns}
- 列名: ${headers.join(", ")}
- 数值型列: ${numericCols.join(", ") || "无"}
- 分类型列: ${categoricalCols.join(", ") || "无"}

## 预计算统计数据（精确值，请直接使用）
${JSON.stringify(columnStats, null, 2)}

## 数据样本（前 ${sampleRows.length} 行）
${JSON.stringify(sampleRows, null, 2)}

## 用户分析需求
${requirements || "请进行全面的数据分析，包括基本统计、分布分析、趋势分析和关键洞察。"}

## 输出要求
返回一个 JSON 对象，结构如下（请严格遵守字段名）：

{
  "summary": "3-5句话的综合分析摘要，包含最重要的发现，使用精确数字",
  "stats": [
    {
      "label": "指标名称",
      "value": "具体数值（带单位）",
      "change": "与均值/总量对比说明",
      "trend": "up | down | neutral"
    }
  ],
  "charts": [
    {
      "title": "图表标题",
      "type": "bar | line | pie | area",
      "description": "该图表揭示了什么规律",
      "data": [
        { "name": "类别名", "value": 数字, "value2": 数字 }
      ],
      "xKey": "name",
      "yKeys": ["value"],
      "nameKey": "name",
      "valueKey": "value"
    }
  ],
  "tables": [
    {
      "title": "表格标题",
      "description": "表格说明",
      "headers": ["列1", "列2", "列3"],
      "rows": [["值1", "值2", "值3"]]
    }
  ],
  "insights": [
    "洞察1：具体发现（引用精确数字）",
    "洞察2：具体发现（引用精确数字）"
  ],
  "recommendations": [
    "建议1：基于分析的具体行动建议",
    "建议2：基于分析的具体行动建议"
  ]
}

## 规范要求
- stats: 生成 4-7 个核心指标，直接使用预计算中的精确值
- charts: 生成 3-5 个图表
  - 对于数值型列：使用 bar 或 line 图展示分布/趋势
  - 对于分类型列：使用 pie 或 bar 图展示构成比例，数据来自 top_values
  - 多系列图表：yKeys 可包含多个字段（如 ["value", "value2"]），data 中需包含对应字段
  - pie 图的 data 必须使用 nameKey 和 valueKey
  - 每个图表的 data 数组最多 20 个数据点
- tables: 生成 1-3 个表格，展示关键汇总数据
- insights: 5-8 条洞察，每条必须包含具体数字
- recommendations: 3-5 条可行建议

仅返回 JSON，不要有任何其他内容。`;

    console.log("Calling AI:", modelConfig.model_id, "rows:", sampleRows.length);

    const apiKey = Deno.env.get(modelConfig.api_key_env);
    if (!apiKey) {
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      return new Response(
        JSON.stringify({ error: `API密钥未配置 (${modelConfig.api_key_env})，请联系管理员。` }),
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
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        stream: false,
        max_tokens: modelConfig.max_tokens || 8000,
        temperature: 0.1, // Low temperature for accurate, deterministic output
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      throw new Error(`AI分析失败 (${aiResponse.status})，请稍后重试。`);
    }

    const aiData = await aiResponse.json();

    const textContent =
      aiData.content?.find((c: { type: string }) => c.type === "text")?.text ||
      aiData.choices?.[0]?.message?.content ||
      "";

    console.log("AI response length:", textContent.length);

    let reportData;
    try {
      // Strip any markdown code blocks if present
      const cleaned = textContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI响应中未找到JSON数据");
      }
    } catch (parseError) {
      console.error("Parse error. Raw:", textContent.substring(0, 1000));
      await supabase.from("reports").update({ status: "failed" }).eq("id", report.id);
      throw new Error("解析分析结果失败，请重试。");
    }

    // Save report
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
      description: `分析报告：${reportTitle} (${modelConfig.name})`,
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
