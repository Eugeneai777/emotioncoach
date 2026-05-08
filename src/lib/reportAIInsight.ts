/**
 * 7 天伴随手册 - AI 心声调用 + recordId 缓存
 *
 * 防错串关键：
 * 1. 同一 recordId 的请求复用 in-flight Promise，避免并发拉到错的洞察
 * 2. 强校验 returned.recordId === requested.recordId，否则视为脏数据抛错
 * 3. 失败兜底返回静态文案，不阻塞 PDF 生成
 */
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHandbookText } from "@/lib/handbookText";

export type HandbookType = "male_vitality" | "emotion_health";

export interface HandbookClusterInput {
  key: string;
  title: string;
  summary: string;
}

export interface HandbookInsights {
  coverNote: string;
  clusterInsights: Record<string, string>;
  day7Reflection: string;
}

export interface HandbookInsightRequest {
  recordId: string;
  type: HandbookType;
  weakestKey?: string | null;
  weakestLabel?: string | null;
  displayName?: string | null;
  totalScore?: number | null;
  clusters: HandbookClusterInput[];
}

const cache = new Map<string, Promise<HandbookInsights>>();

const FALLBACK_BY_TYPE: Record<HandbookType, HandbookInsights> = {
  male_vitality: {
    coverNote: "这 7 天，先不解决问题，先让你看清自己卡在哪。",
    clusterInsights: {},
    day7Reflection: "回头看 7 天前的你，再决定下一步——可以一个人继续，也可以让顾问陪你走下一程。",
  },
  emotion_health: {
    coverNote: "这 7 天，先不催你做任何决定，先让你被自己温柔地接住。",
    clusterInsights: {},
    day7Reflection: "你已经走过 7 天了。下一程，不必一个人扛。",
  },
};

function buildFallback(req: HandbookInsightRequest): HandbookInsights {
  const base = FALLBACK_BY_TYPE[req.type];
  const clusterInsights: Record<string, string> = {};
  for (const c of req.clusters) {
    clusterInsights[c.key] = "这一格还在你手里，先别急着动它。";
  }
  return { ...base, clusterInsights };
}

function sanitizeInsights(ins: HandbookInsights): HandbookInsights {
  return {
    coverNote: sanitizeHandbookText(ins.coverNote),
    day7Reflection: sanitizeHandbookText(ins.day7Reflection),
    clusterInsights: Object.fromEntries(
      Object.entries(ins.clusterInsights || {}).map(([k, v]) => [k, sanitizeHandbookText(v)]),
    ),
  };
}

export async function fetchHandbookInsights(
  req: HandbookInsightRequest,
): Promise<HandbookInsights> {
  if (!req.recordId) throw new Error("缺少 recordId");
  const cacheKey = `${req.type}:${req.recordId}`;

  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  const promise = (async (): Promise<HandbookInsights> => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "generate-handbook-insights",
        { body: req },
      );

      if (error) {
        console.warn("[handbook] edge function error, using fallback", error);
        return buildFallback(req);
      }

      // 关键防错串校验
      const returnedId = (data as any)?.recordId;
      if (returnedId && returnedId !== req.recordId) {
        console.error("[handbook] recordId mismatch", { sent: req.recordId, got: returnedId });
        throw new Error(`AI 返回的 recordId 与请求不一致 (期望 ${req.recordId}, 实际 ${returnedId})`);
      }

      const insights = (data as any)?.insights as HandbookInsights | undefined;
      if (!insights) return buildFallback(req);

      return sanitizeInsights({
        coverNote: insights.coverNote || FALLBACK_BY_TYPE[req.type].coverNote,
        clusterInsights: insights.clusterInsights || {},
        day7Reflection:
          insights.day7Reflection || FALLBACK_BY_TYPE[req.type].day7Reflection,
      });
    } catch (e) {
      // 校验错误必须抛出（可能是错串），其他网络错误则降级
      if (String(e).includes("recordId")) throw e;
      console.warn("[handbook] fetch failed, using fallback", e);
      return buildFallback(req);
    }
  })();

  cache.set(cacheKey, promise);
  // 失败时清除缓存允许重试
  promise.catch(() => cache.delete(cacheKey));
  return promise;
}

export function clearHandbookInsightCache(recordId?: string) {
  if (!recordId) {
    cache.clear();
    return;
  }
  for (const k of Array.from(cache.keys())) {
    if (k.endsWith(`:${recordId}`)) cache.delete(k);
  }
}
