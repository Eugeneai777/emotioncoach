import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2, Sparkles } from "lucide-react";
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

  if (entryCount === 0) return null;

  return (
    <div className="p-4 bg-gradient-to-r from-teal-50/90 to-cyan-50/90 dark:from-teal-900/30 dark:to-cyan-900/30 rounded-2xl border border-teal-200/60 dark:border-teal-700/40 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
          <Cloud className="w-5 h-5 text-white" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
            本地已存 {entryCount} 条感恩
          </p>
          <p className="text-xs text-teal-600/80 dark:text-teal-400/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            同步后解锁 AI 幸福分析
          </p>
        </div>
        
        {/* Button */}
        <Button
          size="sm"
          onClick={handleSyncClick}
          disabled={loading}
          className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 shadow-md px-4"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Cloud className="w-4 h-4 mr-1.5" />
              同步
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
