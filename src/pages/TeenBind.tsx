import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Link2, Heart, Sparkles, ArrowRight, Shield, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

export default function TeenBind() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [isBinding, setIsBinding] = useState(false);
  const [bindingSuccess, setBindingSuccess] = useState(false);
  const [showFaq, setShowFaq] = useState(false);

  const handleBind = async () => {
    if (!code.trim()) {
      toast({ title: "请输入绑定码", variant: "destructive" });
      return;
    }

    if (!user?.id) {
      toast({ title: "请先登录", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsBinding(true);

    try {
      // Find the pending binding with this code
      const { data: binding, error: findError } = await supabase
        .from("parent_teen_bindings")
        .select("*")
        .eq("binding_code", code.toUpperCase())
        .eq("status", "pending")
        .gt("code_expires_at", new Date().toISOString())
        .single();

      if (findError || !binding) {
        toast({ title: "绑定码无效或已过期", variant: "destructive" });
        setIsBinding(false);
        return;
      }

      // Update the binding
      const { error: updateError } = await supabase
        .from("parent_teen_bindings")
        .update({
          teen_user_id: user.id,
          status: "active",
          bound_at: new Date().toISOString(),
        })
        .eq("id", binding.id);

      if (updateError) throw updateError;

      setBindingSuccess(true);
      toast({ title: "绑定成功！", description: "你现在可以开始使用青少年模式了" });
    } catch (error) {
      console.error("Binding error:", error);
      toast({ title: "绑定失败", description: "请稍后重试", variant: "destructive" });
    } finally {
      setIsBinding(false);
    }
  };

  if (bindingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white/80 backdrop-blur border-0 shadow-xl">
            <CardContent className="pt-8 pb-6 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
              >
                <Heart className="h-10 w-10 text-white" />
              </motion.div>
              
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  绑定成功！
                </h2>
                <p className="text-muted-foreground">
                  你已经和家长建立了连接，现在可以开始你的专属对话了
                </p>
              </div>

              <div className="bg-violet-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-violet-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-violet-700">你的隐私受保护</p>
                    <p className="text-xs text-muted-foreground">
                      你和AI的对话内容完全私密，家长看不到任何聊天内容
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate("/teen-coach")}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                开始对话
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <DynamicOGMeta pageKey="teenBind" />
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-4"
      >
        <Card className="bg-white/80 backdrop-blur border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center">
              <Link2 className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-xl">与家长建立连接</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground text-sm">
              输入家长分享的6位绑定码，建立双向连接后，你将拥有专属的支持空间
            </p>

            <div className="space-y-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="请输入绑定码"
                className="text-center text-2xl font-mono tracking-[0.5em] h-14"
                maxLength={6}
              />

              <Button
                onClick={handleBind}
                disabled={isBinding || code.length < 6}
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                {isBinding ? "绑定中..." : "确认绑定"}
              </Button>
            </div>

            {/* Privacy Promise */}
            <div className="bg-violet-50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-violet-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-violet-700 text-sm">隐私保护承诺</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    你的对话内容完全私密，家长只能看到使用频率和心情趋势，绝对看不到你聊了什么
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-pink-700 text-sm">专属AI朋友</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    这是一个懂年轻人的AI，不说教、不评判，只是陪你聊聊
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="bg-white/60 backdrop-blur border-0 shadow-sm">
          <CardContent className="p-4">
            <button
              onClick={() => setShowFaq(!showFaq)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">这是什么？</span>
              </div>
              {showFaq ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            {showFaq && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="mt-3 space-y-3 text-sm text-muted-foreground"
              >
                <p>
                  <strong className="text-foreground">这是有劲情绪教练的青少年模式。</strong>
                  你的家长也在使用这个应用来学习如何更好地理解你。
                </p>
                <p>
                  绑定后，你会拥有一个专属的AI朋友。它不会告诉家长你聊了什么，只会让家长知道你有在使用、心情大概怎么样。
                </p>
                <p>
                  这样设计是为了让你有一个安全的倾诉空间，同时也让家长放心。
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  );
}
