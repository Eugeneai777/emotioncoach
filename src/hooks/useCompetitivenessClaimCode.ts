import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 读取 competitiveness_assessments.claim_code（35+ 女性竞争力测评）。
 * 新插入由触发器生成；历史/缺失会调用 RPC 补写。
 */
export function useCompetitivenessClaimCode(assessmentId?: string | null) {
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!assessmentId) {
      setClaimCode(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const sb = supabase as any;
        const { data, error } = await sb
          .from("competitiveness_assessments")
          .select("claim_code")
          .eq("id", assessmentId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data?.claim_code) {
          setClaimCode(data.claim_code);
          return;
        }
        const { data: gen, error: genErr } = await sb.rpc(
          "generate_competitiveness_claim_code"
        );
        if (genErr || !gen) throw genErr || new Error("generate failed");
        const { data: updated, error: updErr } = await sb
          .from("competitiveness_assessments")
          .update({ claim_code: gen })
          .eq("id", assessmentId)
          .is("claim_code", null)
          .select("claim_code");
        if (updErr) throw updErr;
        if (cancelled) return;
        if (!updated || updated.length === 0) {
          const { data: again } = await sb
            .from("competitiveness_assessments")
            .select("claim_code")
            .eq("id", assessmentId)
            .maybeSingle();
          setClaimCode(again?.claim_code ?? gen);
        } else {
          setClaimCode(updated[0].claim_code);
        }
      } catch (e) {
        console.warn("[useCompetitivenessClaimCode] failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  return { claimCode, loading };
}
