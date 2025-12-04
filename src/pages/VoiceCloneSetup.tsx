import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mic, Square, Play, Pause, Upload, Sparkles, Volume2, Trash2, CheckCircle2 } from "lucide-react";
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

const EMOTION_TYPES = [
  { id: 'panic', title: '恐慌', emoji: '😰' },
  { id: 'worry', title: '担心', emoji: '😟' },
  { id: 'negative', title: '负面', emoji: '😔' },
  { id: 'fear', title: '恐惧', emoji: '😨' },
  { id: 'irritable', title: '烦躁', emoji: '😤' },
  { id: 'stress', title: '压力', emoji: '😫' },
  { id: 'powerless', title: '无力', emoji: '😞' },
  { id: 'collapse', title: '崩溃', emoji: '😭' },
  { id: 'loss', title: '失落', emoji: '💔' },
];

const TOTAL_REMINDERS = 288; // 9 emotions × 32 reminders

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
  const [generatedCount, setGeneratedCount] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null);
  const [emotionProgress, setEmotionProgress] = useState<Record<string, number>>({});
  
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
    
    const progressMap: Record<string, number> = {};
    let total = 0;

    for (const emotion of EMOTION_TYPES) {
      const { count } = await supabase
        .from('user_voice_recordings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('emotion_type', emotion.id)
        .eq('is_ai_generated', true);
      
      const emotionCount = count || 0;
      progressMap[emotion.id] = emotionCount;
      total += emotionCount;
    }
    
    setEmotionProgress(progressMap);
    setGeneratedCount(total);
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

  const generateAllReminders = async () => {
    if (!user) return;
    setIsGenerating(true);
    
    try {
      let completed = generatedCount;
      
      // Loop through emotions until all complete
      while (completed < TOTAL_REMINDERS) {
        const { data, error } = await supabase.functions.invoke('generate-all-reminders', {
          body: {} // Let backend auto-detect next emotion
        });

        if (error) throw error;

        if (data.allComplete) {
          break;
        }

        // Update progress
        completed = data.totalGenerated || completed;
        setGeneratedCount(completed);
        setCurrentEmotion(data.emotionTitle || null);
        
        // Update emotion progress map
        if (data.emotionType) {
          setEmotionProgress(prev => ({
            ...prev,
            [data.emotionType]: data.generated
          }));
        }

        // If emotion not complete due to errors, still move on
        if (!data.isEmotionComplete && data.errors?.length > 0) {
          console.warn('Some errors occurred:', data.errors);
        }
      }

      await checkGeneratedVoices();
      toast({ title: "语音生成完成！", description: `成功生成 ${completed}/${TOTAL_REMINDERS} 条语音提醒` });
      setTimeout(() => navigate('/panic-voice-settings'), 1500);
    } catch (error: unknown) {
      console.error('Generation error:', error);
      toast({ title: "生成失败", description: error instanceof Error ? error.message : '生成失败', variant: "destructive" });
      // Refresh progress on error
      await checkGeneratedVoices();
    } finally {
      setIsGenerating(false);
      setCurrentEmotion(null);
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

  const getCompletedEmotionsCount = () => {
    return EMOTION_TYPES.filter(e => (emotionProgress[e.id] || 0) >= 32).length;
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
        {/* Progress Overview */}
        <Card className="p-4 bg-white/70 backdrop-blur border-teal-200/50">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-teal-800">生成进度</span>
            <span className="ml-auto text-sm text-muted-foreground">
              {getCompletedEmotionsCount()}/9 种情绪 · {generatedCount}/{TOTAL_REMINDERS} 条
            </span>
          </div>
          <Progress value={(generatedCount / TOTAL_REMINDERS) * 100} className="h-2 mb-3" />
          
          {/* Emotion Grid */}
          <div className="grid grid-cols-3 gap-2">
            {EMOTION_TYPES.map(emotion => {
              const count = emotionProgress[emotion.id] || 0;
              const isComplete = count >= 32;
              const isCurrent = currentEmotion === emotion.title;
              
              return (
                <div
                  key={emotion.id}
                  className={`p-2 rounded-lg text-center text-xs transition-all ${
                    isComplete 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : isCurrent
                      ? 'bg-primary/20 text-primary animate-pulse'
                      : 'bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <div className="text-base">{emotion.emoji}</div>
                  <div className="font-medium text-[10px]">{emotion.title}</div>
                  <div className="text-[9px] opacity-70">
                    {isComplete ? (
                      <CheckCircle2 className="w-3 h-3 mx-auto text-emerald-600" />
                    ) : (
                      `${count}/32`
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Step 1: Record Voice Sample */}
        <Card className="p-5 bg-white/70 backdrop-blur border-teal-200/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">1</div>
            <h2 className="font-semibold text-teal-800">录制声音样本（可选）</h2>
            {hasVoiceClone && <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">✓ 已完成</span>}
          </div>

          {!hasVoiceClone ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">录制15-60秒语音，AI将学习你的声音：</p>
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">2</div>
            <h2 className="font-semibold text-teal-800">生成语音提醒</h2>
            {generatedCount >= TOTAL_REMINDERS && <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">✓ 已完成</span>}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {hasVoiceClone ? '使用你的声音克隆' : '使用预设AI温柔女声'}，生成9种情绪×32条语音提醒。
            </p>
            
            {isGenerating && (
              <div className="space-y-2 p-3 bg-teal-50/50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-teal-700">
                    {currentEmotion ? `正在生成: ${currentEmotion}` : '准备中...'}
                  </span>
                  <span className="font-mono text-teal-600">{generatedCount}/{TOTAL_REMINDERS}</span>
                </div>
                <Progress value={(generatedCount / TOTAL_REMINDERS) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">每种情绪约需2分钟</p>
              </div>
            )}

            {generatedCount >= TOTAL_REMINDERS ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="text-emerald-600 font-medium">全部 {TOTAL_REMINDERS} 条语音已生成</p>
                <Button variant="outline" className="mt-3" onClick={() => navigate('/panic-voice-settings')}>
                  查看语音设置
                </Button>
              </div>
            ) : (
              <Button 
                onClick={generateAllReminders} 
                disabled={isGenerating || isCreatingClone} 
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
              >
                {isGenerating ? '生成中...' : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {generatedCount > 0 ? '继续生成' : '开始生成语音'}
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
