import { useNavigate } from "react-router-dom";
import { Flower2, Target, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const benefits = [
  {
    title: "绽放合伙人",
    icon: Flower2,
    description: "三大训练营 + 1对1教练辅导 + 分销佣金",
    buttonText: "了解绽放合伙人",
    path: "/partner",
    gradient: "from-rose-500 to-pink-500",
    bgGradient: "from-rose-50 to-pink-50",
  },
  {
    title: "财富卡点测评",
    icon: Target,
    description: "30道深度测评，找到你的潜意识财富信念卡点",
    buttonText: "进入财富卡点测评",
    path: "/wealth-block",
    gradient: "from-amber-500 to-orange-500",
    bgGradient: "from-amber-50 to-orange-50",
  },
  {
    title: "财富觉醒训练营",
    icon: Sparkles,
    description: "7天系统训练 + 每日冥想 + AI教练陪伴",
    buttonText: "进入财富觉醒训练营",
    path: "/wealth-camp-intro",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-50 to-purple-50",
  },
];

const BloomPartnerIntro = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleCardClick = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate(`/auth?mode=phone_only&default_login=true&redirect=${encodeURIComponent(path)}`);
    }
  };

  const handleLogin = () => {
    navigate("/auth?mode=phone_only&default_login=true");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-purple-50">
      {/* Header */}
      <div className="pt-12 pb-6 text-center px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 shadow-lg mb-4">
          <Flower2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">绽放合伙人</h1>
        <p className="text-muted-foreground mt-1.5 text-sm tracking-widest">
          共振 · 觉醒 · 升维
        </p>
      </div>

      {/* Benefit Cards */}
      <div className="px-4 pb-6 space-y-4 max-w-md mx-auto">
        {benefits.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden`}
            >
              <div className={`bg-gradient-to-r ${item.bgGradient} p-4 pb-3`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                </div>
              </div>
              <div className="px-4 pb-4 pt-2">
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <Button
                  onClick={() => handleCardClick(item.path)}
                  className={`w-full rounded-xl bg-gradient-to-r ${item.gradient} hover:opacity-90 text-white border-0`}
                  disabled={loading}
                >
                  {item.buttonText}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Auth Section */}
      <div className="px-4 pb-12 max-w-md mx-auto">
        {!loading && !user && (
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">登录后即可体验全部权益</p>
            <Button
              variant="outline"
              onClick={handleLogin}
              className="rounded-xl w-full"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              手机号登录
            </Button>
          </div>
        )}
        {!loading && user && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">已登录，点击上方卡片即可进入</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloomPartnerIntro;
