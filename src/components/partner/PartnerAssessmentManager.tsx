import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Loader2, ClipboardList, Pencil, Link, Check } from "lucide-react";
import { toast } from "sonner";
import { usePartnerAssessments, useTogglePartnerAssessment } from "@/hooks/usePartnerAssessments";
import { AIAssessmentCreator } from "./AIAssessmentCreator";
import { AssessmentEditor } from "./AssessmentEditor";
import type { PartnerAssessmentTemplate } from "@/hooks/usePartnerAssessments";

interface PartnerAssessmentManagerProps {
  partnerId: string;
  partnerCode: string;
}

const MAX_ASSESSMENTS = 3;

export function PartnerAssessmentManager({ partnerId, partnerCode }: PartnerAssessmentManagerProps) {
  const { data: assessments = [], isLoading } = usePartnerAssessments(partnerId);
  const toggleAssessment = useTogglePartnerAssessment();
  const [showCreator, setShowCreator] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<PartnerAssessmentTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getAssessmentUrl = (assessment: PartnerAssessmentTemplate) => {
    const origin = window.location.origin;
    return `${origin}/assessment/${assessment.assessment_key}`;
  };

  const handleCopyLink = (assessment: PartnerAssessmentTemplate) => {
    const url = getAssessmentUrl(assessment);
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(assessment.id);
      toast.success("链接已复制");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const canCreate = assessments.length < MAX_ASSESSMENTS;

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (editingAssessment) {
    return (
      <AssessmentEditor
        assessment={editingAssessment}
        onBack={() => setEditingAssessment(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-primary" />
            我的测评
          </h3>
          <p className="text-sm text-muted-foreground">
            已创建 {assessments.length}/{MAX_ASSESSMENTS} 个测评
          </p>
        </div>
        <Button
          onClick={() => setShowCreator(true)}
          disabled={!canCreate}
          size="sm"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          AI 创建测评
        </Button>
      </div>

      {assessments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h4 className="font-medium text-muted-foreground mb-2">还没有创建测评</h4>
            <p className="text-sm text-muted-foreground mb-4">
              使用 AI 快速创建专属测评，为你的用户提供专业评估
            </p>
            <Button onClick={() => setShowCreator(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              立即创建
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{assessment.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold truncate">{assessment.title}</h4>
                      <Badge variant={assessment.is_active ? "default" : "secondary"} className="shrink-0 text-xs">
                        {assessment.is_active ? "已上线" : "已停用"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {assessment.description || assessment.subtitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {assessment.question_count} 题
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button
                        onClick={() => handleCopyLink(assessment)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        {copiedId === assessment.id ? (
                          <><Check className="w-3 h-3" /> 已复制</>
                        ) : (
                          <><Link className="w-3 h-3" /> 复制链接</>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setEditingAssessment(assessment)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      编辑
                    </Button>
                    <Switch
                      checked={assessment.is_active}
                      onCheckedChange={(checked) =>
                        toggleAssessment.mutate({ id: assessment.id, is_active: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!canCreate && (
        <p className="text-xs text-muted-foreground text-center">
          已达到最大创建数量（{MAX_ASSESSMENTS}个），如需更多请联系管理员
        </p>
      )}

      <AIAssessmentCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        partnerId={partnerId}
        partnerCode={partnerCode}
      />
    </div>
  );
}
