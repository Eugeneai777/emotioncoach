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
  voice_chat: "语音通话",
  text_chat: "文字对话",
  vibrant_life_sage: "生活教练",
  emotion_coach: "情绪教练",
  wealth_coach: "财富教练",
  career_coach: "职场教练",
  relationship_coach: "关系教练",
  parenting_coach: "亲子教练",
  youth_mentor: "青少年教练",
  purchase_basic: "购买尝鲜会员",
  admin: "管理员操作",
};

const getSourceLabel = (source: string | null): string => {
  if (!source) return "系统";
  return SOURCE_LABELS[source] || source.replace(/_/g, " ");
};

export const VoiceUsageSection: React.FC<Props> = ({ userId }) => {
  const [transactions, setTransactions] = useState<QuotaTransaction[]>([]);
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [txRes, accountRes] = await Promise.all([
        supabase
          .from("quota_transactions")
          .select("id, type, amount, balance_after, source, description, reference_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("user_accounts")
          .select("remaining_quota")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);
      if (txRes.data) setTransactions(txRes.data as QuotaTransaction[]);
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

  const visible = showAll ? transactions : transactions.slice(0, 5);

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

      {/* 流水列表 */}
      <Card className="border-border/40 bg-card/80">
        <CardContent className="p-0 divide-y divide-border/30">
          {visible.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">暂无点数变动记录</div>
          ) : (
            visible.map((t) => {
              const isPositive = t.amount > 0;
              const isZero = t.amount === 0;
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
                    <span className="truncate max-w-[60%]">
                      {t.description || t.type}
                    </span>
                    <span>{new Date(t.created_at).toLocaleDateString("zh-CN")}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {transactions.length > 5 && (
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
