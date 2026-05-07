import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Lock, Save, X } from "lucide-react";
import { format } from "date-fns";
import type { RespondentRow } from "@/hooks/useAdminAssessmentInsights";
import { useUpsertAdminUserNote } from "@/hooks/useAdminUserNote";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  row: RespondentRow | null;
  template: { questions: any; dimensions: any; maxScore: number } | null;
}

export function AssessmentRespondentDrawer({ open, onOpenChange, row, template }: Props) {
  if (!row) return null;

  const questions: any[] = Array.isArray(template?.questions) ? template!.questions : [];
  const answers = row.answers || {};

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
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
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
