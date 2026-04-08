import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractEdgeFunctionError } from '@/lib/edgeFunctionError';

export type VideoGenStatus =
  | 'idle'
  | 'generating_audio'
  | 'uploading_audio'
  | 'submitting_task'
  | 'generating_video'
  | 'merging_video'
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
  videoSegments?: string[];
  compositionProps?: Record<string, any>;
}

interface UseVideoGenerationReturn {
  status: VideoGenStatus;
  error: string | null;
  result: VideoGenResult;
  progress: number;
  segmentProgress: string;
  generate: (params: {
    script: string;
    imageUrl: string;
    voiceType: string;
    structuredScript?: StructuredScript;
    resolution?: '720p' | '1080p';
  }) => Promise<void>;
  reset: () => void;
}

// ─── Segment Grouping ───
// 即梦 API 要求音频时长 ≤ 15s
// 预估时长不可靠，改用字符数限制：中文约 4 字/秒，50 字 ≈ 12.5s（留余量）
const MAX_GROUP_DURATION_SEC = 12;
const MAX_GROUP_CHARS = 50;

interface SegmentGroup {
  segments: ScriptSegment[];
  text: string;
  totalDuration: number;
}

function groupSegments(segments: ScriptSegment[]): SegmentGroup[] {
  const groups: SegmentGroup[] = [];
  let current: ScriptSegment[] = [];
  let currentDuration = 0;
  let currentChars = 0;

  for (const seg of segments) {
    const segDuration = seg.endSec - seg.startSec;
    const segChars = seg.text.length;

    // 如果添加当前段后超出时长或字数限制，先把已有的段落打包
    if (current.length > 0 && (
      currentDuration + segDuration > MAX_GROUP_DURATION_SEC ||
      currentChars + segChars > MAX_GROUP_CHARS
    )) {
      groups.push({
        segments: current,
        text: current.map(s => s.text).join(''),
        totalDuration: currentDuration,
      });
      current = [];
      currentDuration = 0;
      currentChars = 0;
    }

    // 如果单个段落本身就超过字数限制，按句号/逗号拆分
    if (segChars > MAX_GROUP_CHARS && current.length === 0) {
      const subTexts = splitTextBySentence(seg.text, MAX_GROUP_CHARS);
      const avgDurPerChar = segDuration / segChars;
      for (const subText of subTexts) {
        groups.push({
          segments: [{ ...seg, text: subText }],
          text: subText,
          totalDuration: Math.round(subText.length * avgDurPerChar * 10) / 10,
        });
      }
      continue;
    }

    current.push(seg);
    currentDuration += segDuration;
    currentChars += segChars;
  }

  if (current.length > 0) {
    groups.push({
      segments: current,
      text: current.map(s => s.text).join(''),
      totalDuration: currentDuration,
    });
  }

  console.log(`[VideoGen] 分为 ${groups.length} 组:`, groups.map(g => `${g.text.length}字/${g.totalDuration}s`));
  return groups;
}

/** 按中文标点拆分长文本，每段不超过 maxChars */
function splitTextBySentence(text: string, maxChars: number): string[] {
  const results: string[] = [];
  // 按句号、问号、感叹号、分号拆分，保留分隔符
  const sentences = text.split(/(?<=[。！？；，,])/);
  let buf = '';
  for (const s of sentences) {
    if (buf.length + s.length > maxChars && buf.length > 0) {
      results.push(buf);
      buf = '';
    }
    buf += s;
  }
  if (buf) results.push(buf);
  return results;
}

