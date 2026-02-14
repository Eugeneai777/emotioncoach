import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find all unanalyzed entries for this user
    const { data: unanalyzedEntries, error: fetchError } = await supabase
      .from("gratitude_entries")
      .select("id, content")
      .eq("user_id", user.id)
      .eq("ai_analyzed", false)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch entries" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!unanalyzedEntries || unanalyzedEntries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No entries to analyze", success: 0, failed: 0, total: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${unanalyzedEntries.length} unanalyzed entries for user ${user.id}`);

    // Deduct 1 point once for the entire batch (not per entry)
    const deductResponse = await fetch(`${supabaseUrl}/functions/v1/deduct-quota`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feature_key: "gratitude_analysis",
        source: "batch_gratitude_analysis",
      }),
    });

    if (!deductResponse.ok) {
      const deductError = await deductResponse.json().catch(() => ({}));
      console.error("Quota deduction failed:", deductError);
      return new Response(
        JSON.stringify({ error: "余额不足", insufficient_quota: true }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Quota deducted successfully (1 point for batch)");

    let successCount = 0;
    let failedCount = 0;
    const results: { entryId: string; success: boolean; error?: string }[] = [];

    // 并行处理，每批最多 5 条，避免超时
    const BATCH_SIZE = 5;
    
    const analyzeEntry = async (entry: { id: string; content: string }) => {
      try {
        const analyzeResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-gratitude-entry`, {
          method: "POST",
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            entryId: entry.id,
            content: entry.content,
            skipDeduct: true,
          }),
        });

        if (analyzeResponse.ok) {
          return { entryId: entry.id, success: true };
        } else {
          const errorData = await analyzeResponse.json().catch(() => ({}));
          return { entryId: entry.id, success: false, error: errorData.error || "Unknown error", insufficient_quota: errorData.insufficient_quota };
        }
      } catch (err) {
        return { entryId: entry.id, success: false, error: String(err) };
      }
    };

    // 分批并行处理
    for (let i = 0; i < unanalyzedEntries.length; i += BATCH_SIZE) {
      const batch = unanalyzedEntries.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}, entries: ${batch.length}`);
      
      const batchResults = await Promise.allSettled(
        batch.map(entry => analyzeEntry(entry))
      );

      let stopProcessing = false;
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          const r = result.value;
          results.push({ entryId: r.entryId, success: r.success, error: r.error });
          if (r.success) {
            successCount++;
            console.log(`Successfully analyzed entry ${r.entryId}`);
          } else {
            failedCount++;
            console.error(`Failed to analyze entry ${r.entryId}:`, r.error);
            // 如果余额不足，停止后续批次
            if ((r as any).insufficient_quota) {
              console.log("Insufficient quota, stopping batch analysis");
              stopProcessing = true;
            }
          }
        } else {
          // Promise rejected
          failedCount++;
          console.error(`Promise rejected:`, result.reason);
        }
      }

      if (stopProcessing) break;
    }

    // 分析成功后，触发智能通知
    if (successCount > 0) {
      try {
        // 统计主要标签分布
        const themeCount: Record<string, number> = {};
        for (const result of results) {
          if (result.success) {
            // 获取该条目的标签
            const { data: entryData } = await supabase
              .from("gratitude_entries")
              .select("themes")
              .eq("id", result.entryId)
              .single();
            
            if (entryData?.themes) {
              (entryData.themes as string[]).forEach((theme: string) => {
                themeCount[theme] = (themeCount[theme] || 0) + 1;
              });
            }
          }
        }
        
        // 找出最高频的维度
        const sortedThemes = Object.entries(themeCount).sort(([,a], [,b]) => b - a);
        const topDimension = sortedThemes[0]?.[0] || '';
        
        // 找出最低频/缺失的维度
        const allDimensions = ['CREATION', 'RELATIONSHIPS', 'MONEY', 'HEALTH', 'INNER', 'JOY', 'IMPACT'];
        const weakDimension = allDimensions.find(d => !themeCount[d] || themeCount[d] === 0) 
          || sortedThemes[sortedThemes.length - 1]?.[0] || '';

        await fetch(`${supabaseUrl}/functions/v1/trigger-notifications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({
            trigger_type: 'after_gratitude_sync',
            user_id: user.id,
            context: {
              analyzed_count: successCount,
              total_entries: unanalyzedEntries.length,
              top_dimension: topDimension,
              weak_dimension: weakDimension,
              dimension_count: Object.keys(themeCount).length
            }
          })
        });
        console.log("智能通知已触发");
      } catch (notifyError) {
        console.error("触发通知失败（不影响主流程）:", notifyError);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Analyzed ${successCount} entries`,
        success: successCount,
        failed: failedCount,
        total: unanalyzedEntries.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in batch-analyze-gratitude:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
