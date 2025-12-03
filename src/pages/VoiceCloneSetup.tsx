import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, MicOff, Play, Pause, CheckCircle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const sampleSentences = [
  {
    title: "样本 1",
    text: "你是安全的。这只是身体的一个警报，它会过去的。慢慢呼吸，我在这里陪着你。"
  },
  {
    title: "样本 2", 
    text: "你已经经历过很多困难的时刻，每一次你都度过了。这一次也一样，你比你想象的更强大。"
  },
  {
    title: "样本 3",
    text: "现在，让我们把注意力放在呼吸上。吸气...慢慢地...呼气...很好，就是这样。"
  }
];

interface RecordedSample {
  blob: Blob;
  url: string;
  duration: number;
}

const VoiceCloneSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'record' | 'clone' | 'generate'>('record');
  const [recordedSamples, setRecordedSamples] = useState<(RecordedSample | null)[]>([null, null, null]);
  const [recordingIndex, setRecordingIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isCloning, setIsCloning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [voiceCloneStatus, setVoiceCloneStatus] = useState<string>('none');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (user) {
      checkVoiceCloneStatus();
    }
  }, [user]);

  const checkVoiceCloneStatus = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('voice_clone_status, cloned_voice_id')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setVoiceCloneStatus(data.voice_clone_status || 'none');
      if (data.voice_clone_status === 'ready') {
        setCurrentStep('generate');
      }
    }
  };

  const startRecording = async (index: number) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true 
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;

        setRecordedSamples(prev => {
          const newSamples = [...prev];
          newSamples[index] = { blob, url, duration };
          return newSamples;
        });

        stream.getTracks().forEach(track => track.stop());
        setRecordingIndex(null);
      };

      mediaRecorder.start();
      setRecordingIndex(index);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const playRecording = (index: number) => {
    const sample = recordedSamples[index];
    if (!sample) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(sample.url);
    audioRef.current = audio;
    
    audio.onended = () => setPlayingIndex(null);
    audio.play();
    setPlayingIndex(index);
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayingIndex(null);
    }
  };

  const deleteRecording = (index: number) => {
    setRecordedSamples(prev => {
      const newSamples = [...prev];
      if (newSamples[index]?.url) {
        URL.revokeObjectURL(newSamples[index]!.url);
      }
      newSamples[index] = null;
      return newSamples;
    });
  };

  const handleCreateVoiceClone = async () => {
    const validSamples = recordedSamples.filter(s => s !== null);
    if (validSamples.length < 1) {
      toast.error('请至少录制 1 个语音样本');
      return;
    }

    setIsCloning(true);
    try {
      // Convert blobs to base64
      const samples = await Promise.all(
        validSamples.map(async (sample) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(sample!.blob);
          });
        })
      );

      const { data, error } = await supabase.functions.invoke('clone-voice', {
        body: { samples }
      });

      if (error) throw error;

      toast.success('声音克隆成功！');
      setVoiceCloneStatus('ready');
      setCurrentStep('generate');
    } catch (error: any) {
      console.error('Error cloning voice:', error);
      toast.error(error.message || '声音克隆失败，请重试');
    } finally {
      setIsCloning(false);
    }
  };

  const handleGenerateAllReminders = async () => {
    setIsGenerating(true);
    setGenerateProgress(0);

    // Simulate progress since we can't get real-time updates
    const progressInterval = setInterval(() => {
      setGenerateProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 5;
      });
    }, 2000);

    try {
      const { data, error } = await supabase.functions.invoke('generate-all-reminders', {});

      clearInterval(progressInterval);
      setGenerateProgress(100);

      if (error) throw error;

      toast.success(`成功生成 ${data.generated} 条语音提醒！`);
      
      setTimeout(() => {
        navigate('/panic-voice-settings');
      }, 1500);
    } catch (error: any) {
      console.error('Error generating reminders:', error);
      toast.error(error.message || '生成失败，请重试');
      clearInterval(progressInterval);
    } finally {
      setIsGenerating(false);
    }
  };

  const completedSamples = recordedSamples.filter(s => s !== null).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-teal-100">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-teal-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-medium text-teal-800">AI 语音克隆</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'record' ? 'bg-teal-500 text-white' : 'bg-teal-100 text-teal-600'
          }`}>1</div>
          <div className="w-8 h-0.5 bg-teal-200" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'clone' ? 'bg-teal-500 text-white' : 
            voiceCloneStatus === 'ready' ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-400'
          }`}>2</div>
          <div className="w-8 h-0.5 bg-teal-200" />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'generate' ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'
          }`}>3</div>
        </div>

        {currentStep === 'record' && (
          <>
            {/* Instructions */}
            <div className="bg-white/60 backdrop-blur rounded-2xl p-4">
              <h2 className="font-medium text-teal-800 mb-2">录制语音样本</h2>
              <p className="text-sm text-teal-600/70">
                请用清晰、平和的语气朗读以下句子。每个样本约 15-20 秒，我们会用这些样本克隆你的声音。
              </p>
            </div>

            {/* Recording cards */}
            <div className="space-y-4">
              {sampleSentences.map((sentence, index) => (
                <div key={index} className="bg-white/70 backdrop-blur rounded-2xl p-4 border border-teal-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-teal-700">{sentence.title}</span>
                    {recordedSamples[index] && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-sm text-teal-800 mb-4 leading-relaxed">
                    "{sentence.text}"
                  </p>

                  <div className="flex items-center gap-2">
                    {recordingIndex === index ? (
                      <Button
                        size="sm"
                        className="flex-1 bg-red-500 hover:bg-red-600"
                        onClick={stopRecording}
                      >
                        <MicOff className="w-4 h-4 mr-1" /> 停止录制
                      </Button>
                    ) : recordedSamples[index] ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => playingIndex === index ? stopPlaying() : playRecording(index)}
                        >
                          {playingIndex === index ? (
                            <><Pause className="w-4 h-4 mr-1" /> 暂停</>
                          ) : (
                            <><Play className="w-4 h-4 mr-1" /> 播放</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteRecording(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startRecording(index)}
                        >
                          重录
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className={`flex-1 ${recordingIndex === index ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'}`}
                        onClick={() => recordingIndex === index ? stopRecording() : startRecording(index)}
                      >
                        {recordingIndex === index ? (
                          <><MicOff className="w-4 h-4 mr-1" /> 停止录制</>
                        ) : (
                          <><Mic className="w-4 h-4 mr-1" /> 开始录制</>
                        )}
                      </Button>
                    )}
                  </div>

                  {recordedSamples[index] && (
                    <p className="text-xs text-teal-500 mt-2">
                      时长: {recordedSamples[index]!.duration.toFixed(1)}秒
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Next step button */}
            <Button
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600"
              disabled={completedSamples < 1 || isCloning}
              onClick={handleCreateVoiceClone}
            >
              {isCloning ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在创建声音克隆...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> 创建我的声音 ({completedSamples}/3 样本)</>
              )}
            </Button>
          </>
        )}

        {currentStep === 'generate' && (
          <>
            <div className="bg-white/60 backdrop-blur rounded-2xl p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="font-medium text-teal-800 mb-2">声音克隆完成！</h2>
              <p className="text-sm text-teal-600/70">
                现在可以用你的声音生成全部 32 条恐慌缓解提醒语音
              </p>
            </div>

            {isGenerating && (
              <div className="bg-white/60 backdrop-blur rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-teal-700">生成进度</span>
                  <span className="text-sm text-teal-600">{Math.round(generateProgress)}%</span>
                </div>
                <Progress value={generateProgress} className="h-2" />
                <p className="text-xs text-teal-500/70 mt-2 text-center">
                  正在生成语音，预计需要 2-3 分钟...
                </p>
              </div>
            )}

            <Button
              className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-500 hover:to-cyan-600"
              disabled={isGenerating}
              onClick={handleGenerateAllReminders}
            >
              {isGenerating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 正在生成...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> 一键生成全部 32 条语音</>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/panic-voice-settings')}
            >
              跳过，手动录制
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceCloneSetup;