// ─── Single segment pipeline: TTS → Upload → Submit → Poll ───
async function generateSegmentVideo(
  group: SegmentGroup,
  groupIndex: number,
  imageUrl: string,
  voiceType: string,
  abortRef: React.RefObject<boolean>,
  onProgress: (msg: string) => void,
): Promise<string> {
  const label = `片段${groupIndex + 1}`;

  // 1. TTS
  onProgress(`${label}: 生成语音...`);
  const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
    body: { text: group.text, voice_id: voiceType },
  });

  if (ttsData?.error || ttsError || !ttsData?.audioContent) {
    throw new Error(await extractEdgeFunctionError(ttsData, ttsError, `${label} TTS 失败`));
  }
  if (abortRef.current) throw new Error('已取消');

  // 2. Upload audio
  onProgress(`${label}: 上传音频...`);
  const audioBytes = Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0));
  const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('请先登录');

  const fileName = `${user.id}/${Date.now()}_seg${groupIndex}.mp3`;
  const { error: uploadError } = await supabase.storage
    .from('video-assets')
    .upload(fileName, audioBlob, { contentType: 'audio/mpeg' });
  if (uploadError) throw new Error(`${label} 音频上传失败: ${uploadError.message}`);

  const { data: urlData } = supabase.storage.from('video-assets').getPublicUrl(fileName);
  const audioUrl = urlData.publicUrl;
  if (abortRef.current) throw new Error('已取消');

  // 3. Submit Jimeng task
  onProgress(`${label}: 提交数字人任务...`);
  const { data: submitData, error: submitError } = await supabase.functions.invoke('jimeng-digital-human', {
    body: { action: 'submit', image_url: imageUrl, audio_url: audioUrl },
  });

  if (submitData?.status === 'failed' || submitData?.error || submitError || !submitData?.task_id) {
    throw new Error(await extractEdgeFunctionError(submitData, submitError, `${label} 数字人任务提交失败`));
  }

  const taskId = submitData.task_id;
  if (abortRef.current) throw new Error('已取消');

  // 4. Poll for result
  onProgress(`${label}: 视频生成中...`);
  const maxPolls = 120;

  for (let polls = 0; polls < maxPolls; polls++) {
    if (abortRef.current) throw new Error('已取消');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const { data: queryData, error: queryError } = await supabase.functions.invoke('jimeng-digital-human', {
      body: { action: 'query', task_id: taskId },
    });

    if (queryData?.status === 'failed' || queryData?.error) {
      throw new Error(queryData.error || `${label} 视频生成失败`);
    }

    if (queryError) {
      const msg = await extractEdgeFunctionError(queryData, queryError, '');
      if (msg) throw new Error(msg);
      console.warn(`${label} 查询失败，重试中...`);
      continue;
    }

    if (queryData?.code && queryData.code !== 0 && !queryData?.status) {
      throw new Error(queryData.message || `${label} 即梦 API 错误 (code: ${queryData.code})`);
    }

    const taskStatus = queryData?.status;

    if (taskStatus === 'done' && queryData?.video_url) {
      onProgress(`${label}: 完成 ✓`);
      return queryData.video_url;
    }

    if (taskStatus === 'failed' || taskStatus === 'error') {
      throw new Error(queryData?.error || `${label} 视频生成失败`);
    }

    if (taskStatus === 'unknown' && polls > 10) {
      throw new Error(`${label} 任务状态异常，请检查输入`);
    }
  }

  throw new Error(`${label} 视频生成超时`);
}

