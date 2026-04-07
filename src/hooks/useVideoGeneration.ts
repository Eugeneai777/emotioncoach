import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type VideoGenStatus =
  | 'idle'
  | 'generating_audio'
  | 'uploading_audio'
  | 'submitting_task'
  | 'generating_video'
  | 'done'
  | 'error';

export interface ScriptSegment {
  type: 'hook' | 'pain' | 'product' | 'result' | 'question';
  text: string;
  startSec: number;
  endSec: number;
  highlight?: string;
}

export interface StructuredScript {
  script: string;
  segments: ScriptSegment[];
  closingQuestion: string;
  closingCta: string;
}

interface VideoGenResult {
  audioUrl?: string;
  taskId?: string;
  videoUrl?: string;
  compositionProps?: Record<string, any>;
}

interface UseVideoGenerationReturn {
  status: VideoGenStatus;
  error: string | null;
  result: VideoGenResult;
  progress: number;
  generate: (params: {
    script: string;
    imageUrl: string;
    voiceType: string;
    structuredScript?: StructuredScript;
    resolution?: '720p' | '1080p';
  }) => Promise<void>;
  reset: () => void;
}

export const useVideoGeneration = (): UseVideoGenerationReturn => {
  const [status, setStatus] = useState<VideoGenStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenResult>({});
  const [progress, setProgress] = useState(0);
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult({});
    setProgress(0);
    abortRef.current = false;
  }, []);

  const generate = useCallback(async (params: {
    script: string;
    imageUrl: string;
    voiceType: string;
    structuredScript?: StructuredScript;
    resolution?: '720p' | '1080p';
  }) => {
    abortRef.current = false;
    setError(null);
    setResult({});

    try {
      // Step 1: TTS
      setStatus('generating_audio');
      setProgress(10);

      const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
        body: { text: params.script, voice_id: params.voiceType },
      });

      if (ttsError || !ttsData?.audioContent) {
        throw new Error(ttsError?.message || ttsData?.error || 'TTS 语音合成失败');
      }

      if (abortRef.current) return;
      setProgress(30);

      // Step 2: Upload audio to Storage
      setStatus('uploading_audio');

      const audioBytes = Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0));
      const audioBlob = new Blob([audioBytes], { type: 'audio/mp3' });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('请先登录');

      const fileName = `${user.id}/${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('video-assets')
        .upload(fileName, audioBlob, { contentType: 'audio/mp3' });

      if (uploadError) throw new Error(`音频上传失败: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('video-assets').getPublicUrl(fileName);
      const audioUrl = urlData.publicUrl;

      setResult(prev => ({ ...prev, audioUrl }));
      if (abortRef.current) return;
      setProgress(45);

      // Step 3: Submit Jimeng task
      setStatus('submitting_task');

      const { data: submitData, error: submitError } = await supabase.functions.invoke('jimeng-digital-human', {
        body: {
          action: 'submit',
          image_url: params.imageUrl,
          audio_url: audioUrl,
        },
      });

      if (submitError || !submitData?.task_id) {
        throw new Error(submitError?.message || submitData?.error || '数字人任务提交失败');
      }

      const taskId = submitData.task_id;
      setResult(prev => ({ ...prev, taskId }));
      if (abortRef.current) return;
      setProgress(55);

      // Step 4: Poll for result
      setStatus('generating_video');

      const maxPolls = 120;
      let polls = 0;

      while (polls < maxPolls) {
        if (abortRef.current) return;

        await new Promise(resolve => setTimeout(resolve, 5000));
        polls++;

        const { data: queryData, error: queryError } = await supabase.functions.invoke('jimeng-digital-human', {
          body: { action: 'query', task_id: taskId },
        });

        if (queryError) {
          console.warn('查询失败，重试中...', queryError.message);
          continue;
        }

        // Check for API-level errors (e.g. code 50215 "Input invalid")
        if (queryData?.code && queryData.code !== 0 && !queryData?.status) {
          throw new Error(queryData.message || `即梦 API 错误 (code: ${queryData.code})`);
        }

        const taskStatus = queryData?.status;

        if (taskStatus === 'done' && queryData?.video_url) {
          // Build Remotion composition props if structured script is available
          let compositionProps: Record<string, any> | undefined;
          if (params.structuredScript) {
            const fps = 30;
            const ss = params.structuredScript;
            compositionProps = {
              avatarVideo: queryData.video_url,
              subtitles: ss.segments.map(seg => ({
                text: seg.text,
                startFrame: Math.round(seg.startSec * fps),
                endFrame: Math.round(seg.endSec * fps),
                style: seg.type === 'result' ? 'pain' : seg.type,
                highlight: seg.highlight,
              })),
              closingQuestion: ss.closingQuestion,
              closingCta: ss.closingCta,
              questionStartFrame: Math.round(
                (ss.segments.find(s => s.type === 'question')?.startSec ?? 25) * fps
              ),
              brollClips: [],
              productScreenshots: [],
            };
          }

          setResult(prev => ({
            ...prev,
            videoUrl: queryData.video_url,
            compositionProps,
          }));
          setStatus('done');
          setProgress(100);
          return;
        }

        if (taskStatus === 'failed') {
          throw new Error(queryData?.error || '视频生成失败');
        }

        const pollProgress = 55 + Math.min(40, (polls / maxPolls) * 40);
        setProgress(Math.round(pollProgress));
      }

      throw new Error('视频生成超时，请稍后在任务列表中查看');
    } catch (err) {
      if (!abortRef.current) {
        setError(err instanceof Error ? err.message : '未知错误');
        setStatus('error');
      }
    }
  }, []);

  return { status, error, result, progress, generate, reset };
};
