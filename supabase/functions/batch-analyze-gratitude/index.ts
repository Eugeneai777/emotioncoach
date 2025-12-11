import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Analyze each entry with skipDeduct: true (already deducted once above)
    for (const entry of unanalyzedEntries) {
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
          successCount++;
          results.push({ entryId: entry.id, success: true });
          console.log(`Successfully analyzed entry ${entry.id}`);
        } else {
          const errorData = await analyzeResponse.json().catch(() => ({}));
          failedCount++;
          results.push({ entryId: entry.id, success: false, error: errorData.error || "Unknown error" });
          console.error(`Failed to analyze entry ${entry.id}:`, errorData);
          
          // If insufficient quota, stop processing remaining entries
          if (errorData.insufficient_quota) {
            console.log("Insufficient quota, stopping batch analysis");
            break;
          }
        }
      } catch (err) {
        failedCount++;
        results.push({ entryId: entry.id, success: false, error: String(err) });
        console.error(`Error analyzing entry ${entry.id}:`, err);
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
