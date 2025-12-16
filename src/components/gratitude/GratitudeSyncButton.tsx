import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, Loader2 } from "lucide-react";
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
  onPurchasePrompt: () => void;
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
    setLoading(true);
    
    // Simulate a brief sync action
    setTimeout(() => {
      const newCount = onSyncClick();
      setLoading(false);
      
      // Check thresholds and trigger appropriate prompt
      if (newCount >= purchaseThreshold) {
        onPurchasePrompt();
      } else if (newCount >= registerThreshold) {
        onRegisterPrompt();
      }
    }, 500);
  };

  if (entryCount === 0) return null;

  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50/80 to-cyan-50/80 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200/50 dark:border-teal-700/30">
      <div className="flex-1">
        <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
          本地已存 {entryCount} 条感恩
        </p>
        <p className="text-xs text-teal-600/80 dark:text-teal-400/80">
          点击同步到云端，永久保存
        </p>
      </div>
      <Button
        size="sm"
        onClick={handleSyncClick}
        disabled={loading}
        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
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
  );
};
