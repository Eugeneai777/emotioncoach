import React, { useState, useEffect } from "react";
import { Coins, ChevronDown, Phone, Zap, Battery, TrendingDown, TrendingUp, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface QuotaTransaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number | null;
  source: string | null;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

interface Props {
  userId: string;
}

const SOURCE_LABELS: Record<string, string> = {
  // 语音 & 文字
  voice_chat: "语音通话",
  voice_chat_refund: "语音通话退款",
  text_chat: "文字对话",
  web: "文字对话",
  mysql: "文字对话",
  voice_to_text: "语音转文字",
  text_to_speech: "文字转语音",
  // 课程推荐
  courses_page: "学习课程",
  recommend_courses: "AI推荐课程",
  recommend_courses_v2: "AI推荐课程",
  video_recommendations: "AI推荐课程",
  camp_video_tasks: "训练营课程",
  // AI 教练
  vibrant_life_sage: "生活教练",
  vibrant_life_coach_session: "生活教练",
  emotion_coach: "情绪教练",
  emotion_coach_session: "情绪教练",
  wealth_coach: "财富教练",
  wealth_coach_session: "财富教练",
  career_coach: "职场教练",
  communication_coach_session: "沟通教练",
  relationship_coach: "关系教练",
  parenting_coach: "亲子教练",
  parent_coach_session: "亲子教练",
  youth_mentor: "青少年教练",
  // 图片 & 生成
  generate_checkin_image: "打卡图片生成",
  generate_poster_image: "海报生成",
  generate_story_coach: "AI故事教练",
  // 分析 & 报告
  batch_gratitude_analysis: "情绪分析",
  analyze_tag_trends: "情绪分析",
  analyze_emotion_patterns: "情绪分析",
  analyze_parent_emotion_patterns: "情绪分析",
  generate_emotion_review: "情绪报告",
  // 充值 & 赠送
  registration: "注册赠送",
  purchase_basic: "购买尝鲜会员",
  system_refund: "系统补偿",
  admin: "管理员操作",
};

const getSourceLabel = (source: string | null): string => {
  if (!source) return "系统";
  return SOURCE_LABELS[source] || source.replace(/_/g, " ");
};

const CAMP_NAME_MAP: Record<string, string> = {
  emotion_stress_7: '7天解压营',
  emotion_journal_21: '21天情绪营',
  wealth_block_21: '财富觉醒营',
  emotion_bloom: '情感绽放营',
  identity_bloom: '身份绽放营',
};

/** 将 description 中的技术术语替换为中文产品名 */
const humanizeDescription = (desc: string | null, source: string | null, metadata?: Record<string, any> | null): string => {
  if (!desc) return "";
  let result = desc;
  // 替换 description 中出现的 source key
  for (const [key, label] of Object.entries(SOURCE_LABELS)) {
    if (result.includes(key)) {
      result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), label);
    }
  }
  // 兼容旧数据：将"训练营免费额度"替换为具体营名
  if (result.includes("训练营免费额度")) {
    const campType = metadata?.camp_type;
    if (campType && CAMP_NAME_MAP[campType]) {
      result = result.replace("训练营免费额度", `${CAMP_NAME_MAP[campType]}免费额度`);
    }
    // 追加产品名（如果缺少分隔符）
    if (source && SOURCE_LABELS[source] && !result.includes("·")) {
      result = `${result} · ${SOURCE_LABELS[source]}`;
    }
  }
  return result;
};

type FilterMode = "all" | "consumption" | "recharge";

export const VoiceUsageSection: React.FC<Props> = ({ userId }) => {
  const [transactions, setTransactions] = useState<QuotaTransaction[]>([]);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<FilterMode>("all");

  useEffect(() => {
    const load = async () => {
      // 分两路查询：消费记录取最新100条，充值记录取全部（确保注册赠送和购买不被挤掉）
      const [consumptionRes, rechargeRes, accountRes] = await Promise.all([
        supabase
          .from("quota_transactions")
          .select("id, type, amount, balance_after, source, description, reference_id, created_at")
          .eq("user_id", userId)
          .lte("amount", 0)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("quota_transactions")
          .select("id, type, amount, balance_after, source, description, reference_id, created_at")
          .eq("user_id", userId)
          .gt("amount", 0)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_accounts")
          .select("remaining_quota")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      // 合并并按时间倒序排列
      const allTx = [
        ...(consumptionRes.data || []),
        ...(rechargeRes.data || []),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setTransactions(allTx as QuotaTransaction[]);
      if (accountRes.data) setRemainingQuota(accountRes.data.remaining_quota);
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading || (transactions.length === 0 && remainingQuota === null)) return null;

  // 本月汇总
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTx = transactions.filter(
    (t) => new Date(t.created_at) >= monthStart
  );
  const monthDeducted = monthTx
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthCalls = monthTx.filter(
    (t) => t.source && (t.source.includes("voice") || t.source.includes("coach") || t.source.includes("sage") || t.source.includes("mentor"))
  ).length;

  // 筛选
  const filtered = transactions.filter((t) => {
    if (filter === "consumption") return t.amount <= 0;
    if (filter === "recharge") return t.amount > 0;
    return true;
  });

  const visible = showAll ? filtered : filtered.slice(0, 5);

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "consumption", label: "消费" },
    { key: "recharge", label: "充值" },
  ];

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">点数明细</h2>
        </div>
        <span className="text-xs text-muted-foreground">近期记录</span>
      </div>

      {/* 汇总条 */}
      <Card className="border-border/40 bg-card/80 mb-2">
        <CardContent className="p-3 flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
          {remainingQuota !== null && (
            <span className="flex items-center gap-1">
              <Battery className="w-3.5 h-3.5 text-emerald-500" />
              剩余 <span className="font-semibold text-foreground">{remainingQuota}</span> 点
            </span>
          )}
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            本月消耗 <span className="font-semibold text-foreground">{monthDeducted}</span> 点
          </span>
          {monthCalls > 0 && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-primary/60" />
              本月 <span className="font-semibold text-foreground">{monthCalls}</span> 次通话
            </span>
          )}
        </CardContent>
      </Card>

      {/* 筛选 Tab */}
      <div className="flex gap-1.5 mb-2 px-1">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => { setFilter(btn.key); setShowAll(false); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === btn.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 流水列表 */}
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-0 divide-y divide-border/30">
          {visible.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">暂无点数变动记录</div>
          ) : (
            visible.map((t) => {
              const isPositive = t.amount > 0;
              const isZero = t.amount === 0;
              // 优先使用后端 description（已含具体场景），兜底用 SOURCE_LABELS
              const displayDesc = humanizeDescription(t.description, t.source) || getSourceLabel(t.source);
              return (
                <div key={t.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isPositive ? (
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isZero ? (
                        <Gift className="w-3.5 h-3.5 text-blue-400" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {getSourceLabel(t.source)}
                      </Badge>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isPositive
                          ? "text-emerald-500"
                          : isZero
                          ? "text-blue-400"
                          : "text-red-400"
                      }`}
                    >
                      {isPositive ? "+" : ""}{t.amount} 点
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[55%]">
                      {displayDesc}
                    </span>
                    <span className="flex items-center gap-2">
                      {t.balance_after !== null && (
                        <span className="text-muted-foreground/70">余额 {t.balance_after}</span>
                      )}
                      <span>{new Date(t.created_at).toLocaleDateString("zh-CN")}</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {filtered.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full flex items-center justify-center gap-1 mt-2 py-2 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <span>{showAll ? "收起" : "查看全部记录"}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? "rotate-180" : ""}`} />
        </button>
      )}
    </section>
  );
};
