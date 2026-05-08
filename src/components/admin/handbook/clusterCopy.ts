/** 场景簇（cluster）暖心兜底文案池——AI 心声缺失或撞文案时使用，保证四张卡四种语气 */

const POOL_BY_KEY: Record<string, string> = {
  // 男版
  daytime: "白天能撑到现在，已经是你在硬扛。先别急着证明什么。",
  night: "夜里这一格在悄悄替你修。今晚少做一件事，比多做一件更值钱。",
  pressure: "大场面里你没崩，是你在用旧方法救自己。这一周我们换一种。",
  home: "这一格还连着你最在意的人。先把自己接住，再去接别人。",
  // 女版
  body_signal: "身体在替你说还没说出口的话。先听它，不急着评价它。",
  mind_loop: "脑子转个不停，不是你想太多，是有些事还没被看见。允许自己慢一点。",
  relation: "你为很多人接住了情绪，这一格其实在等谁来接住你。",
  pause_avoid: "暂停不是逃避，是身体在请求一次不带评价的休息。",
};

const FALLBACK_POOL = [
  "这一格暂时不用动它。看到，就已经是改变的开始。",
  "你不是没力气，是力气一直在替别人花。这 7 天先留一点给自己。",
  "这里有积压，但还没到极限。给它一个被听见的机会。",
  "稳住，不代表无感。你只是把感受压得更深了一点。",
];

/** 给一组 cluster insights 去重；遇空或重复时按 cluster.key 替换为暖心兜底 */
export function dedupeClusterInsights(
  clusters: Array<{ key: string; insight: string }>,
): Array<{ key: string; insight: string }> {
  const seen = new Set<string>();
  let fallbackIdx = 0;
  return clusters.map((c) => {
    const raw = (c.insight || "").trim();
    let next = raw;
    if (!next || seen.has(next)) {
      next =
        POOL_BY_KEY[c.key] ||
        FALLBACK_POOL[fallbackIdx++ % FALLBACK_POOL.length];
      // 若 POOL_BY_KEY 命中后还是与已有重复，再退到 fallback 池
      while (seen.has(next)) {
        next = FALLBACK_POOL[fallbackIdx++ % FALLBACK_POOL.length];
      }
    }
    seen.add(next);
    return { ...c, insight: next };
  });
}
