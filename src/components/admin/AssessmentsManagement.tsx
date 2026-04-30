import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageLayout } from "./shared/AdminPageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, ExternalLink, Pencil, Users, Link, Check, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssessmentEditor } from "../partner/AssessmentEditor";
import type { PartnerAssessmentTemplate } from "@/hooks/usePartnerAssessments";

function useAllAssessments() {
  return useQuery({
    queryKey: ["admin-all-assessments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_assessment_templates" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as (PartnerAssessmentTemplate & { created_by_partner_id: string })[];
    },
  });
}

function usePartnerNames(partnerIds: string[]) {
  return useQuery({
    queryKey: ["partner-names", partnerIds],
    queryFn: async () => {
      if (!partnerIds.length) return {};
      const { data } = await supabase
        .from("partners")
        .select("id, partner_name")
        .in("id", partnerIds);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { map[p.id] = p.partner_name; });
      return map;
    },
    enabled: partnerIds.length > 0,
  });
}

function useToggleAssessment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("partner_assessment_templates" as any)
        .update({ is_active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-assessments"] });
      toast.success("状态已更新");
    },
  });
}

export default function AssessmentsManagement() {
  const { data: assessments = [], isLoading } = useAllAssessments();
  const partnerIds = [...new Set(assessments.map(a => a.created_by_partner_id).filter(Boolean))];
  const { data: partnerNames = {} } = usePartnerNames(partnerIds);
  const toggleAssessment = useToggleAssessment();
  const [editing, setEditing] = useState<PartnerAssessmentTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getExternalUrl = (key: string) => `https://wechat.eugenewe.net/assessment/${key}`;

  const handleCopy = (assessment: PartnerAssessmentTemplate & { created_by_partner_id: string }) => {
    navigator.clipboard.writeText(getExternalUrl(assessment.assessment_key)).then(() => {
      setCopiedId(assessment.id);
      toast.success("外部链接已复制");
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (editing) {
    return <AssessmentEditor assessment={editing} onBack={() => setEditing(null)} />;
  }

  return (
    <AdminPageLayout title="测评管理" description="管理所有合伙人创建的测评模板，确保使用统一引擎">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : assessments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <h4 className="font-medium text-muted-foreground mb-2">暂无测评</h4>
            <p className="text-sm text-muted-foreground">合伙人可以在「内容建设 → 测评」中创建</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{assessment.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className="font-semibold truncate">{assessment.title}</h4>
                      <Badge variant={assessment.is_active ? "default" : "secondary"} className="text-xs">
                        {assessment.is_active ? "已上线" : "已停用"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        统一引擎
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {assessment.description || assessment.subtitle}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{assessment.question_count} 题</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {partnerNames[assessment.created_by_partner_id] || "未知合伙人"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <code className="text-[11px] bg-muted/60 px-2 py-0.5 rounded text-muted-foreground truncate max-w-[280px]">
                        {getExternalUrl(assessment.assessment_key)}
                      </code>
                      <button
                        onClick={() => handleCopy(assessment)}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors shrink-0"
                      >
                        {copiedId === assessment.id ? (
                          <><Check className="w-3 h-3" /> 已复制</>
                        ) : (
                          <><Link className="w-3 h-3" /> 复制</>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(getExternalUrl(assessment.assessment_key), '_blank')}
                      title="在外部打开"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => navigate(`/admin/assessments/${assessment.id}/insights`)}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      数据洞察
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => setEditing(assessment)}
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
    </AdminPageLayout>
  );
}
