import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FreeTrialSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [emotionButtonLimit, setEmotionButtonLimit] = useState<number>(5);
  const [gratitudeRegisterThreshold, setGratitudeRegisterThreshold] = useState<number>(3);
  const [gratitudePurchaseThreshold, setGratitudePurchaseThreshold] = useState<number>(7);
  const [gratitudeReportRequiresPurchase, setGratitudeReportRequiresPurchase] = useState<boolean>(true);

  const { isLoading } = useQuery({
    queryKey: ['app-settings', 'free-trial-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .in('setting_key', ['emotion_button_free_trial', 'gratitude_free_trial']);
      
      if (error) throw error;
      
      data?.forEach(item => {
        if (item.setting_key === 'emotion_button_free_trial') {
          const value = item.setting_value as { limit: number };
          setEmotionButtonLimit(value.limit || 5);
        } else if (item.setting_key === 'gratitude_free_trial') {
          const value = item.setting_value as Record<string, unknown>;
          setGratitudeRegisterThreshold((value.sync_register_threshold as number) || 3);
          setGratitudePurchaseThreshold((value.sync_purchase_threshold as number) || 7);
          setGratitudeReportRequiresPurchase((value.report_requires_purchase as boolean) ?? true);
        }
      });
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Update emotion button settings
      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'emotion_button_free_trial',
          setting_value: { limit: emotionButtonLimit, period: 'lifetime' },
          description: '情绪按钮未登录用户终身免费次数',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });

      // Update gratitude settings
      await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'gratitude_free_trial',
          setting_value: {
            sync_register_threshold: gratitudeRegisterThreshold,
            sync_purchase_threshold: gratitudePurchaseThreshold,
            report_requires_purchase: gratitudeReportRequiresPurchase,
          },
          description: '感恩日记免费试用配置',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('配置保存成功');
    },
    onError: () => toast.error('保存失败'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>情绪按钮免费试用</CardTitle>
          <CardDescription>配置未登录用户的情绪按钮免费体验次数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>终身免费次数</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="100"
                value={emotionButtonLimit}
                onChange={(e) => setEmotionButtonLimit(parseInt(e.target.value) || 5)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground self-center">次</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>感恩日记免费试用</CardTitle>
          <CardDescription>配置未登录用户的感恩日记转化阈值</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>同步N次后提示注册</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="50"
                value={gratitudeRegisterThreshold}
                onChange={(e) => setGratitudeRegisterThreshold(parseInt(e.target.value) || 3)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground self-center">次</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>同步N次后提示购买</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                max="50"
                value={gratitudePurchaseThreshold}
                onChange={(e) => setGratitudePurchaseThreshold(parseInt(e.target.value) || 7)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground self-center">次</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>幸福报告需要购买</Label>
              <p className="text-xs text-muted-foreground">开启后，生成幸福报告需要付费订阅</p>
            </div>
            <Switch
              checked={gratitudeReportRequiresPurchase}
              onCheckedChange={setGratitudeReportRequiresPurchase}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-fit">
        {updateMutation.isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        保存配置
      </Button>
    </div>
  );
};

export default FreeTrialSettings;
