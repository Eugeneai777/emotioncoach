import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideoGeneration, VideoGenStatus, StructuredScript, ScriptSegment } from '@/hooks/useVideoGeneration';
import { VOICE_TYPE_OPTIONS } from '@/config/voiceTypeConfig';
import { VIDEO_AUDIENCES } from '@/config/videoScriptConfig';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Video, CheckCircle2, Loader2, AlertCircle,
  Download, RotateCcw, Camera, Sparkles, ImageIcon, Copy, FileJson,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

const SEGMENT_META: Record<string, { label: string; emoji: string; color: string }> = {
  hook: { label: 'Hook · 黄金3秒', emoji: '🎣', color: 'border-l-red-500' },
  pain: { label: '痛点展开 · 7秒', emoji: '💔', color: 'border-l-orange-500' },
  product: { label: '产品介绍 · 8秒', emoji: '✨', color: 'border-l-blue-500' },
  result: { label: '效果展示 · 7秒', emoji: '📊', color: 'border-l-green-500' },
  question: { label: '互动提问 · 5秒', emoji: '❓', color: 'border-l-purple-500' },
};

const VideoGenerator: React.FC = () => {
  const navigate = useNavigate();
  const { status, error, result, progress, generate, reset } = useVideoGeneration();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [audienceId, setAudienceId] = useState('');
  const [toolId, setToolId] = useState('');
  const [productId, setProductId] = useState('');
  const [voiceType, setVoiceType] = useState(VOICE_TYPE_OPTIONS[0].voice_type);
  const [structuredScript, setStructuredScript] = useState<StructuredScript | null>(null);
  const [generatingScript, setGeneratingScript] = useState(false);

  const selectedAudience = useMemo(() => VIDEO_AUDIENCES.find(a => a.id === audienceId), [audienceId]);
  const selectedTool = useMemo(() => selectedAudience?.tools.find(t => t.id === toolId), [selectedAudience, toolId]);
  const selectedProduct = useMemo(() => selectedAudience?.products.find(p => p.id === productId), [selectedAudience, productId]);

  const isGenerating = !['idle', 'done', 'error'].includes(status);

  const fullScript = useMemo(() => {
    if (!structuredScript) return '';
    return structuredScript.script || structuredScript.segments.map(s => s.text).join('\n');
  }, [structuredScript]);

  // Photo upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('请先登录'); return; }

      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('video-assets').upload(path, file, {
        contentType: file.type,
      });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('video-assets').getPublicUrl(path);
      setImageUrl(data.publicUrl);
      toast.success('照片上传成功');
    } catch (err: any) {
      toast.error(`上传失败: ${err.message}`);
      setImagePreview('');
    } finally {
      setUploading(false);
    }
  };

  // AI script generation via dedicated edge function
  const handleGenerateScript = async () => {
    if (!selectedAudience || !selectedTool || !selectedProduct) {
      toast.error('请先选择人群、场景和产品');
      return;
    }
    setGeneratingScript(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('video-script-ai', {
        body: {
          audience: { id: selectedAudience.id, label: selectedAudience.label, emoji: selectedAudience.emoji },
          tool: { id: selectedTool.id, label: selectedTool.label, description: selectedTool.description },
          product: { id: selectedProduct.id, label: selectedProduct.label, description: selectedProduct.description },
        },
      });

      if (fnErr) throw new Error(fnErr.message);
      if (data?.error) throw new Error(data.error);

      if (!data?.segments || !Array.isArray(data.segments)) {
        throw new Error('AI返回数据格式异常');
      }

      setStructuredScript(data as StructuredScript);
      toast.success('剧本生成成功！可编辑各段文案');
    } catch (err: any) {
      toast.error(`剧本生成失败: ${err.message}`);
    } finally {
      setGeneratingScript(false);
    }
  };

  // Update a single segment text
  const updateSegmentText = (index: number, text: string) => {
    if (!structuredScript) return;
    const newSegments = [...structuredScript.segments];
    newSegments[index] = { ...newSegments[index], text };
    setStructuredScript({
      ...structuredScript,
      segments: newSegments,
      script: newSegments.map(s => s.text).join(''),
    });
  };

  const handleGenerate = () => {
    if (!fullScript.trim() || !imageUrl.trim()) return;
    generate({
      script: fullScript.trim(),
      imageUrl: imageUrl.trim(),
      voiceType,
      structuredScript: structuredScript || undefined,
    });
  };

  const handleExportConfig = () => {
    if (!result.compositionProps) return;
    const json = JSON.stringify(result.compositionProps, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remotion-config-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Remotion 配置已导出');
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

        {/* 1. Photo Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="w-4 h-4" /> 上传人像照片
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isGenerating}
            />
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="人像预览"
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-2 right-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isGenerating || uploading}
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : '重新选择'}
                </Button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isGenerating || uploading}
                className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">点击上传或拍照</span>
                    <span className="text-xs text-muted-foreground">推荐正面半身照，光线均匀</span>
                  </>
                )}
              </button>
            )}
          </CardContent>
        </Card>

        {/* 2. Audience / Tool / Product selectors */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              🎯 剧本配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>目标人群</Label>
              <Select
                value={audienceId}
                onValueChange={v => { setAudienceId(v); setToolId(''); setProductId(''); setStructuredScript(null); }}
                disabled={isGenerating}
              >
                <SelectTrigger><SelectValue placeholder="选择目标人群" /></SelectTrigger>
                <SelectContent>
                  {VIDEO_AUDIENCES.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.emoji} {a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAudience && (
              <div className="space-y-2">
                <Label>工具场景</Label>
                <Select value={toolId} onValueChange={setToolId} disabled={isGenerating}>
                  <SelectTrigger><SelectValue placeholder="选择工具场景" /></SelectTrigger>
                  <SelectContent>
                    {selectedAudience.tools.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.label} — {t.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAudience && (
              <div className="space-y-2">
                <Label>转化产品</Label>
                <Select value={productId} onValueChange={setProductId} disabled={isGenerating}>
                  <SelectTrigger><SelectValue placeholder="选择转化产品" /></SelectTrigger>
                  <SelectContent>
                    {selectedAudience.products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.label} — {p.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>音色选择</Label>
              <Select value={voiceType} onValueChange={setVoiceType} disabled={isGenerating}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOICE_TYPE_OPTIONS.map(v => (
                    <SelectItem key={v.id} value={v.voice_type}>{v.emoji} {v.name} — {v.description}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerateScript}
              disabled={!selectedAudience || !selectedTool || !selectedProduct || generatingScript || isGenerating}
            >
              {generatingScript ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> AI生成中...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> ✨ AI生成剧本</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 3. Structured Script Editor — 5 segments */}
        {structuredScript && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📝 五段剧本编辑</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {structuredScript.segments.map((seg, i) => {
                const meta = SEGMENT_META[seg.type] || { label: seg.type, emoji: '📌', color: 'border-l-gray-400' };
                return (
                  <div
                    key={i}
                    className={`border-l-4 ${meta.color} pl-3 py-2 space-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{meta.emoji} {meta.label}</span>
                      <span className="text-xs text-muted-foreground">{seg.startSec}s - {seg.endSec}s</span>
                    </div>
                    <Textarea
                      value={seg.text}
                      onChange={e => updateSegmentText(i, e.target.value)}
                      disabled={isGenerating}
                      className="min-h-[60px] text-sm"
                    />
                    {seg.highlight && (
                      <span className="text-xs text-orange-500">关键词高亮: {seg.highlight}</span>
                    )}
                  </div>
                );
              })}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  总字数：{fullScript.length} · 建议150-250字（约30秒视频）
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  结尾提问: {structuredScript.closingQuestion} · CTA: {structuredScript.closingCta}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Generate button */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || !fullScript.trim() || !imageUrl.trim()}
          >
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</>
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

        {/* 5. Progress */}
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

        {/* 6. Result */}
        {status === 'done' && result.videoUrl && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">🎬 生成结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <video src={result.videoUrl} controls className="w-full rounded-lg" playsInline />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={result.videoUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" /> 下载视频
                  </a>
                </Button>
                {result.compositionProps && (
                  <Button variant="outline" className="flex-1" onClick={handleExportConfig}>
                    <FileJson className="w-4 h-4 mr-2" /> 导出混剪配置
                  </Button>
                )}
              </div>
              {result.compositionProps && (
                <p className="text-xs text-muted-foreground text-center">
                  导出 Remotion 配置 JSON 后，可用本地渲染脚本生成数字人+B-Roll混剪视频
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoGenerator;
