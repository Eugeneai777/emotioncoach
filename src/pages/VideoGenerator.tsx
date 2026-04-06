import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useVideoGeneration, VideoGenStatus } from '@/hooks/useVideoGeneration';
import { VOICE_TYPE_OPTIONS } from '@/config/voiceTypeConfig';
import { ArrowLeft, Video, CheckCircle2, Loader2, AlertCircle, Download, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS: Record<VideoGenStatus, string> = {
  idle: '等待开始',
  generating_audio: '正在合成语音...',
  uploading_audio: '正在上传音频...',
  submitting_task: '正在提交数字人任务...',
  generating_video: '数字人视频生成中（预计2-5分钟）...',
  done: '视频生成完成！',
  error: '生成失败',
};

const STEPS: { key: VideoGenStatus; label: string }[] = [
  { key: 'generating_audio', label: '语音合成' },
  { key: 'uploading_audio', label: '音频上传' },
  { key: 'submitting_task', label: '提交任务' },
  { key: 'generating_video', label: '视频生成' },
  { key: 'done', label: '完成' },
];

const stepOrder = STEPS.map(s => s.key);

function getStepState(step: VideoGenStatus, current: VideoGenStatus): 'done' | 'active' | 'pending' {
  const stepIdx = stepOrder.indexOf(step);
  const currentIdx = stepOrder.indexOf(current);
  if (currentIdx < 0) return 'pending';
  if (stepIdx < currentIdx) return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

const VideoGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { status, error, result, progress, generate, reset } = useVideoGeneration();

  const [script, setScript] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [voiceType, setVoiceType] = useState(VOICE_TYPE_OPTIONS[0].voice_type);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');

  const isGenerating = !['idle', 'done', 'error'].includes(status);

  const handleGenerate = () => {
    if (!script.trim() || !imageUrl.trim()) return;
    generate({ script: script.trim(), imageUrl: imageUrl.trim(), voiceType, resolution });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Video className="w-5 h-5 text-primary" />
        <h1 className="font-semibold text-lg">AI数字人视频生成</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Config */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">视频配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>人像图片 URL</Label>
              <Input
                placeholder="输入人像照片的公开URL地址"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">推荐：正面半身照，光线均匀，背景简洁</p>
            </div>

            <div className="space-y-2">
              <Label>音色选择</Label>
              <select
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={voiceType}
                onChange={e => setVoiceType(e.target.value)}
                disabled={isGenerating}
              >
                {VOICE_TYPE_OPTIONS.map(v => (
                  <option key={v.id} value={v.voice_type}>
                    {v.emoji} {v.name} — {v.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>分辨率</Label>
              <div className="flex gap-3">
                {(['720p', '1080p'] as const).map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resolution"
                      checked={resolution === r}
                      onChange={() => setResolution(r)}
                      disabled={isGenerating}
                      className="accent-primary"
                    />
                    <span className="text-sm">{r}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Script */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">视频文案</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="输入数字人口播的文案内容..."
              value={script}
              onChange={e => setScript(e.target.value)}
              disabled={isGenerating}
              className="min-h-[160px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              字数：{script.length} · 建议100-300字（约30-90秒视频）
            </p>
          </CardContent>
        </Card>

        {/* Action */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !script.trim() || !imageUrl.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              '🚀 开始生成视频'
            )}
          </Button>
          {(status === 'done' || status === 'error') && (
            <Button variant="outline" size="lg" onClick={reset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Progress */}
        {status !== 'idle' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">生成进度</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} className="h-2" />
              <p className="text-sm font-medium text-center">{STATUS_LABELS[status]}</p>

              <div className="space-y-2">
                {STEPS.map(step => {
                  const state = getStepState(step.key, status);
                  return (
                    <div key={step.key} className="flex items-center gap-3 text-sm">
                      {state === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : state === 'active' ? (
                        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-muted shrink-0" />
                      )}
                      <span className={state === 'pending' ? 'text-muted-foreground' : ''}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {status === 'done' && result.videoUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🎬 生成结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <video
                src={result.videoUrl}
                controls
                className="w-full rounded-lg"
                playsInline
              />
              <Button variant="outline" className="w-full" asChild>
                <a href={result.videoUrl} download target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  下载视频
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;
