import { useNavigate } from "react-router-dom";
import { LaogeToolCard } from "@/components/laoge/LaogeToolCard";
import { Home, Share2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { IntroShareDialog } from "@/components/common/IntroShareDialog";
import { introShareConfigs } from "@/config/introShareConfig";
import AwakeningBottomNav from "@/components/awakening/AwakeningBottomNav";
import { useAuth } from "@/hooks/useAuth";
import { usePackagesPurchased } from "@/hooks/usePackagePurchased";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoundConfig {
  fields: { key: string; label: string; placeholder: string; type?: "text" | "select"; options?: string[] }[];
  buttonText: string;
}

export interface ToolConfig {
  tool: string;
  title: string;
  description: string;
  icon: string;
  rounds: RoundConfig[];
}

interface MaleVitalityTemplateStatus {
  id: string;
  package_key?: string | null;
  require_payment?: boolean | null;
}

const TOOLS: ToolConfig[] = [
  {
    tool: "opportunity",
    title: "老哥，今年怎么赚钱",
    description: "今年还有什么赚钱机会？",
    icon: "💰",
    rounds: [
      { fields: [{ key: "industry", label: "你的行业", placeholder: "比如：互联网、制造业、教育..." }], buttonText: "问老哥" },
      { fields: [{ key: "city", label: "所在城市", placeholder: "比如：北京、深圳、成都..." }, { key: "resources", label: "你现在拥有的资源", placeholder: "比如：人脉、资金、技术..." }], buttonText: "继续聊" },
      { fields: [{ key: "budget", label: "能投入的时间和资金", placeholder: "比如：每天2小时、可以投5万..." }], buttonText: "让老哥给方案" },
    ],
  },
  {
    tool: "career",
    title: "老哥，我事业卡住了",
    description: "为什么事业越来越难？",
    icon: "🏔️",
    rounds: [
      { fields: [{ key: "industry", label: "你现在做什么行业？", placeholder: "行业和具体职位..." }], buttonText: "问老哥" },
      { fields: [{ key: "income", label: "目前收入区间？", type: "select" as const, placeholder: "选择", options: ["月薪1万以下", "月薪1-2万", "月薪2-3万", "月薪3-5万", "月薪5万以上", "创业中"] }, { key: "painPoint", label: "最近最大的卡点？", placeholder: "你觉得最困扰你的是什么..." }], buttonText: "继续聊" },
      { fields: [{ key: "duration", label: "这个问题持续多久了？", type: "select" as const, placeholder: "选择", options: ["刚开始", "半年以内", "半年到1年", "1-2年", "2年以上"] }, { key: "tried", label: "试过什么方法？", placeholder: "比如：看书、找朋友聊、报课..." }], buttonText: "让老哥给方案" },
    ],
  },
  {
    tool: "stress",
    title: "老哥，我压力有点大",
    description: "中年男人压力指数测试",
    icon: "😤",
    rounds: [
      { fields: [{ key: "work", label: "工作压力（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, { key: "family", label: "家庭责任（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }], buttonText: "问老哥" },
      { fields: [{ key: "sleep", label: "睡眠质量差（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, { key: "money", label: "经济压力（1-10）", type: "select" as const, placeholder: "选择", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }], buttonText: "继续聊" },
      { fields: [{ key: "emotion", label: "情绪释放（1-10）", type: "select" as const, placeholder: "1=有很好的出口，10=完全没有", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] }, { key: "wantChange", label: "最想改变的一件事？", placeholder: "比如：睡眠、情绪、收入..." }], buttonText: "让老哥给方案" },
    ],
  },
  {
    tool: "health",
    title: "老哥，我身体有点不对",
    description: "40岁健康风险扫描",
    icon: "🏥",
    rounds: [
      { fields: [{ key: "age", label: "年龄", type: "select" as const, placeholder: "选择", options: ["35-39岁", "40-44岁", "45-49岁", "50-55岁", "55岁以上"] }, { key: "weight", label: "体重情况", type: "select" as const, placeholder: "选择", options: ["偏瘦", "正常", "微胖（肚子有点大）", "明显超重"] }], buttonText: "问老哥" },
      { fields: [{ key: "sleepHours", label: "每天睡眠时间", type: "select" as const, placeholder: "选择", options: ["不到5小时", "5-6小时", "6-7小时", "7-8小时", "8小时以上"] }, { key: "exercise", label: "运动频率", type: "select" as const, placeholder: "选择", options: ["基本不运动", "每周1-2次", "每周3-4次", "每天都运动"] }], buttonText: "继续聊" },
      { fields: [{ key: "concern", label: "最担心的健康问题？", placeholder: "比如：三高、腰椎、脱发、精力..." }], buttonText: "让老哥给方案" },
    ],
  },
];

export default function LaogeAI() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: purchasedMap } = usePackagesPurchased([
    'synergy_bundle',
    'wealth_block_assessment',
    'emotion_health_assessment',
    'identity_bloom',
  ]);
  const campPurchased = !!user && !!purchasedMap?.['synergy_bundle'];
  const wealthPurchased = !!user && !!purchasedMap?.['wealth_block_assessment'];
  const emotionPurchased = !!user && !!purchasedMap?.['emotion_health_assessment'];
  const identityPurchased = !!user && !!purchasedMap?.['identity_bloom'];

  const { data: maleVitalityStatus } = useQuery({
    queryKey: ['male-midlife-vitality-status', user?.id],
    queryFn: async () => {
      const { data: templateRaw, error: templateError } = await supabase
        .from('partner_assessment_templates' as never)
        .select('id, package_key, require_payment')
        .eq('assessment_key', 'male_midlife_vitality')
        .eq('is_active', true)
        .maybeSingle();
      const template = templateRaw as MaleVitalityTemplateStatus | null;

      if (templateError || !template) {
        return { available: false, completed: false, purchased: false };
      }

      if (!user) {
        return { available: true, completed: false, purchased: false };
      }

      const { data: resultData } = await supabase
        .from('partner_assessment_results' as never)
        .select('id')
        .eq('user_id', user.id)
        .eq('template_id', template.id)
        .limit(1)
        .maybeSingle();

      let purchased = false;
      const packageKey = template.package_key;
      if (template.require_payment && packageKey) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('id')
          .eq('user_id', user.id)
          .eq('package_key', packageKey)
          .eq('status', 'paid')
          .limit(1)
          .maybeSingle();
        purchased = !!orderData;
      }

      return { available: true, completed: !!resultData, purchased };
    },
    staleTime: 30 * 1000,
  });
  const maleVitalityAvailable = maleVitalityStatus?.available ?? true;
  const maleVitalityDone = !!maleVitalityStatus?.completed || !!maleVitalityStatus?.purchased;

  // 检查觉醒力测评是否已完成
  const { data: midlifeCompleted } = useQuery({
    queryKey: ['midlife-awakening-completed', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('midlife_awakening_assessments' as never)
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
  });

  const allAssessmentsDone = wealthPurchased && emotionPurchased && !!midlifeCompleted && (!maleVitalityAvailable || maleVitalityDone);
  const allCampsDone = campPurchased && identityPurchased;

  return (
    <div className="min-h-screen bg-[hsl(var(--laoge-bg))] pb-20">
      {/* Sticky Conversion Bar - hidden if purchased */}
      {!campPurchased && (
        <div className="sticky top-0 z-50 bg-[#EF6A20] px-4 py-2.5">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="text-white font-bold text-sm">
              🔥 中年男人职场突围方案
            </span>
            <button
              onClick={() => navigate("/promo/synergy?source=laoge")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/60 text-white text-xs font-medium hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
            >
              了解详情
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="max-w-lg mx-auto px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => { sessionStorage.setItem('skip_preferred_redirect', '1'); navigate("/mini-app"); }}
            className="flex items-center gap-1 text-xs text-[hsl(var(--laoge-text-muted))] hover:text-[hsl(var(--laoge-text))] transition-colors touch-manipulation"
          >
            <Home className="w-3.5 h-3.5" />
            <span>主页</span>
          </motion.button>

          <IntroShareDialog
            config={introShareConfigs.laoge}
            trigger={
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 text-xs text-[hsl(var(--laoge-text-muted))] hover:text-[hsl(var(--laoge-text))] transition-colors touch-manipulation"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>分享给兄弟</span>
              </motion.button>
            }
          />
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--laoge-bg))] via-[hsl(var(--laoge-card))] to-[hsl(var(--laoge-bg))]" />
        <div className="relative px-5 pt-8 pb-4 text-center">
          <h1 className="text-4xl font-black text-[hsl(var(--laoge-text))] tracking-tight">
            老哥AI
          </h1>
          <p className="text-lg text-[hsl(var(--laoge-accent))] font-bold mt-2">
            有事问老哥
          </p>
          <p className="text-sm text-[hsl(var(--laoge-text-muted))] mt-2">
            男人的AI参谋
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {["赚钱", "事业", "压力", "健康"].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[hsl(var(--laoge-accent)/0.15)] text-[hsl(var(--laoge-accent))] text-xs font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── 第1层：免费体验 ── */}
      <div className="px-4 pt-5 pb-2 max-w-lg mx-auto">
        <p className="text-sm font-bold text-[hsl(var(--laoge-text))] mb-3">
          💬 先跟老哥免费聊两句
        </p>
        <p className="text-xs text-[hsl(var(--laoge-text-muted))] mb-3 -mt-2">
          选一个你最想聊的话题，不花钱
        </p>
      </div>
      <div className="px-4 pb-4 space-y-3 max-w-lg mx-auto">
        {TOOLS.map(t => (
          <LaogeToolCard key={t.tool} {...t} />
        ))}
      </div>

      {/* ── 第2层：¥9.9 诊断 ── */}
      {!allAssessmentsDone && (
        <div className="px-4 pt-4 pb-2 max-w-lg mx-auto">
          <p className="text-sm font-bold text-[hsl(var(--laoge-text))] mb-3">
            🩺 聊完再做个体检
          </p>
          <p className="text-xs text-[hsl(var(--laoge-text-muted))] mb-3 -mt-2">
            老哥建议：先测一下，再对症下药
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {!wealthPurchased && (
              <button
                onClick={() => navigate("/wealth-block")}
                className="min-h-[112px] flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all text-left active:scale-[0.98]"
              >
                <span className="text-2xl">💰</span>
                <span className="font-bold text-xs text-[hsl(var(--laoge-text))]">财富卡点</span>
                <span className="text-[9px] text-[hsl(var(--laoge-text-muted))]">20题·6分钟</span>
                <span className="text-[9px] font-bold text-[hsl(var(--laoge-accent))]">限时 ¥9.9</span>
              </button>
            )}
            {!emotionPurchased && (
              <button
                onClick={() => navigate("/emotion-health")}
                className="min-h-[112px] flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all text-left active:scale-[0.98]"
              >
                <span className="text-2xl">💚</span>
                <span className="font-bold text-xs text-[hsl(var(--laoge-text))]">情绪健康</span>
                <span className="text-[9px] text-[hsl(var(--laoge-text-muted))]">PHQ-9+GAD-7·5分钟</span>
                <span className="text-[9px] font-bold text-[hsl(var(--laoge-accent))]">限时 ¥9.9</span>
              </button>
            )}
            {!midlifeCompleted && (
              <button
                onClick={() => navigate("/midlife-awakening")}
                className="min-h-[112px] flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all text-left active:scale-[0.98]"
              >
                <span className="text-2xl">🧭</span>
                <span className="font-bold text-xs text-[hsl(var(--laoge-text))]">觉醒力</span>
                <span className="text-[9px] text-[hsl(var(--laoge-text-muted))]">30题·8分钟</span>
                <span className="text-[9px] font-bold text-[hsl(var(--laoge-accent))]">专业版</span>
              </button>
            )}
            {maleVitalityAvailable && !maleVitalityDone && (
              <button
                onClick={() => navigate("/assessment/male_midlife_vitality?source=laoge")}
                className="min-h-[112px] flex flex-col items-start gap-1.5 p-3.5 rounded-xl bg-[hsl(var(--laoge-card))] border border-[hsl(var(--laoge-border))] hover:border-[hsl(var(--laoge-accent))] transition-all text-left active:scale-[0.98]"
              >
                <span className="text-2xl">🔋</span>
                <span className="font-bold text-xs text-[hsl(var(--laoge-text))]">男性活力</span>
                <span className="text-[9px] text-[hsl(var(--laoge-text-muted))]">18题·约4分钟</span>
                <span className="text-[9px] font-bold text-[hsl(var(--laoge-accent))]">状态盘点</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 第3层：系统方案 ── */}
      {!allCampsDone && (
        <div className="px-4 pt-6 pb-6 max-w-lg mx-auto">
          <p className="text-sm font-bold text-[hsl(var(--laoge-text))] mb-3">
            🚀 想要系统解决？老哥推荐
          </p>
          <div className="space-y-3">
            {/* ¥399 协同训练营 */}
            {!campPurchased && (
              <button
                onClick={() => navigate("/promo/synergy?source=laoge")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-[hsl(var(--laoge-accent)/0.12)] to-[hsl(var(--laoge-accent)/0.04)] border border-[hsl(var(--laoge-accent)/0.25)] hover:border-[hsl(var(--laoge-accent)/0.5)] transition-all text-left active:scale-[0.98]"
              >
                <span className="text-3xl">⚡</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[hsl(var(--laoge-text))]">7天有劲训练营</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--laoge-accent)/0.2)] text-[hsl(var(--laoge-accent))] font-bold">¥399</span>
                  </div>
                  <p className="text-xs text-[hsl(var(--laoge-text-muted))] mt-1">AI+真人教练陪伴 · 7天突围方案</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--laoge-text-muted))] flex-shrink-0" />
              </button>
            )}

            {/* ¥3980 身份绽放 */}
            {!identityPurchased && (
              <button
                onClick={() => navigate("/promo/identity-bloom")}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-violet-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all text-left active:scale-[0.98]"
              >
                <span className="text-3xl">🌟</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[hsl(var(--laoge-text))]">身份绽放训练营</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-medium">深度蜕变</span>
                  </div>
                  <p className="text-xs text-[hsl(var(--laoge-text-muted))] mt-1">200+学员已加入 · 找到人生下半场方向</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[hsl(var(--laoge-text-muted))] flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      )}

      <AwakeningBottomNav />
    </div>
  );
}
