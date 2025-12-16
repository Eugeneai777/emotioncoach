import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2, Sparkles, Shield, Smartphone, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface GratitudeFreeTrialConfig {
  sync_register_threshold: number;
  sync_purchase_threshold: number;
  report_requires_purchase: boolean;
}

interface GratitudeSyncButtonProps {
  entryCount: number;
  syncClickCount: number;
  onSyncClick: () => number;
  onRegisterPrompt: () => void;
  onPurchasePrompt: (isRequired: boolean) => void;
}

// 根据记录数量获取情感化文案
const getEmotionalMessage = (count: number) => {
  if (count === 0) return "写下第一条感恩，开启幸福之旅";
  if (count === 1) return "1 份感恩，值得被永久珍藏";
  if (count < 3) return `${count} 份美好，同步到云端更安心`;
  if (count < 7) return `${count} 份珍贵回忆，别让它们只存本地`;
  return `${count} 份感恩宝藏，立即同步到云端`;
};

// 价值点配置
const valuePoints = [
  { icon: Shield, text: "永久保存" },
  { icon: Smartphone, text: "多设备访问" },
  { icon: Sparkles, text: "AI 幸福分析" },
  { icon: TrendingUp, text: "成长轨迹" },
];

export const GratitudeSyncButton = ({
  entryCount,
  syncClickCount,
  onSyncClick,
  onRegisterPrompt,
  onPurchasePrompt,
}: GratitudeSyncButtonProps) => {
  const [loading, setLoading] = useState(false);

  // Fetch thresholds from app_settings
  const { data: config } = useQuery({
    queryKey: ["gratitude-free-trial-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "gratitude_free_trial")
        .maybeSingle();
      
      const defaultConfig: GratitudeFreeTrialConfig = {
        sync_register_threshold: 3,
        sync_purchase_threshold: 7,
        report_requires_purchase: true,
      };
      
      if (data?.setting_value && typeof data.setting_value === 'object') {
        const value = data.setting_value as Record<string, unknown>;
        return {
          sync_register_threshold: (value.sync_register_threshold as number) ?? 3,
          sync_purchase_threshold: (value.sync_purchase_threshold as number) ?? 7,
          report_requires_purchase: (value.report_requires_purchase as boolean) ?? true,
        };
      }
      return defaultConfig;
    },
    staleTime: 1000 * 60 * 5,
  });

  const registerThreshold = config?.sync_register_threshold ?? 3;
  const purchaseThreshold = config?.sync_purchase_threshold ?? 7;

  const handleSyncClick = () => {
    // If already reached purchase threshold, show mandatory purchase prompt (don't increment)
    if (syncClickCount >= purchaseThreshold) {
      onPurchasePrompt(true);
      return;
    }

    setLoading(true);
    
    // Simulate a brief sync action
    setTimeout(() => {
      const newCount = onSyncClick();
      setLoading(false);
      
      // Check thresholds and trigger appropriate prompt
      if (newCount >= purchaseThreshold) {
        onPurchasePrompt(true); // Mandatory purchase
      } else if (newCount >= registerThreshold) {
        onRegisterPrompt();
      }
    }, 500);
  };

  const hasEntries = entryCount > 0;

  return (
    <div className="p-4 bg-gradient-to-r from-teal-50/90 to-cyan-50/90 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl border border-teal-200/60 dark:border-teal-700/40 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        {/* Animated Cloud Icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg animate-float">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {hasEntries ? (
            <>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                📝 本地已存 {entryCount} 条感恩
              </p>
              <p className="text-xs text-teal-600/80 dark:text-teal-400/70 mt-0.5">
                💝 {getEmotionalMessage(entryCount)}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                写下你的第一条感恩
              </p>
              <p className="text-xs text-teal-600/80 dark:text-teal-400/70 mt-0.5">
                每天记录 3 件小事，幸福感提升 25%
              </p>
            </>
          )}
        </div>
      </div>

      {/* Sync Button */}
      {hasEntries && (
        <Button
          onClick={handleSyncClick}
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md mb-3 h-10"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Cloud className="w-4 h-4 mr-2" />
              同步到云端
            </>
          )}
        </Button>
      )}

      {/* Value Points */}
      <div className="flex flex-wrap gap-2 justify-center">
        {valuePoints.map((point, index) => (
          <div
            key={index}
            className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-800/30 px-2 py-1 rounded-full"
          >
            <point.icon className="w-3 h-3" />
            <span>{point.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
