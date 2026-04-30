import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isWeChatMiniProgram } from "@/utils/platform";

const getFallbackPath = (source?: string | null) => {
  if (source === "laoge") return "/laoge";
  if (source === "mama") return "/mama";
  return "/mini-app";
};

export function PromoFloatingBackButton() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleBack = () => {
    const fallbackPath = getFallbackPath(searchParams.get("source"));

    if (isWeChatMiniProgram() && typeof window.wx?.miniProgram?.navigateBack === "function") {
      try {
        window.wx.miniProgram.navigateBack({ delta: 1 });
        return;
      } catch {
        // Fall through to web fallback.
      }
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate(fallbackPath);
  };

  return (
    <button
      type="button"
      aria-label="返回"
      onClick={handleBack}
      className="fixed left-3 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-background/35 shadow-lg ring-1 ring-primary-foreground/25 backdrop-blur-md active:scale-95"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)", color: "hsl(var(--primary-foreground))" }}
    >
      <ArrowLeft className="h-6 w-6" strokeWidth={2.4} />
    </button>
  );
}