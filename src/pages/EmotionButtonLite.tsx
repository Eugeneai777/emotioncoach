import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { ArrowLeft, Info } from "lucide-react";
import { emotionTypes } from "@/config/emotionReliefConfig";
import EmotionIcon from "@/components/icons/emotions/EmotionIcon";
import { AssessmentPayDialog } from "@/components/wealth-block/AssessmentPayDialog";
import { useAuth } from "@/hooks/useAuth";
import { usePackagePurchased } from "@/hooks/usePackagePurchased";

const EmotionButtonLite = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: hasPurchased, isLoading: purchaseLoading } = usePackagePurchased('emotion_button');
  
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  const isLoading = authLoading || purchaseLoading;

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId);
    
    // 已购买用户直接进入疗愈流程
    if (hasPurchased) {
      navigate(`/emotion-button?type=${emotionId}`);
      return;
    }
    
    // 未购买用户弹出支付弹窗
    setShowPayDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    // 支付成功后进入疗愈流程
    if (selectedEmotion) {
      navigate(`/emotion-button?type=${selectedEmotion}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <DynamicOGMeta pageKey="emotionButtonIntro" />
      
      {/* 装饰性背景元素 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-64 h-64 bg-cyan-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* 顶部导航 */}
      <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-teal-700" />
        </button>
        
        <h1 className="text-lg font-bold text-teal-800 flex items-center gap-1.5">
          情绪🆘按钮
        </h1>
        
        <button
          onClick={() => navigate("/emotion-button-intro")}
          className="p-2 rounded-full bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-colors"
        >
          <Info className="w-5 h-5 text-teal-700" />
        </button>
      </div>

      {/* 主内容区 - 9按钮情绪网格 */}
      <div className="relative z-10 px-4 sm:px-6 pb-8">
        <div className="max-w-md mx-auto">
          {/* 提示文字 */}
          <p className="text-center text-sm text-teal-700/80 mb-6">
            选择你现在的情绪，开始30秒情绪急救
          </p>
          
          {/* 9按钮网格 */}
          <div className="grid grid-cols-3 gap-3">
            {emotionTypes.map((emotion) => (
              <button
                key={emotion.id}
                onClick={() => handleEmotionSelect(emotion.id)}
                disabled={isLoading}
                className={`
                  relative flex flex-col items-center justify-center p-4 rounded-2xl
                  bg-gradient-to-br ${emotion.gradient}
                  text-white shadow-lg hover:shadow-xl
                  transform hover:scale-105 active:scale-95
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  min-h-[100px]
                `}
              >
                <EmotionIcon type={emotion.id} className="w-10 h-10 mb-2" />
                <span className="text-sm font-medium">{emotion.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部轻模式提示（未登录用户可见） */}
      {!user && !isLoading && (
        <div className="relative z-10 px-4 pb-8">
          <div className="mt-6 pt-4 border-t border-teal-200/30 space-y-3 text-center">
            <p className="text-muted-foreground text-sm">
              💡 先体验后付费 ¥9.9
            </p>
            <p className="text-muted-foreground text-xs">
              北京好企劲商务信息咨询有限公司 京ICP备2023001408号-5
            </p>
          </div>
        </div>
      )}

      {/* 支付弹窗 */}
      <AssessmentPayDialog
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        packageKey="emotion_button"
        packageName="情绪SOS按钮"
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default EmotionButtonLite;
