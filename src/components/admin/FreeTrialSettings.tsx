import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FreeTrialSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const [emotionButtonLimit, setEmotionButtonLimit] = useState<number>(5);

  const { isLoading } = useQuery({
    queryKey: ['app-settings', 'emotion_button_free_trial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'emotion_button_free_trial')
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        const value = data.setting_value as { limit: number; period: string };
        setEmotionButtonLimit(value.limit || 5);
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (limit: number) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          setting_key: 'emotion_button_free_trial',
          setting_value: { limit, period: 'lifetime' },
          description: '情绪按钮未登录用户终身免费次数',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('配置保存成功');
    },
    onError: () => toast.error('保存失败'),
  });

  const handleSave = () => {
    updateMutation.mutate(emotionButtonLimit);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>未登录用户免费试用配置</CardTitle>
        <CardDescription>配置未登录用户的免费体验次数，用于转化引导</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 max-w-md">
          <div className="space-y-2">
            <Label>情绪按钮终身免费次数</Label>
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
            <p className="text-xs text-muted-foreground">
              用户在未登录状态下可免费使用情绪按钮的次数，超过后会弹出购买引导
            </p>
          </div>
          
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-fit">
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            保存配置
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FreeTrialSettings;
