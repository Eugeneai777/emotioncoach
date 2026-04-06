import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useVideoGeneration, VideoGenStatus } from '@/hooks/useVideoGeneration';
import { VOICE_TYPE_OPTIONS } from '@/config/voiceTypeConfig';
import { VIDEO_AUDIENCES, VIDEO_SCRIPT_SYSTEM_PROMPT, buildScriptPrompt } from '@/config/videoScriptConfig';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft, Video, CheckCircle2, Loader2, AlertCircle,
  Download, RotateCcw, Upload, Camera, Sparkles, ImageIcon,
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
  const [script, setScript] = useState('');
  const [generatingScript, setGeneratingScript] = useState(false);

  const selectedAudience = useMemo(() => VIDEO_AUDIENCES.find(a => a.id === audienceId), [audienceId]);
  const selectedTool = useMemo(() => selectedAudience?.tools.find(t => t.id === toolId), [selectedAudience, toolId]);
  const selectedProduct = useMemo(() => selectedAudience?.products.find(p => p.id === productId), [selectedAudience, productId]);

  const isGenerating = !['idle', 'done', 'error'].includes(status);

  // Photo upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
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

  // AI script generation
  const handleGenerateScript = async () => {
    if (!selectedAudience || !selectedTool || !selectedProduct) {
      toast.error('请先选择人群、场景和产品');
      return;
    }
    setGeneratingScript(true);
    try {
      const userPrompt = buildScriptPrompt(selectedAudience, selectedTool, selectedProduct);

      const { data, error: chatErr } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: 'system', content: VIDEO_SCRIPT_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
        },
      });

      if (chatErr) throw new Error(chatErr.message);

      const text = data?.choices?.[0]?.message?.content
        || data?.content
        || data?.response
        || data?.text
        || '';

      if (!text) throw new Error('AI未返回文案内容');
      setScript(text.trim());
      toast.success('剧本生成成功，可自由编辑');
    } catch (err: any) {
      toast.error(`剧本生成失败: ${err.message}`);
    } finally {
      setGeneratingScript(false);
    }
  };

  const handleGenerate = () => {
    if (!script.trim() || !imageUrl.trim()) return;
    generate({ script: script.trim(), imageUrl: imageUrl.trim(), voiceType });
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
            {/* Audience */}
            <div className="space-y-2">
              <Label>目标人群</Label>
              <Select
                value={audienceId}
                onValueChange={v => { setAudienceId(v); setToolId(''); setProductId(''); }}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择目标人群" />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_AUDIENCES.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.emoji} {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tool */}
            {selectedAudience && (
              <div className="space-y-2">
                <Label>工具场景</Label>
                <Select value={toolId} onValueChange={setToolId} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择工具场景" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAudience.tools.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label} — {t.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Product */}
            {selectedAudience && (
              <div className="space-y-2">
                <Label>转化产品</Label>
                <Select value={productId} onValueChange={setProductId} disabled={isGenerating}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择转化产品" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedAudience.products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label} — {p.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Voice */}
            <div className="space-y-2">
              <Label>音色选择</Label>
              <Select value={voiceType} onValueChange={setVoiceType} disabled={isGenerating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_TYPE_OPTIONS.map(v => (
                    <SelectItem key={v.id} value={v.voice_type}>
                      {v.emoji} {v.name} — {v.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Generate Script button */}
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerateScript}
              disabled={!selectedAudience || !selectedTool || !selectedProduct || generatingScript || isGenerating}
            >
              {generatingScript ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ✨ AI生成剧本
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 3. Script editor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📝 视频文案</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="选择人群和场景后，点击「AI生成剧本」自动生成，或手动输入文案..."
              value={script}
              onChange={e => setScript(e.target.value)}
              disabled={isGenerating}
              className="min-h-[160px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              字数：{script.length} · 建议150-250字（约30秒视频）
            </p>
          </CardContent>
        </Card>

        {/* 4. Generate button */}
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
