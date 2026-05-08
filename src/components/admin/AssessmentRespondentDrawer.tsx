import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Lock, Save, X, Copy, FileDown } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { RespondentRow } from "@/hooks/useAdminAssessmentInsights";
import { useUpsertAdminUserNote } from "@/hooks/useAdminUserNote";
import { formatClaimCode } from "@/utils/claimCodeUtils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: (RespondentRow & {
    isPaid?: boolean;
    blockedDimension?: string | null;
    battery?: number;
    energyIndex?: number;
    anxietyIndex?: number;
    stressIndex?: number;
  }) | null;
  template: { questions: any; dimensions: any; maxScore: number; assessmentKey?: string | null } | null;
}

export function AssessmentRespondentDrawer({ open, onOpenChange, row, template }: Props) {
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const upsert = useUpsertAdminUserNote();

  const isEmotionHealth = template?.assessmentKey === "emotion_health";

  useEffect(() => {
    if (row) {
      setNote(row.adminNote || "");
      setTags(row.adminTags || []);
      setTagInput("");
    }
  }, [row?.userId]);

  if (!row) return null;

  const questions: any[] = Array.isArray(template?.questions) ? template!.questions : [];
  const answers = row.answers || {};

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags([...tags, t]);
    setTagInput("");
  };

  const handleSave = () => {
    upsert.mutate({ userId: row.userId, note: note.trim(), tags });
  };

  const dirty = note !== (row.adminNote || "") || JSON.stringify(tags) !== JSON.stringify(row.adminTags || []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-hidden p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={row.avatarUrl || undefined} />
              <AvatarFallback>{(row.displayName || "U").slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base truncate">{row.displayName || "未命名用户"}</SheetTitle>
              <SheetDescription className="text-xs">
                {row.phone ? `${row.phoneCountryCode || "+86"} ${row.phone}` : "未绑定手机号"} ·{" "}
                {format(new Date(row.createdAt), "yyyy-MM-dd HH:mm")}
              </SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="default">{row.primaryPattern || "未分类"}</Badge>
            <Badge variant="outline">总分 {row.totalScore}</Badge>
            {(template?.assessmentKey === "male_midlife_vitality" || isEmotionHealth) && row.claimCode && (
              <Badge
                variant="secondary"
                className="gap-1 font-mono cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  navigator.clipboard.writeText(row.claimCode!);
                  toast.success(`领取码已复制：${row.claimCode}`);
                }}
              >
                领取码 {formatClaimCode(row.claimCode)}
                <Copy className="w-3 h-3" />
              </Badge>
            )}
          </div>
          {template?.assessmentKey === "male_midlife_vitality" && row.claimCode && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => {
                  const script = `您好，您的领取码是 ${row.claimCode}。\n附件为您本次「男人有劲状态测评」的完整 PDF 报告，请查收 ✅\n如有疑问随时回复。`;
                  navigator.clipboard.writeText(script);
                  toast.success("话术已复制");
                }}
              >
                <Copy className="w-3.5 h-3.5" /> 复制发送话术
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-8 gap-1.5"
                onClick={() => {
                  window.open(`/admin/handbook/male/${row.resultId}`, "_blank");
                  toast.message("已打开 7 天伴随手册导出页（含完整测评雷达图与 AI 解读），生成约 15-25 秒");
                }}
              >
                <FileDown className="w-3.5 h-3.5" /> 下载 7 天伴随手册 PDF
              </Button>
            </div>
          )}
          {isEmotionHealth && row.claimCode && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => {
                  const script = `亲爱的${row.displayName || ""}，你的领取码是 ${row.claimCode}。\n附件为你本次「情绪健康测评」完整 PDF 报告，请查收 🌸\n24 小时内 助教 将与你 1v1 解读，记得回复哦~`;
                  navigator.clipboard.writeText(script);
                  toast.success("话术已复制");
                }}
              >
                <Copy className="w-3.5 h-3.5" /> 复制发送话术
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5"
                onClick={() => {
                  const params = new URLSearchParams({
                    recordId: row.resultId,
                    autoSave: "pdf",
                    adminPdf: "1",
                    subjectUserId: row.userId,
                  });
                  if (row.displayName) params.set("subjectName", row.displayName);
                  if (row.avatarUrl) params.set("subjectAvatar", row.avatarUrl);
                  const url = `${window.location.origin}/emotion-health?${params.toString()}`;
                  window.open(url, "_blank");
                  toast.message(`已打开 ${row.displayName || "用户"} 的报告并自动下载 PDF`);
                }}
              >
                <FileDown className="w-3.5 h-3.5" /> 下载 PDF 报告
              </Button>
              <Button
                size="sm"
                variant="default"
                className="h-8 gap-1.5"
                onClick={() => {
                  window.open(`/admin/handbook/emotion/${row.resultId}`, "_blank");
                  toast.message("已打开 7 天伴随手册导出页，生成约需 10–20 秒");
                }}
              >
                <FileDown className="w-3.5 h-3.5" /> 下载 7 天伴随手册 PDF
              </Button>
            </div>
          )}
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <section className="rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  管理员备注
                  <span className="text-xs font-normal text-muted-foreground">（仅后台可见）</span>
                </h4>
                {row.adminNoteUpdatedAt && (
                  <span className="text-[11px] text-muted-foreground">
                    更新于 {format(new Date(row.adminNoteUpdatedAt), "MM-dd HH:mm")}
                  </span>
                )}
              </div>
              <Textarea
                placeholder="例如：施强渠道用户、已加企微、5月8日已发链接版测评……"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="bg-background resize-none text-sm"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      className="hover:bg-muted-foreground/20 rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="加标签后回车"
                  className="h-7 w-32 text-xs bg-background"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!dirty || upsert.isPending}
                  className="gap-1.5 h-8"
                >
                  <Save className="w-3.5 h-3.5" />
                  {upsert.isPending ? "保存中..." : "保存备注"}
                </Button>
              </div>
            </section>

            {row.dimensionScores && Object.keys(row.dimensionScores).length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2">各维度分数</h4>
                <div className="space-y-2">
                  {Object.entries(row.dimensionScores).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium">{Number(v)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {row.aiInsight && (
              <section>
                <h4 className="text-sm font-semibold mb-2">AI 洞察</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-lg bg-muted/40 p-3 leading-relaxed">
                  {row.aiInsight}
                </div>
              </section>
            )}

            {questions.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold mb-2">完整答题</h4>
                <ol className="space-y-3">
                  {questions.map((q: any, idx: number) => {
                    const ans = answers[q.id];
                    const opt = Array.isArray(q.options)
                      ? q.options.find((o: any) => o.value === ans || o.id === ans)
                      : null;
                    return (
                      <li key={q.id || idx} className="text-sm">
                        <p className="text-muted-foreground mb-1">
                          <span className="text-foreground font-medium">Q{idx + 1}.</span>{" "}
                          {q.text || q.title || q.question}
                        </p>
                        <p className="pl-6 text-foreground">
                          → {opt ? opt.text || opt.label : ans !== undefined ? String(ans) : "未作答"}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
