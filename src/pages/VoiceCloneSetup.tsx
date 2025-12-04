import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Square, Play, Pause, Upload, Sparkles, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SAMPLE_TEXT = `我很安全，这只是暂时的感觉。我可以慢慢呼吸，让身体放松下来。
我已经度过了很多困难的时刻，这一次也会过去。
我比我想象的更坚强，我相信自己。`;

const MIN_RECORDING_SECONDS = 15;
const MAX_RECORDING_SECONDS = 60;

export default function VoiceCloneSetup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [hasVoiceClone, setHasVoiceClone] = useState(false);
  const [isCreatingClone, setIsCreatingClone] = useState(false);
  const [cloneProgress, setCloneProgress] = useState(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) {
      checkExistingVoiceClone();
      checkGeneratedVoices();
    }
  }, [user]);

  const checkExistingVoiceClone = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_voice_clones')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    setHasVoiceClone(!!data);
  };

  const checkGeneratedVoices = async () => {
    if (!user) return;
    const { count } = await supabase
      .from('user_voice_recordings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);
    setGeneratedCount(count || 0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error("Recording error:", error);
      toast({ title: "录音失败", description: "请检查麦克风权限", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioURL) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const clearRecording = () => {
    setAudioURL(null);
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const uploadAndCreateClone = async () => {
    if (!audioBlob || !user) return;
    if (recordingTime < MIN_RECORDING_SECONDS) {
      toast({ title: "录音太短", description: `请至少录制${MIN_RECORDING_SECONDS}秒`, variant: "destructive" });
      return;
    }

    setIsCreatingClone(true);
    setCloneProgress(10);

    try {
      const storagePath = `${user.id}/voice_sample.webm`;
      setCloneProgress(30);

      const { error: uploadError } = await supabase.storage
        .from('voice-recordings')
        .upload(storagePath, audioBlob, { contentType: 'audio/webm', upsert: true });

      if (uploadError) throw uploadError;
      setCloneProgress(50);

      const { data, error } = await supabase.functions.invoke('create-voice-clone', {
        body: { audio_storage_path: storagePath, voice_name: '我的声音' }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      setCloneProgress(100);
      setHasVoiceClone(true);
      toast({ title: "声音克隆成功！", description: "现在可以用你的声音生成语音提醒了" });
    } catch (error: unknown) {
      console.error('Clone error:', error);
      toast({ title: "声音克隆失败", description: error instanceof Error ? error.message : '创建失败', variant: "destructive" });
    } finally {
      setIsCreatingClone(false);
      setCloneProgress(0);
    }
  };

  const TOTAL_REMINDERS = 288; // 9 emotions × 32 reminders

  const generateAllReminders = async () => {
    if (!user) return;
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 0.3, 95));
      }, 1000);

      const { data, error } = await supabase.functions.invoke('generate-all-reminders');
      clearInterval(progressInterval);

      if (error) throw error;

      setGenerationProgress(100);
      setGeneratedCount(data.generated || TOTAL_REMINDERS);
      toast({ title: "语音生成完成！", description: `成功生成 ${data.generated}/${TOTAL_REMINDERS} 条语音提醒` });

      setTimeout(() => navigate('/panic-voice-settings'), 1500);
    } catch (error: unknown) {
      console.error('Generation error:', error);
      toast({ title: "生成失败", description: error instanceof Error ? error.message : '生成失败', variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteVoiceClone = async () => {
    if (!user) return;
    const { error } = await supabase.from('user_voice_clones').delete().eq('user_id', user.id);
    if (!error) {
      setHasVoiceClone(false);
      toast({ title: "已删除声音克隆", description: "你可以重新录制声音样本" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-teal-100">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-teal-800">AI 语音生成</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto">
        {/* Step 1: Record Voice Sample */}
        <Card className="p-5 bg-white/70 backdrop-blur border-teal-200/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">1</div>
            <h2 className="font-semibold text-teal-800">录制声音样本</h2>
            {hasVoiceClone && <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">✓ 已完成</span>}
          </div>

          {!hasVoiceClone ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">请朗读以下文字（约15-60秒），AI将学习你的声音：</p>
              <div className="bg-teal-50/50 rounded-xl p-4 mb-4 border border-teal-100">
                <p className="text-sm text-teal-700 leading-relaxed whitespace-pre-line">{SAMPLE_TEXT}</p>
              </div>

              <div className="space-y-4">
                {!audioURL ? (
                  <div className="flex flex-col items-center gap-4">
                    {isRecording && (
                      <div className="text-center">
                        <div className="text-3xl font-mono text-teal-600 mb-2">
                          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </div>
                        <Progress value={(recordingTime / MAX_RECORDING_SECONDS) * 100} className="w-48" />
                        <p className="text-xs text-muted-foreground mt-1">至少录制{MIN_RECORDING_SECONDS}秒</p>
                      </div>
                    )}
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-gradient-to-br from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600'}`}
                    >
                      {isRecording ? <Square className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8 text-white" />}
                    </Button>
                    <p className="text-sm text-muted-foreground">{isRecording ? '点击停止录音' : '点击开始录音'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} className="hidden" />
                    <div className="flex items-center justify-center gap-3">
                      <Button variant="outline" size="icon" onClick={togglePlayback} className="w-12 h-12 rounded-full">
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      </Button>
                      <span className="text-sm text-muted-foreground">录音时长: {recordingTime}秒</span>
                      <Button variant="ghost" size="icon" onClick={clearRecording} className="text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button onClick={uploadAndCreateClone} disabled={isCreatingClone || recordingTime < MIN_RECORDING_SECONDS} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500">
                      {isCreatingClone ? <>创建声音克隆中... {cloneProgress}%</> : <><Upload className="w-4 h-4 mr-2" />创建我的声音克隆</>}
                    </Button>
                    {isCreatingClone && <Progress value={cloneProgress} className="h-2" />}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Volume2 className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
              <p className="text-sm text-emerald-700 mb-3">声音克隆已创建</p>
              <Button variant="outline" size="sm" onClick={deleteVoiceClone} className="text-red-500 border-red-200">
                <Trash2 className="w-3 h-3 mr-1" />删除并重新录制
              </Button>
            </div>
          )}
        </Card>

        {/* Step 2: Generate Reminders */}
        <Card className="p-5 bg-white/70 backdrop-blur border-teal-200/50">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${hasVoiceClone ? 'bg-gradient-to-br from-teal-400 to-cyan-500' : 'bg-gray-300'}`}>2</div>
            <h2 className={`font-semibold ${hasVoiceClone ? 'text-teal-800' : 'text-gray-400'}`}>生成288条语音提醒</h2>
            {generatedCount >= 288 && <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">✓ 已生成</span>}
          </div>

          {hasVoiceClone ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">使用你的声音克隆，一键生成全部9种情绪×32条语音提醒。</p>
              {isGenerating && (
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-xs text-center text-muted-foreground">正在生成语音... {Math.round(generationProgress)}%（约需5-10分钟）</p>
                </div>
              )}
              <Button onClick={generateAllReminders} disabled={isGenerating} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500">
                {isGenerating ? '生成中...' : <><Sparkles className="w-4 h-4 mr-2" />用我的声音生成288条语音</>}
              </Button>
              {generatedCount > 0 && !isGenerating && <p className="text-xs text-center text-muted-foreground">已生成 {generatedCount}/288 条语音</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">请先完成步骤1，录制你的声音样本</p>
          )}
        </Card>

        {/* Quick Generate without Clone */}
        <Card className="p-4 bg-white/50 backdrop-blur border-teal-200/30">
          <p className="text-sm text-muted-foreground text-center mb-3">或者使用预设AI温柔女声快速生成全部288条语音</p>
          <Button variant="outline" onClick={generateAllReminders} disabled={isGenerating || isCreatingClone} className="w-full">
            <Volume2 className="w-4 h-4 mr-2" />使用预设女声生成288条语音
          </Button>
        </Card>
      </div>
    </div>
  );
}
