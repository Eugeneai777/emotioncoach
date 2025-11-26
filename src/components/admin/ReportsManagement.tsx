import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AlertTriangle, CheckCircle, XCircle, Eye } from "lucide-react";

interface Report {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
  community_posts?: {
    title: string | null;
    content: string | null;
    post_type: string;
  };
}

const ReportsManagement = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("post_reports")
        .select(`
          *,
          community_posts (
            title,
            content,
            post_type
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("加载举报失败:", error);
      toast({
        title: "加载失败",
        description: "无法加载举报列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (reportId: string, status: "approved" | "rejected") => {
    if (!session?.user) return;

    try {
      setActionLoading(true);

      const { error } = await supabase
        .from("post_reports")
        .update({
          status,
          reviewed_by: session.user.id,
          reviewed_at: new Date().toISOString(),
          review_note: reviewNote || null,
        })
        .eq("id", reportId);

      if (error) throw error;

      // 如果举报通过，可以考虑隐藏或删除帖子
      if (status === "approved" && selectedReport) {
        // 这里可以添加删除帖子的逻辑
        // await supabase.from("community_posts").delete().eq("id", selectedReport.post_id);
      }

      toast({
        title: "审核完成",
        description: status === "approved" ? "举报已通过" : "举报已驳回",
      });

      setSelectedReport(null);
      setReviewNote("");
      loadReports();
    } catch (error) {
      console.error("审核失败:", error);
      toast({
        title: "审核失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: "outline", label: "待处理", icon: AlertTriangle },
      approved: { variant: "default", label: "已通过", icon: CheckCircle },
      rejected: { variant: "secondary", label: "已驳回", icon: XCircle },
    };

    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      spam: "垃圾信息/广告",
      harassment: "骚扰或欺凌",
      inappropriate: "不当内容",
      misinformation: "虚假信息",
      violence: "暴力或危险内容",
      other: "其他",
    };
    return reasonMap[reason] || reason;
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>举报管理</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>举报时间</TableHead>
              <TableHead>举报原因</TableHead>
              <TableHead>帖子类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  暂无举报
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="text-sm">
                    {formatDistanceToNow(new Date(report.created_at), {
                      addSuffix: true,
                      locale: zhCN,
                    })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getReasonLabel(report.reason)}</div>
                      {report.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {report.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.community_posts?.post_type || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      查看
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* 审核对话框 */}
        <Dialog
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>举报详情</DialogTitle>
              <DialogDescription>
                请审核此举报并做出处理决定
              </DialogDescription>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">举报原因</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getReasonLabel(selectedReport.reason)}
                  </p>
                </div>

                {selectedReport.description && (
                  <div>
                    <label className="text-sm font-medium">详细描述</label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">被举报的帖子</label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      {selectedReport.community_posts?.title && (
                        <h4 className="font-medium mb-2">
                          {selectedReport.community_posts.title}
                        </h4>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {selectedReport.community_posts?.content || "无内容"}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {selectedReport.status === "pending" && (
                  <div>
                    <label className="text-sm font-medium">审核备注</label>
                    <Textarea
                      placeholder="请输入审核备注（可选）"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              {selectedReport?.status === "pending" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleReview(selectedReport.id, "rejected")}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    驳回
                  </Button>
                  <Button
                    onClick={() => handleReview(selectedReport.id, "approved")}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    通过举报
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setSelectedReport(null)}>
                  关闭
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ReportsManagement;