// ─── Hook ───
export const useVideoGeneration = (): UseVideoGenerationReturn => {
  const [status, setStatus] = useState<VideoGenStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenResult>({});
  const [progress, setProgress] = useState(0);
  const [segmentProgress, setSegmentProgress] = useState('');
  const abortRef = useRef(false);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult({});
    setProgress(0);
    setSegmentProgress('');
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
    setSegmentProgress('');

    try {
      const segments = params.structuredScript?.segments;
      
      // 判断是否需要分段：如果有结构化脚本且总时长 > 15s
      const totalDuration = segments
        ? segments[segments.length - 1].endSec - segments[0].startSec
        : 0;
      
      const needsSplit = segments && totalDuration > 15;

      if (needsSplit && segments) {
        // ═══ 分段生成流程 ═══
        const groups = groupSegments(segments);
        console.log(`[VideoGen] 分为 ${groups.length} 组:`, groups.map(g => `${g.totalDuration}s`));
        
        setStatus('generating_audio');
        setProgress(5);
        setSegmentProgress(`准备生成 ${groups.length} 个视频片段...`);

        // 串行生成每个片段（避免 API 频率限制）
        const videoUrls: string[] = [];
        
        for (let i = 0; i < groups.length; i++) {
          const groupProgress = (i / groups.length) * 85;
          setProgress(5 + Math.round(groupProgress));
          
          // Update status based on current phase
          setStatus(i === 0 ? 'generating_audio' : 'generating_video');
          
          const videoUrl = await generateSegmentVideo(
            groups[i],
            i,
            params.imageUrl,
            params.voiceType,
            abortRef as React.RefObject<boolean>,
            (msg) => setSegmentProgress(msg),
          );
          
          videoUrls.push(videoUrl);
          if (abortRef.current) return;
        }

        setResult(prev => ({ ...prev, videoSegments: videoUrls }));

        // 合并视频
        if (videoUrls.length > 1) {
          setStatus('merging_video');
          setProgress(90);
          setSegmentProgress('正在合并视频片段...');

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('请先登录');

          const { data: mergeData, error: mergeError } = await supabase.functions.invoke('merge-videos', {
            body: { video_urls: videoUrls, user_id: user.id },
          });

          if (mergeError || mergeData?.error) {
            // 合并失败时仍然返回片段列表
            console.warn('视频合并失败，返回片段列表:', mergeData?.error || mergeError);
            setResult(prev => ({
              ...prev,
              videoUrl: videoUrls[0], // 用第一个片段作为预览
              videoSegments: videoUrls,
            }));
          } else {
            setResult(prev => ({
              ...prev,
              videoUrl: mergeData.video_url,
              videoSegments: videoUrls,
            }));
          }
        } else {
          setResult(prev => ({ ...prev, videoUrl: videoUrls[0] }));
        }

        // Build Remotion composition props
        if (params.structuredScript) {
          const fps = 30;
          const ss = params.structuredScript;
          const compositionProps = {
            avatarVideos: videoUrls,
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
          setResult(prev => ({ ...prev, compositionProps }));
        }

        setStatus('done');
        setProgress(100);
        setSegmentProgress(`${groups.length} 个片段全部生成完成！`);
        
      } else {
        // ═══ 单段生成流程（≤15s 的脚本） ═══
        setStatus('generating_audio');
        setProgress(10);

        const { data: ttsData, error: ttsError } = await supabase.functions.invoke('text-to-speech', {
          body: { text: params.script, voice_id: params.voiceType },
        });

        if (ttsData?.error || ttsError || !ttsData?.audioContent) {
          throw new Error(await extractEdgeFunctionError(ttsData, ttsError, 'TTS 语音合成失败'));
        }
        if (abortRef.current) return;
        setProgress(30);

        setStatus('uploading_audio');
        const audioBytes = Uint8Array.from(atob(ttsData.audioContent), c => c.charCodeAt(0));
        const audioBlob = new Blob([audioBytes], { type: 'audio/mpeg' });

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('请先登录');

        const fileName = `${user.id}/${Date.now()}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from('video-assets')
          .upload(fileName, audioBlob, { contentType: 'audio/mpeg' });
        if (uploadError) throw new Error(`音频上传失败: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('video-assets').getPublicUrl(fileName);
        const audioUrl = urlData.publicUrl;

        setResult(prev => ({ ...prev, audioUrl }));
        if (abortRef.current) return;
        setProgress(45);

        setStatus('submitting_task');
        const { data: submitData, error: submitError } = await supabase.functions.invoke('jimeng-digital-human', {
          body: { action: 'submit', image_url: params.imageUrl, audio_url: audioUrl },
        });

        if (submitData?.status === 'failed' || submitData?.error || submitError || !submitData?.task_id) {
          throw new Error(await extractEdgeFunctionError(submitData, submitError, '数字人任务提交失败'));
        }

        const taskId = submitData.task_id;
        setResult(prev => ({ ...prev, taskId }));
        if (abortRef.current) return;
        setProgress(55);

        setStatus('generating_video');
        const maxPolls = 120;

        for (let polls = 0; polls < maxPolls; polls++) {
          if (abortRef.current) return;
          await new Promise(resolve => setTimeout(resolve, 5000));

          const { data: queryData, error: queryError } = await supabase.functions.invoke('jimeng-digital-human', {
            body: { action: 'query', task_id: taskId },
          });

          if (queryData?.status === 'failed' || queryData?.error) {
            throw new Error(queryData.error || '视频生成失败');
          }

          if (queryError) {
            const queryMessage = await extractEdgeFunctionError(queryData, queryError, '');
            if (queryMessage) throw new Error(queryMessage);
            continue;
          }

          if (queryData?.code && queryData.code !== 0 && !queryData?.status) {
            throw new Error(queryData.message || `即梦 API 错误 (code: ${queryData.code})`);
          }

          const taskStatus = queryData?.status;

          if (taskStatus === 'done' && queryData?.video_url) {
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

          if (taskStatus === 'failed' || taskStatus === 'error') {
            throw new Error(queryData?.error || '视频生成失败');
          }

          if (taskStatus === 'unknown' && polls > 10) {
            throw new Error('即梦任务状态异常，请检查输入图片和音频是否符合要求');
          }

          setProgress(55 + Math.min(40, (polls / maxPolls) * 40));
        }

        throw new Error('视频生成超时，请稍后在任务列表中查看');
      }
    } catch (err) {
      if (!abortRef.current) {
        setError(err instanceof Error ? err.message : '未知错误');
        setStatus('error');
      }
    }
  }, []);

  return { status, error, result, progress, segmentProgress, generate, reset };
};
