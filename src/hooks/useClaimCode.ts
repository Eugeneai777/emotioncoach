import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 获取测评结果的 6 位领取码（partner_assessment_results.claim_code）。
 * 历史记录可能没有，则调用 RPC 生成并补写。
 */
export function useClaimCode(recordId?: string | null) {
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recordId) {
      setClaimCode(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const sb = supabase as any;
        const { data, error } = await sb
          .from("partner_assessment_results")
          .select("claim_code")
          .eq("id", recordId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        if (data?.claim_code) {
          setClaimCode(data.claim_code);
          return;
        }
        // 历史记录没有，生成并补写
        const { data: gen, error: genErr } = await sb.rpc(
          "generate_assessment_claim_code"
        );
        if (genErr || !gen) throw genErr || new Error("generate failed");
        const { data: updated, error: updErr } = await sb
          .from("partner_assessment_results")
          .update({ claim_code: gen })
          .eq("id", recordId)
          .is("claim_code", null)
          .select("claim_code");
        if (updErr) throw updErr;
        if (cancelled) return;
        // 即便并发已被别人补写，重新读一次
        if (!updated || updated.length === 0) {
          const { data: again } = await sb
            .from("partner_assessment_results")
            .select("claim_code")
            .eq("id", recordId)
            .maybeSingle();
          setClaimCode(again?.claim_code ?? gen);
        } else {
          setClaimCode(updated[0].claim_code);
        }
      } catch (e) {
        console.warn("[useClaimCode] failed", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recordId]);

  return { claimCode, loading };
}
