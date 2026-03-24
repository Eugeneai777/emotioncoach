import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, MapPin, Clock, Users, Zap, X, Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

const categories = [
  { value: "借物", emoji: "🔧", label: "借物" },
  { value: "拼车", emoji: "🚗", label: "拼车" },
  { value: "照看", emoji: "👶", label: "照看" },
  { value: "代收", emoji: "📦", label: "代收" },
  { value: "维修", emoji: "🛠️", label: "维修" },
  { value: "搬运", emoji: "💪", label: "搬运" },
  { value: "辅导", emoji: "📚", label: "辅导" },
  { value: "其他", emoji: "💡", label: "其他" },
];

const urgencyMap: Record<string, { label: string; color: string }> = {
  urgent: { label: "紧急", color: "bg-red-100 text-red-600" },
  normal: { label: "一般", color: "bg-blue-100 text-blue-600" },
  flexible: { label: "不急", color: "bg-green-100 text-green-600" },
};

interface HelpRequest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  urgency: string;
  location_hint: string | null;
  status: string;
  ai_match_result: any;
  created_at: string;
}

interface HelpResponse {
  id: string;
  request_id: string;
  user_id: string;
  message: string;
  is_accepted: boolean;
  created_at: string;
}

export default function YoujinLifeHelp() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<HelpRequest | null>(null);
  const [responses, setResponses] = useState<HelpResponse[]>([]);
  const [responseText, setResponseText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [isMatching, setIsMatching] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("其他");
  const [formUrgency, setFormUrgency] = useState("normal");
  const [formLocation, setFormLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    })();
    fetchRequests();

    // Realtime subscription
    const channel = supabase
      .channel("help-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_help_requests" }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("community_help_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setRequests((data as HelpRequest[]) || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formTitle.trim()) { toast.error("请输入求助标题"); return; }
    if (!currentUserId) { toast.error("请先登录"); return; }
    setSubmitting(true);

    const { data, error } = await supabase
      .from("community_help_requests")
      .insert({
        user_id: currentUserId,
        title: formTitle.trim(),
        description: formDesc.trim() || null,
        category: formCategory,
        urgency: formUrgency,
        location_hint: formLocation.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("发布失败");
      setSubmitting(false);
      return;
    }

    toast.success("求助已发布！");
    setShowForm(false);
    setFormTitle(""); setFormDesc(""); setFormCategory("其他"); setFormUrgency("normal"); setFormLocation("");
    setSubmitting(false);

    // Trigger AI matching
    if (data) {
      triggerAIMatch(data.id);
    }
  };

  const triggerAIMatch = async (requestId: string) => {
    setIsMatching(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/community-help-match`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ request_id: requestId }),
        }
      );
      if (res.ok) {
        fetchRequests();
      }
    } catch (e) {
      console.error("AI match error:", e);
    }
    setIsMatching(false);
  };

  const openDetail = async (req: HelpRequest) => {
    setShowDetail(req);
    const { data } = await supabase
      .from("community_help_responses")
      .select("*")
      .eq("request_id", req.id)
      .order("created_at", { ascending: true });
    setResponses((data as HelpResponse[]) || []);
  };

  const sendResponse = async () => {
    if (!responseText.trim() || !showDetail || !currentUserId) return;
    await supabase.from("community_help_responses").insert({
      request_id: showDetail.id,
      user_id: currentUserId,
      message: responseText.trim(),
    });
    setResponseText("");
    // Refresh
    const { data } = await supabase
      .from("community_help_responses")
      .select("*")
      .eq("request_id", showDetail.id)
      .order("created_at", { ascending: true });
    setResponses((data as HelpResponse[]) || []);
    toast.success("回复已发送");
  };

  const markResolved = async (id: string) => {
    await supabase
      .from("community_help_requests")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id);
    toast.success("已标记解决");
    setShowDetail(null);
    fetchRequests();
  };

  const filtered = filter === "all" ? requests.filter(r => r.status === "open")
    : filter === "mine" ? requests.filter(r => r.user_id === currentUserId)
    : requests.filter(r => r.category === filter && r.status === "open");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button onClick={() => navigate("/youjin-life")} className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-base font-bold text-foreground flex-1">🤝 邻里互助</h1>
          <button
            onClick={() => currentUserId ? setShowForm(true) : toast.error("请先登录")}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-foreground text-background font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            求助
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {[
            { key: "all", label: "全部" },
            { key: "mine", label: "我的" },
            ...categories.slice(0, 5).map(c => ({ key: c.value, label: `${c.emoji} ${c.label}` })),
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === f.key
                  ? "bg-foreground text-background"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* AI matching indicator */}
        {isMatching && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-xs text-amber-700">AI 正在为你匹配合适的邻居...</span>
          </div>
        )}

        {/* Request list */}
        <div className="px-4 pb-8 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">🤝</p>
              <p className="text-sm text-muted-foreground">暂无求助信息</p>
              <button
                onClick={() => currentUserId ? setShowForm(true) : toast.error("请先登录")}
                className="mt-3 text-xs text-foreground font-medium underline"
              >
                发布第一条求助
              </button>
            </div>
          ) : (
            filtered.map((req, i) => {
              const urg = urgencyMap[req.urgency] || urgencyMap.normal;
              const catEmoji = categories.find(c => c.value === req.category)?.emoji || "💡";
              return (
                <motion.button
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openDetail(req)}
                  className="w-full bg-card rounded-2xl border border-border/50 p-3.5 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-lg shrink-0">
                      {catEmoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground truncate">{req.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${urg.color}`}>
                          {urg.label}
                        </span>
                      </div>
                      {req.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{req.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                        {req.location_hint && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />{req.location_hint}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(req.created_at), { locale: zhCN, addSuffix: true })}
                        </span>
                      </div>
                      {/* AI match suggestion */}
                      {req.ai_match_result && (
                        <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-amber-50 rounded-lg border border-amber-100">
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px] text-amber-700 font-medium">
                            AI推荐: {(req.ai_match_result as any)?.suggestion || "已找到匹配"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* ===== New Request Form Modal ===== */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-background w-full max-w-lg rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-foreground">发布求助</h2>
                <button onClick={() => setShowForm(false)} className="p-1">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Title */}
              <input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="一句话描述你需要什么帮助"
                className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/50 mb-3"
                maxLength={50}
              />

              {/* Description */}
              <textarea
                value={formDesc}
                onChange={e => setFormDesc(e.target.value)}
                placeholder="详细说明（可选）"
                rows={3}
                className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/50 mb-3 resize-none"
                maxLength={300}
              />

              {/* Category */}
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">分类</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setFormCategory(c.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        formCategory === c.value
                          ? "bg-foreground text-background"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgency */}
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">紧急程度</p>
                <div className="flex gap-2">
                  {(["urgent", "normal", "flexible"] as const).map(u => {
                    const info = urgencyMap[u];
                    return (
                      <button
                        key={u}
                        onClick={() => setFormUrgency(u)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          formUrgency === u
                            ? "bg-foreground text-background"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location */}
              <input
                value={formLocation}
                onChange={e => setFormLocation(e.target.value)}
                placeholder="位置提示，如 3栋 2单元（可选）"
                className="w-full bg-muted/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/50 mb-4"
                maxLength={30}
              />

              <button
                onClick={handleSubmit}
                disabled={submitting || !formTitle.trim()}
                className="w-full py-3 rounded-2xl bg-foreground text-background text-sm font-bold disabled:opacity-50 active:opacity-80 transition-opacity"
              >
                {submitting ? "发布中..." : "发布求助 · AI自动匹配"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== Detail Modal ===== */}
      <AnimatePresence>
        {showDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
            onClick={() => setShowDetail(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-background w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              {/* Detail header */}
              <div className="p-5 pb-3 border-b border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-bold text-foreground">{showDetail.title}</h2>
                  <button onClick={() => setShowDetail(null)} className="p-1">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {showDetail.description && (
                  <p className="text-xs text-muted-foreground mb-2">{showDetail.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${urgencyMap[showDetail.urgency]?.color || ""}`}>
                    {urgencyMap[showDetail.urgency]?.label || "一般"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
                    {showDetail.category}
                  </span>
                  {showDetail.location_hint && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />{showDetail.location_hint}
                    </span>
                  )}
                </div>

                {/* AI match result */}
                {showDetail.ai_match_result && (
                  <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs font-bold text-amber-700">AI 匹配建议</span>
                    </div>
                    <p className="text-xs text-amber-700">
                      {(showDetail.ai_match_result as any)?.suggestion || "暂无建议"}
                    </p>
                    {(showDetail.ai_match_result as any)?.tips && (
                      <p className="text-[10px] text-amber-600 mt-1">
                        💡 {(showDetail.ai_match_result as any).tips}
                      </p>
                    )}
                  </div>
                )}

                {/* Resolve button */}
                {showDetail.user_id === currentUserId && showDetail.status === "open" && (
                  <button
                    onClick={() => markResolved(showDetail.id)}
                    className="mt-3 flex items-center gap-1 text-xs text-green-600 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    标记已解决
                  </button>
                )}
              </div>

              {/* Responses */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {responses.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">暂无回复，快来帮忙吧！</p>
                ) : (
                  responses.map(r => (
                    <div key={r.id} className={`p-3 rounded-xl text-xs ${
                      r.user_id === showDetail.user_id
                        ? "bg-foreground/5 border border-border/30"
                        : "bg-blue-50 border border-blue-100"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium">
                          {r.user_id === showDetail.user_id ? "求助者" : "热心邻居"}
                        </span>
                        <span className="text-muted-foreground/50 text-[10px]">
                          {formatDistanceToNow(new Date(r.created_at), { locale: zhCN, addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-foreground">{r.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply input */}
              {currentUserId && showDetail.status === "open" && (
                <div className="p-4 border-t border-border/30 flex items-center gap-2">
                  <input
                    value={responseText}
                    onChange={e => setResponseText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendResponse()}
                    placeholder="写下你的回复..."
                    className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm outline-none border border-border/50"
                    maxLength={200}
                  />
                  <button
                    onClick={sendResponse}
                    disabled={!responseText.trim()}
                    className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
