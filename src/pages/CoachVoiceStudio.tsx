import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Mic, Square, Loader2, Play, Pause, Download, Sparkles, ChevronDown } from "lucide-react";
import {
  COACH_VOICE_TEMPLATES,
  getTemplatesByGender,
  HOOK_TYPE_LABELS,
  type CoachVoiceTemplate,
  type HookType,
} from "@/config/coachVoiceTemplates";

type VoiceClone = {
  id: string; coach_name: string; gender: 'male'|'female';
  source: 'cloned'|'preset'; display_order: number; description?: string | null;
  sample_audio_url?: string | null;
};

type Generation = {
  id: string; coach_name: string; template_key: string; hook_type: HookType;
  text_content: string; audio_url: string | null; created_at: string; created_by_label?: string | null;
};

const CoachVoiceStudio = () => {
  const [params] = useSearchParams();
  const accessKey = params.get("key") || "";

  const [voices, setVoices] = useState<VoiceClone[]>([]);
  const [history, setHistory] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  const loadAll = useCallback(async () => {
    if (!accessKey) return;
    setLoading(true);
    try {
      const [lib, hist] = await Promise.all([
        supabase.functions.invoke("coach-voice-library", { body: { access_key: accessKey } }),
        supabase.functions.invoke("coach-voice-history", { body: { access_key: accessKey, limit: 50 } }),
      ]);
      if (lib.error || (lib.data as any)?.error) {
        toast({ title: "访问密钥无效或加载失败", description: (lib.data as any)?.error || lib.error?.message, variant: "destructive" });
        setAuthed(false);
        return;
      }
      setAuthed(true);
      setVoices((lib.data as any)?.voices || []);
      setHistory((hist.data as any)?.items || []);
    } finally {
      setLoading(false);
    }
  }, [accessKey]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (!accessKey) {
    return <CenterMessage title="缺少访问密钥" subtitle="请通过完整链接访问（带 ?key=xxx 参数）" />;
  }
  if (!authed && !loading) {
    return <CenterMessage title="访问密钥无效" subtitle="请联系管理员获取正确链接" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">🎙️ 教练语音工坊</h1>
          <p className="text-sm text-muted-foreground mt-1">克隆教练真人声音 + 一键生成测评跟进语音</p>
        </header>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="generate">🎵 生成跟进语音</TabsTrigger>
            <TabsTrigger value="clone">🎙️ 克隆教练声音</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <GenerateTab voices={voices} accessKey={accessKey} onGenerated={loadAll} history={history} />
          </TabsContent>

          <TabsContent value="clone">
            <CloneTab accessKey={accessKey} onCloned={loadAll} voices={voices} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const CenterMessage = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background p-6">
    <Card className="p-8 max-w-md text-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </Card>
  </div>
);

// ============================ Generate Tab ============================
const GenerateTab = ({ voices, accessKey, onGenerated, history }: {
  voices: VoiceClone[]; accessKey: string; onGenerated: () => void; history: Generation[];
}) => {
  const [selectedVoice, setSelectedVoice] = useState<VoiceClone | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<CoachVoiceTemplate | null>(null);
  const [hookType, setHookType] = useState<HookType>("direct399");
  const [nickname, setNickname] = useState("");
  const [coachName, setCoachName] = useState("");
  const [text, setText] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [createdBy, setCreatedBy] = useState("");

  // 当选择音色后，默认 coachName=音色名
  useEffect(() => {
    if (selectedVoice && !coachName) setCoachName(selectedVoice.coach_name);
  }, [selectedVoice]); // eslint-disable-line

  // 选模板/钩子/变量变化时重新拼接文本
  useEffect(() => {
    if (selectedTemplate) {
      setText(selectedTemplate.buildScript({ nickname, coachName: coachName || selectedVoice?.coach_name, hookType }));
    }
  }, [selectedTemplate, hookType, nickname, coachName, selectedVoice]);

  const gender = selectedVoice?.gender;
  const templates = gender ? getTemplatesByGender(gender) : [];

  const handleGenerate = async () => {
    if (!selectedVoice || !selectedTemplate || !text.trim()) {
      toast({ title: "请完成选择", description: "音色 / 模板 / 文本都不能空", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setLastAudioUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("coach-voice-generate", {
        body: {
          access_key: accessKey,
          voice_clone_id: selectedVoice.id,
          template_key: selectedTemplate.key,
          hook_type: hookType,
          text_content: text,
          created_by_label: createdBy || null,
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      const url = (data as any).audio_base64
        ? `data:audio/mpeg;base64,${(data as any).audio_base64}`
        : (data as any).audio_url;
      setLastAudioUrl(url);
      toast({ title: "生成成功 🎉", description: "可试听或下载" });
      onGenerated();
    } catch (e: any) {
      toast({ title: "生成失败", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: 选音色 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">① 选音色（点 ▶︎ 试听）</h3>
        {voices.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无音色，请先去「克隆教练声音」上传</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {voices.map(v => (
              <VoiceCard
                key={v.id}
                voice={v}
                selected={selectedVoice?.id === v.id}
                onSelect={() => { setSelectedVoice(v); setSelectedTemplate(null); setCoachName(""); }}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Step 2: 选模板 */}
      {selectedVoice && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">② 选模板（已按音色性别过滤，可展开预览话术）</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map(t => (
              <div
                key={t.key}
                className={`rounded-lg border transition ${selectedTemplate?.key === t.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <button
                  onClick={() => setSelectedTemplate(t)}
                  className="w-full p-3 text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{t.emoji}</span>
                    <span className="font-medium">{t.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.tagline}</p>
                  <p className="text-xs text-primary/70 mt-1">对应：{t.sourceAssessmentLabel}</p>
                </button>
                <TemplatePreview template={t} coachName={selectedVoice.coach_name} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Step 3: 选钩子 */}
      {selectedTemplate && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">③ 选转化钩子</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(HOOK_TYPE_LABELS) as HookType[]).map(h => {
              const info = HOOK_TYPE_LABELS[h];
              return (
                <button
                  key={h}
                  onClick={() => setHookType(h)}
                  className={`p-3 rounded-lg border text-left transition ${hookType === h ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-medium mb-1">{info.emoji} {info.label}</div>
                  <p className="text-xs text-muted-foreground">{info.desc}</p>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Step 4: 编辑 + 生成 */}
      {selectedTemplate && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">④ 编辑文本 + 生成</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input placeholder="用户昵称（可选）" value={nickname} onChange={e => setNickname(e.target.value)} />
            <Input placeholder="教练名字（默认音色名）" value={coachName} onChange={e => setCoachName(e.target.value)} />
            <Input placeholder="生成人标签（可选，如 jql）" value={createdBy} onChange={e => setCreatedBy(e.target.value)} />
          </div>
          <Textarea value={text} onChange={e => setText(e.target.value)} rows={10} className="font-mono text-sm" maxLength={2000} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{text.length} / 2000 字</span>
            <span>预计时长 ~{Math.ceil(text.length / 4)} 秒</span>
          </div>
          <Button onClick={handleGenerate} disabled={generating} className="w-full" size="lg">
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中（约 10-20s）...</> : <><Sparkles className="w-4 h-4 mr-2" />生成语音</>}
          </Button>
          {lastAudioUrl && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
              <audio src={lastAudioUrl} controls className="w-full" />
              <a href={lastAudioUrl} download={`coach_voice_${Date.now()}.mp3`} className="inline-flex items-center text-sm text-primary hover:underline">
                <Download className="w-3.5 h-3.5 mr-1" />下载 mp3
              </a>
            </div>
          )}
        </Card>
      )}

      {/* History */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">📜 最近生成（{history.length}）</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有生成记录</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map(g => (
              <div key={g.id} className="border rounded p-2 text-sm">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-xs">{g.coach_name}</Badge>
                  <Badge variant="secondary" className="text-xs">{g.template_key}</Badge>
                  <Badge className="text-xs">{HOOK_TYPE_LABELS[g.hook_type]?.emoji} {HOOK_TYPE_LABELS[g.hook_type]?.label}</Badge>
                  {g.created_by_label && <span className="text-xs text-muted-foreground">by {g.created_by_label}</span>}
                  <span className="text-xs text-muted-foreground ml-auto">{new Date(g.created_at).toLocaleString("zh-CN")}</span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{g.text_content}</p>
                {g.audio_url && <audio src={g.audio_url} controls className="w-full mt-1 h-8" />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

// ============================ Voice Card (with sample play) ============================
const sharedAudio: { el: HTMLAudioElement | null; voiceId: string | null; setters: Set<(id: string | null) => void> } = {
  el: null, voiceId: null, setters: new Set(),
};
const broadcastPlaying = (id: string | null) => {
  sharedAudio.voiceId = id;
  sharedAudio.setters.forEach(fn => fn(id));
};

const VoiceCard = ({ voice, selected, onSelect }: { voice: VoiceClone; selected: boolean; onSelect: () => void }) => {
  const [playingId, setPlayingId] = useState<string | null>(sharedAudio.voiceId);
  useEffect(() => {
    sharedAudio.setters.add(setPlayingId);
    return () => { sharedAudio.setters.delete(setPlayingId); };
  }, []);
  const isPlaying = playingId === voice.id;

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!voice.sample_audio_url) {
      toast({ title: "该音色暂无试听样本", variant: "destructive" });
      return;
    }
    if (isPlaying) {
      sharedAudio.el?.pause();
      broadcastPlaying(null);
      return;
    }
    sharedAudio.el?.pause();
    const audio = new Audio(voice.sample_audio_url);
    sharedAudio.el = audio;
    audio.onended = () => broadcastPlaying(null);
    audio.onerror = () => { toast({ title: "试听加载失败", variant: "destructive" }); broadcastPlaying(null); };
    audio.play().then(() => broadcastPlaying(voice.id)).catch(err => {
      toast({ title: "播放失败", description: err.message, variant: "destructive" });
    });
  };

  return (
    <button
      onClick={onSelect}
      className={`p-3 rounded-lg border text-left transition relative ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-lg">{voice.gender === "male" ? "👨" : "👩"}</span>
          <span className="font-medium text-sm truncate">{voice.coach_name}</span>
        </div>
        <span
          onClick={togglePlay}
          role="button"
          aria-label={isPlaying ? "暂停试听" : "试听"}
          className="shrink-0 w-7 h-7 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
        </span>
      </div>
      <Badge variant={voice.source === "cloned" ? "default" : "secondary"} className="text-xs">
        {voice.source === "cloned" ? "🎤 真人" : "🎵 素材"}
      </Badge>
      {voice.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{voice.description}</p>}
    </button>
  );
};

// ============================ Template Preview (collapsible) ============================
const TemplatePreview = ({ template, coachName }: { template: CoachVoiceTemplate; coachName: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border/50">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition"
      >
        <span>{open ? "收起话术预览" : "展开预览两种钩子话术"}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          {(Object.keys(HOOK_TYPE_LABELS) as HookType[]).map(h => (
            <div key={h} className="bg-muted/40 rounded p-2 text-xs">
              <div className="font-medium mb-1">{HOOK_TYPE_LABELS[h].emoji} {HOOK_TYPE_LABELS[h].label}</div>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {template.buildScript({ coachName: coachName || template.label, hookType: h })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================ Clone Tab ============================
const CloneTab = ({ accessKey, onCloned, voices }: { accessKey: string; onCloned: () => void; voices: VoiceClone[] }) => {
  const [coachName, setCoachName] = useState("");
  const [gender, setGender] = useState<"male"|"female">("female");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch (e: any) {
      toast({ title: "无法访问麦克风", description: e.message, variant: "destructive" });
    }
  };
  const stopRec = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  const handleFile = (f: File) => {
    setAudioBlob(f);
    setAudioUrl(URL.createObjectURL(f));
  };

  const handleClone = async () => {
    if (!coachName.trim() || !audioBlob) {
      toast({ title: "需要教练名 + 音频样本", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const buf = await audioBlob.arrayBuffer();
      // base64 编码（小心 stack overflow）
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
      }
      const b64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("coach-voice-clone", {
        body: {
          access_key: accessKey,
          coach_name: coachName.trim(),
          gender,
          audio_base64: b64,
          audio_mime: audioBlob.type || "audio/webm",
        },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast({ title: "克隆成功 🎉", description: `${coachName} 已加入音色库` });
      setCoachName(""); setAudioBlob(null); setAudioUrl(null);
      onCloned();
    } catch (e: any) {
      toast({ title: "克隆失败", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const clonedVoices = voices.filter(v => v.source === "cloned");

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">🎙️ 上传或录制 1-2 分钟样本</h3>
          <p className="text-xs text-muted-foreground">建议 wav / mp3 / webm，安静环境，自然语速朗读，覆盖喜怒平多种语气</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input placeholder="教练名（如：戴西）" value={coachName} onChange={e => setCoachName(e.target.value)} />
          <select className="border rounded px-3 h-10 bg-background" value={gender} onChange={e => setGender(e.target.value as any)}>
            <option value="female">女</option>
            <option value="male">男</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!recording ? (
            <Button onClick={startRec} variant="outline"><Mic className="w-4 h-4 mr-2" />开始录音</Button>
          ) : (
            <Button onClick={stopRec} variant="destructive"><Square className="w-4 h-4 mr-2" />停止录音</Button>
          )}
          <Button asChild variant="outline">
            <label className="cursor-pointer">
              📁 上传文件
              <input type="file" accept="audio/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
          </Button>
        </div>
        {audioUrl && (
          <div className="border rounded-lg p-3 bg-muted/30">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}
        <Button onClick={handleClone} disabled={uploading || !audioBlob || !coachName} className="w-full" size="lg">
          {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />克隆中（约 10-30s）...</> : "🚀 创建克隆音色"}
        </Button>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">已克隆的真人音色（{clonedVoices.length}）</h3>
        {clonedVoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">还没有教练真人音色</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {clonedVoices.map(v => (
              <div key={v.id} className="border rounded p-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <span>{v.gender === "male" ? "👨" : "👩"}</span>
                  <span className="font-medium">{v.coach_name}</span>
                </div>
                <Badge className="text-xs mt-1">🎤 真人</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CoachVoiceStudio;
