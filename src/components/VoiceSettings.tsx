import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

export const VoiceSettings = () => {
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [voiceRate, setVoiceRate] = useState(0.9);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { speak, isSupported, setVoiceGender: updateVoiceGender, setVoiceRate: updateVoiceRate } = useSpeechSynthesis({ gender: voiceGender, rate: voiceRate });

  useEffect(() => {
    loadVoiceSettings();
  }, []);

  const loadVoiceSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('voice_gender, voice_rate')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setVoiceGender(data.voice_gender as 'female' | 'male');
        setVoiceRate(data.voice_rate || 0.9);
        updateVoiceGender(data.voice_gender as 'female' | 'male');
        updateVoiceRate(data.voice_rate || 0.9);
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  };

  const saveVoiceSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('未登录');

      const { error } = await supabase
        .from('profiles')
        .update({
          voice_gender: voiceGender,
          voice_rate: voiceRate
        })
        .eq('id', user.id);

      if (error) throw error;

      updateVoiceGender(voiceGender);
      updateVoiceRate(voiceRate);

      toast({
        title: "设置已保存 🎙️",
        description: "语音设置已更新",
      });
    } catch (error) {
      console.error('Error saving voice settings:', error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testVoice = () => {
    updateVoiceGender(voiceGender);
    updateVoiceRate(voiceRate);
    speak("你好，这是语音测试。劲老师会用这个声音陪伴你进行情绪梳理。");
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">您的浏览器不支持语音功能</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">语音设置</h3>
        <p className="text-sm text-muted-foreground">自定义劲老师的语音音色和语速</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <Label className="text-base font-medium">语音音色</Label>
          <RadioGroup value={voiceGender} onValueChange={(value) => setVoiceGender(value as 'female' | 'male')}>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer flex-1 text-sm">
                女声（温柔）
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer flex-1 text-sm">
                男声（沉稳）
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-base font-medium">语速</Label>
            <span className="text-sm text-muted-foreground">{voiceRate.toFixed(1)}x</span>
          </div>
          <Slider
            value={[voiceRate]}
            onValueChange={(values) => setVoiceRate(values[0])}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>慢速 (0.5x)</span>
            <span>正常 (1.0x)</span>
            <span>快速 (2.0x)</span>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={testVoice}
            className="flex-1 gap-2"
          >
            <Volume2 className="w-4 h-4" />
            试听
          </Button>
          <Button
            onClick={saveVoiceSettings}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? "保存中..." : "保存设置"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
