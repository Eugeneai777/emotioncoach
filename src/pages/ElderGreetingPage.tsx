import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ElderGreetingPage = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchGreeting = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("elder-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `请给我生成一条温暖的每日问候语。要求：
1. 简短温馨，不超过60字
2. 包含对健康/天气/心情的关心
3. 带1-2个温暖的emoji
4. 像家人说的话一样自然
5. 不要有"我是小劲"这样的自我介绍
只输出问候语本身，不要其他内容。`,
            },
          ],
        },
      });

      if (error) throw error;

      // Non-streaming response - parse the text
      if (typeof data === "string") {
        // SSE stream response
        const lines = data.split("\n");
        let result = "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) result += content;
          } catch {}
        }
        setGreeting(result || "今天也要好好照顾自己哦 ☀️ 记得多喝水、多休息 💛");
      } else if (data?.choices?.[0]?.message?.content) {
        setGreeting(data.choices[0].message.content);
      } else {
        setGreeting("今天也要好好照顾自己哦 ☀️ 记得多喝水、多休息 💛");
      }
    } catch (e) {
      console.error("问候语加载失败:", e);
      setGreeting("今天也要好好照顾自己哦 ☀️ 记得多喝水、多休息 💛");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGreeting();
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const timeGreeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(30 60% 98%)" }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/elder-care")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold" style={{ color: "hsl(25 40% 30%)" }}>☀️ 每日暖心问候</h1>
      </div>

      <div className="px-5 pt-8 pb-12">
        <div className="max-w-md mx-auto text-center">
          {/* Date */}
          <p className="text-base mb-1" style={{ color: "hsl(25 30% 50%)" }}>
            {dateStr} {weekdays[now.getDay()]}
          </p>
          <h2 className="text-2xl font-bold mb-8" style={{ color: "hsl(25 40% 30%)" }}>
            {timeGreeting}！🌿
          </h2>

          {/* Greeting card */}
          <div
            className="rounded-3xl p-8 mb-8 shadow-sm"
            style={{ backgroundColor: "hsl(45 60% 95%)" }}
          >
            <Sun className="w-12 h-12 mx-auto mb-4" style={{ color: "hsl(35 80% 55%)" }} />
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(25 60% 55%)" }} />
                <span className="ml-2 text-base" style={{ color: "hsl(25 30% 50%)" }}>正在为您准备问候...</span>
              </div>
            ) : (
              <p className="text-xl leading-relaxed font-medium" style={{ color: "hsl(25 35% 30%)" }}>
                {greeting}
              </p>
            )}
          </div>

          <Button
            onClick={fetchGreeting}
            disabled={isLoading}
            variant="outline"
            className="text-base rounded-2xl gap-2 px-6"
            style={{
              borderColor: "hsl(25 50% 75%)",
              color: "hsl(25 50% 40%)",
              minHeight: 48,
            }}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            换一条问候
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ElderGreetingPage;
