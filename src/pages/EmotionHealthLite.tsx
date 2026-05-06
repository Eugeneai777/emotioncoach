import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { EmotionHealthQuestionsLite } from "@/components/emotion-health/EmotionHealthQuestionsLite";
import { EmotionHealthResult, calculateEmotionHealthResult } from "@/components/emotion-health";
import type { EmotionHealthResultType } from "@/components/emotion-health";

type PageState = "questions" | "gate" | "result";

const PENDING_KEY = "emotion_health_lite_pending_answers";

export default function EmotionHealthLitePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pageState, setPageState] = useState<PageState>("questions");
  const [currentResult, setCurrentResult] = useState<EmotionHealthResultType | null>(null);

  // 登录后自动恢复答案并展示结果
  useEffect(() => {
    if (!user) return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    try {
      const answers = JSON.parse(raw) as Record<number, number>;
      if (answers && Object.keys(answers).length > 0) {
        setCurrentResult(calculateEmotionHealthResult(answers));
        setPageState("result");
      }
    } catch (e) {
      console.warn("[EmotionHealthLite] restore failed", e);
    } finally {
      sessionStorage.removeItem(PENDING_KEY);
    }
  }, [user]);

  // 完成测评回调
  const handleComplete = useCallback((answers: Record<number, number>) => {
    const result = calculateEmotionHealthResult(answers);
    setCurrentResult(result);

    if (user) {
      setPageState("result");
    } else {
      // 缓存答案以便登录后恢复
      try {
        sessionStorage.setItem(PENDING_KEY, JSON.stringify(answers));
      } catch {}
      setPageState("gate");
    }
  }, [user]);

  const handleLogin = useCallback(() => {
    const target = "/emotion-health-lite";
    try {
      localStorage.setItem("auth_redirect", target);
      localStorage.setItem("auth_redirect_ts", String(Date.now()));
    } catch {}
    navigate(`/auth?redirect=${encodeURIComponent(target)}`, { state: { from: target } });
  }, [navigate]);

  const handleRetake = useCallback(() => {
    setCurrentResult(null);
    setPageState("questions");
  }, []);

  const handleExit = useCallback(() => {
    setPageState("questions");
  }, []);

  return (
    <div
      className="h-screen overflow-y-auto overscroll-contain bg-background"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <DynamicOGMeta pageKey="emotionHealthLite" />

      {pageState === "questions" && (
        <EmotionHealthQuestionsLite
          onComplete={handleComplete}
          onExit={handleExit}
          skipStartScreen={true}
          showFooterInfo={false}
        />
      )}

      {pageState === "gate" && (
        <main className="container max-w-md mx-auto px-4 py-12">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-rose-50 via-white to-purple-50 dark:from-rose-950/30 dark:via-background dark:to-purple-950/30 p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">你的专属测评报告已生成</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                登录后立即查看完整结果、AI 教练解读与个性化成长建议
              </p>
            </div>
            <Button
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
              onClick={handleLogin}
            >
              登录 / 注册查看完整报告
            </Button>
            <p className="text-[11px] text-muted-foreground">登录后答题结果自动恢复</p>
          </div>
        </main>
      )}

      {pageState === "result" && currentResult && (
        <EmotionHealthResult
          result={currentResult}
          onRetake={handleRetake}
        />
      )}
    </div>
  );
}
