import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 读取 emotion_health_assessments.claim_code。
 * 新插入的记录由数据库触发器自动生成；历史/缺失的会调用 RPC 补写。
 */
export function useEmotionHealthClaimCode(assessmentId?: string | null) {
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
          .from("emotion_health_assessments")
          .select("claim_code")
          .eq("id", assessmentId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data?.claim_code) {
          setClaimCode(data.claim_code);
          return;
        }
        // 兜底：极少数历史记录漏填，调用 RPC 补写
        const { data: gen, error: genErr } = await sb.rpc(
          "generate_emotion_health_claim_code"
        );
        if (genErr || !gen) throw genErr || new Error("generate failed");
        const { data: updated, error: updErr } = await sb
          .from("emotion_health_assessments")
          .update({ claim_code: gen })
          .eq("id", assessmentId)
          .is("claim_code", null)
          .select("claim_code");
        if (updErr) throw updErr;
        if (cancelled) return;
        if (!updated || updated.length === 0) {
          const { data: again } = await sb
            .from("emotion_health_assessments")
            .select("claim_code")
            .eq("id", assessmentId)
            .maybeSingle();
          setClaimCode(again?.claim_code ?? gen);
        } else {
          setClaimCode(updated[0].claim_code);
        }
      } catch (e) {
        console.warn("[useEmotionHealthClaimCode] failed", e);
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
