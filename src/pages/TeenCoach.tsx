import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Sparkles, Shield, Heart } from "lucide-react";
import { CoachVoiceChat } from "@/components/coach/CoachVoiceChat";
import { PageTour } from "@/components/PageTour";
import { usePageTour } from "@/hooks/usePageTour";
import { pageTourConfig } from "@/config/pageTourConfig";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";

export default function TeenCoach() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const { showTour, completeTour } = usePageTour('teen_coach');

  // Check if teen has active binding
  const { data: binding, isLoading: bindingLoading } = useQuery({
    queryKey: ["teen-binding", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("parent_teen_bindings")
        .select("*")
        .eq("teen_user_id", user.id)
        .eq("status", "active")
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  // 游客模式：允许浏览，不强制跳转到登录页

  useEffect(() => {
    if (!bindingLoading && !binding && user) {
      navigate("/teen/bind");
    }
  }, [binding, bindingLoading, user, navigate]);

  if (authLoading || bindingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <DynamicOGMeta pageKey="teenCoach" />
      <PageTour
        steps={pageTourConfig.teen_coach}
        open={showTour}
        onComplete={completeTour}
      />
      <div className="min-h-screen bg-gradient-to-b from-violet-50 via-purple-50 to-pink-50">
      <div className="container max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-2"
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-400 to-purple-500 rounded-full flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            嗨，欢迎来到你的空间
          </h1>
          <p className="text-muted-foreground">
            这里是属于你的安全角落
          </p>
        </motion.div>

        {/* Voice Call CTA */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <p className="text-muted-foreground">
                想聊聊今天发生的事？或者只是想找人倾诉？
              </p>
              
              <Button
                onClick={() => setIsVoiceChatOpen(true)}
                className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-xl"
              >
                <Phone className="mr-2 h-5 w-5" />
                开始语音对话
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4"
        >
          <Card className="bg-white/60 backdrop-blur border-0">
            <CardContent className="p-4 text-center space-y-2">
              <Shield className="h-8 w-8 mx-auto text-violet-500" />
              <h3 className="font-medium text-sm">完全私密</h3>
              <p className="text-xs text-muted-foreground">
                你说的话只有AI知道
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur border-0">
            <CardContent className="p-4 text-center space-y-2">
              <Heart className="h-8 w-8 mx-auto text-pink-500" />
              <h3 className="font-medium text-sm">被理解</h3>
              <p className="text-xs text-muted-foreground">
                我会认真听你说
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-violet-50/50 border-0">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2 text-violet-700">你可以和我聊</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 学校里发生的事情</li>
                <li>• 和朋友或家人的关系</li>
                <li>• 你的烦恼和困惑</li>
                <li>• 或者任何你想说的</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Voice Chat */}
      {isVoiceChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <CoachVoiceChat
              onClose={() => setIsVoiceChatOpen(false)}
              coachEmoji="✨"
              coachTitle="小星"
              primaryColor="violet"
              tokenEndpoint="vibrant-life-realtime-token"
              mode="teen"
              featureKey="realtime_voice_teen"
            />
          </div>
        </div>
      )}
      </div>
    </>
  );
}
