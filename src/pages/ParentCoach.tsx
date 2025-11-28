import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ParentStageProgress } from "@/components/coach/ParentStageProgress";
import { ParentCoachChat } from "@/components/coach/ParentCoachChat";
import { ParentJourneySummary } from "@/components/coach/ParentJourneySummary";
import { useParentCoach } from "@/hooks/useParentCoach";
import { useToast } from "@/hooks/use-toast";

export default function ParentCoach() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const campId = searchParams.get('campId');
  const { toast } = useToast();
  
  const {
    session,
    messages,
    isLoading,
    createSession,
    sendMessage
  } = useParentCoach();

  const [showSummary, setShowSummary] = useState(false);
  const [briefing, setBriefing] = useState<any>(null);

  useEffect(() => {
    const initSession = async () => {
      if (!session) {
        const newSession = await createSession(campId || undefined);
        
        // Display welcome message without sending to backend
        if (newSession) {
          // The AI will provide the welcome message on first user input
        }
      }
    };
    
    initSession();
  }, []);

  const handleSendMessage = async (message: string) => {
    const response = await sendMessage(message);
    
    if (response?.completed && response?.briefingId) {
      // Load briefing data
      // For now, we'll construct it from the response
      setShowSummary(true);
      setBriefing(response.toolCall?.args);
    }
  };

  const handleSelectOption = (option: string) => {
    handleSendMessage(option);
  };

  const handleShare = () => {
    toast({
      title: "分享功能开发中",
      description: "即将上线社区分享功能"
    });
  };

  const handleDownload = () => {
    toast({
      title: "导出功能开发中",
      description: "即将支持导出简报为图片"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50 to-white">
      <div className="container max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/camps')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-semibold">家长情绪教练</h1>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* Progress */}
        {session && !showSummary && (
          <ParentStageProgress currentStage={session.current_stage} />
        )}

        {/* Main Content */}
        <div className="mt-6">
          {!showSummary ? (
            <Card className="h-[600px] flex flex-col">
              <ParentCoachChat
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onSelectOption={handleSelectOption}
              />
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">🎉 完成四部曲旅程</h2>
                <p className="text-muted-foreground">
                  恭喜你完成了今天的情绪觉察之旅
                </p>
              </div>
              
              {briefing && (
                <ParentJourneySummary
                  briefing={briefing}
                  onShare={handleShare}
                  onDownload={handleDownload}
                />
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/camps')}
                >
                  返回训练营
                </Button>
                <Button 
                  className="flex-1"
                onClick={() => {
                  setShowSummary(false);
                  setBriefing(null);
                  createSession(campId || undefined);
                }}
                >
                  开始新的对话
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Tips */}
        {!showSummary && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>💚 劲老师会温柔地陪伴你完成四个阶段</p>
            <p className="text-xs mt-1">觉察 → 看见 → 感受 → 转化</p>
          </div>
        )}
      </div>
    </div>
  );
}