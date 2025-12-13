import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Check, X, Loader2, ExternalLink, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Certification {
  id: string;
  cert_name: string;
  cert_type: string;
  cert_number?: string;
  issuing_authority?: string;
  issue_date?: string;
  expiry_date?: string;
  image_url?: string;
  verification_status: string;
  admin_note?: string;
}

interface CertificationReviewProps {
  coachId: string;
  certifications: Certification[];
}

export function CertificationReview({ coachId, certifications }: CertificationReviewProps) {
  const queryClient = useQueryClient();
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const updateCertMutation = useMutation({
    mutationFn: async ({ 
      certId, 
      status, 
      note 
    }: { 
      certId: string; 
      status: "verified" | "rejected";
      note?: string;
    }) => {
      const { error } = await supabase
        .from("coach_certifications")
        .update({ 
          verification_status: status,
          admin_note: note,
          verified_at: new Date().toISOString()
        })
        .eq("id", certId);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["human-coach-detail", coachId] });
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      toast.success(status === "verified" ? "证书已验证" : "证书已标记为无效");
      setSelectedCert(null);
      setAdminNote("");
    },
    onError: (error) => {
      toast.error("操作失败: " + error.message);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500">已验证</Badge>;
      case "rejected":
        return <Badge variant="destructive">无效</Badge>;
      default:
        return <Badge variant="secondary">待验证</Badge>;
    }
  };

  const getCertTypeName = (type: string) => {
    const types: Record<string, string> = {
      psychology: "心理咨询师",
      coaching: "教练认证",
      counseling: "咨询师",
      other: "其他"
    };
    return types[type] || type;
  };

  if (certifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暂未上传资质证书
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {certifications.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {cert.image_url ? (
                <div 
                  className="w-24 h-24 rounded-lg bg-muted overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setSelectedCert(cert)}
                >
                  <img 
                    src={cert.image_url} 
                    alt={cert.cert_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{cert.cert_name}</h4>
                  {getStatusBadge(cert.verification_status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>类型：{getCertTypeName(cert.cert_type)}</div>
                  {cert.cert_number && <div>证书编号：{cert.cert_number}</div>}
                  {cert.issuing_authority && <div>颁发机构：{cert.issuing_authority}</div>}
                  {cert.issue_date && (
                    <div>颁发日期：{format(new Date(cert.issue_date), "yyyy年MM月", { locale: zhCN })}</div>
                  )}
                </div>
                
                {cert.admin_note && (
                  <p className="text-sm mt-2 p-2 bg-muted rounded text-muted-foreground">
                    审核备注：{cert.admin_note}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-2">
                {cert.image_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(cert.image_url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                {cert.verification_status === "pending" && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateCertMutation.mutate({ 
                        certId: cert.id, 
                        status: "verified" 
                      })}
                      disabled={updateCertMutation.isPending}
                    >
                      {updateCertMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setSelectedCert(cert)}
                      disabled={updateCertMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 拒绝证书对话框 */}
      <Dialog open={!!selectedCert && selectedCert.verification_status === "pending"} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>标记证书无效</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                请填写拒绝原因（可选）：
              </p>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="如：证书信息不清晰、无法验证真实性等"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedCert(null)}>
                取消
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (selectedCert) {
                    updateCertMutation.mutate({
                      certId: selectedCert.id,
                      status: "rejected",
                      note: adminNote
                    });
                  }
                }}
                disabled={updateCertMutation.isPending}
              >
                {updateCertMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                确认标记无效
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 查看证书图片对话框 */}
      <Dialog 
        open={!!selectedCert && selectedCert.verification_status !== "pending"} 
        onOpenChange={() => setSelectedCert(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCert?.cert_name}</DialogTitle>
          </DialogHeader>
          {selectedCert?.image_url && (
            <img 
              src={selectedCert.image_url} 
              alt={selectedCert.cert_name}
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
