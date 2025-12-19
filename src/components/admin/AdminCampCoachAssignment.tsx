import { useState } from "react";
import { 
  useAllCampAssignments, 
  usePendingBloomPurchases, 
  useCreateCampAssignment,
  useUpdateAssignmentStatus
} from "@/hooks/useCampCoachAssignments";
import { useActiveHumanCoaches } from "@/hooks/useHumanCoaches";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  UserPlus, 
  Users,
  CheckCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";

export function AdminCampCoachAssignment() {
  const [activeTab, setActiveTab] = useState("pending");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>("");
  const [assignNotes, setAssignNotes] = useState("");

  const { data: pendingPurchases, isLoading: pendingLoading } = usePendingBloomPurchases();
  const { data: assignments, isLoading: assignmentsLoading } = useAllCampAssignments();
  const { data: coaches, isLoading: coachesLoading } = useActiveHumanCoaches();
  const createAssignment = useCreateCampAssignment();
  const updateStatus = useUpdateAssignmentStatus();

  const handleOpenAssignDialog = (purchase: any) => {
    setSelectedPurchase(purchase);
    setSelectedCoachId("");
    setAssignNotes("");
    setAssignDialogOpen(true);
  };

  const handleAssignCoach = async () => {
    if (!selectedPurchase || !selectedCoachId) return;

    try {
      await createAssignment.mutateAsync({
        campId: selectedPurchase.training_camps?.[0]?.id || selectedPurchase.id,
        coachId: selectedCoachId,
        purchaseId: selectedPurchase.id,
        userId: selectedPurchase.user_id,
        productLine: 'bloom',
        notes: assignNotes || undefined,
      });
      toast.success('教练分配成功');
      setAssignDialogOpen(false);
    } catch (error) {
      toast.error('分配失败，请重试');
    }
  };

  const handleCompleteAssignment = async (assignmentId: string) => {
    try {
      await updateStatus.mutateAsync({
        assignmentId,
        status: 'completed',
      });
      toast.success('已标记为完成');
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">进行中</Badge>;
      case 'completed':
        return <Badge className="bg-green-50 text-green-700 border-green-200">已完成</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-50 text-red-700 border-red-200">已取消</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    pending: pendingPurchases?.length || 0,
    active: assignments?.filter(a => a.status === 'active').length || 0,
    completed: assignments?.filter(a => a.status === 'completed').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-pink-500" />
          绽放训练营教练分配
        </h1>
        <p className="text-muted-foreground">为购买绽放系列训练营的学员分配专属教练</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">待分配</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">进行中</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">已完成</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.completed}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            待分配 ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="all">
            所有分配
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>待分配学员</CardTitle>
              <CardDescription>已购买绽放训练营但尚未分配教练的学员</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : pendingPurchases && pendingPurchases.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学员</TableHead>
                      <TableHead>训练营</TableHead>
                      <TableHead>购买金额</TableHead>
                      <TableHead>购买时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPurchases.map((purchase: any) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={purchase.profiles?.avatar_url} />
                              <AvatarFallback>
                                {purchase.profiles?.display_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{purchase.profiles?.display_name || '未知用户'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                            🌸 {purchase.camp_templates?.camp_name || '绽放训练营'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          ¥{Number(purchase.amount || 0).toFixed(0)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(purchase.created_at), 'MM/dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handleOpenAssignDialog(purchase)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            分配教练
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无待分配的学员
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>所有分配记录</CardTitle>
              <CardDescription>查看所有训练营教练分配情况</CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <p className="text-center text-muted-foreground py-8">加载中...</p>
              ) : assignments && assignments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>学员</TableHead>
                      <TableHead>教练</TableHead>
                      <TableHead>训练营</TableHead>
                      <TableHead>分配时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment: any) => (
                      <TableRow key={assignment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignment.profiles?.avatar_url} />
                              <AvatarFallback>
                                {assignment.profiles?.display_name?.[0] || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{assignment.profiles?.display_name || '未知用户'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={assignment.human_coaches?.avatar_url} />
                              <AvatarFallback>
                                {assignment.human_coaches?.name?.[0] || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <span>{assignment.human_coaches?.name || '未知教练'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200">
                            {assignment.training_camps?.camp_type || '绽放训练营'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(assignment.assigned_at), 'MM/dd HH:mm', { locale: zhCN })}
                        </TableCell>
                        <TableCell>{getStatusBadge(assignment.status)}</TableCell>
                        <TableCell className="text-right">
                          {assignment.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleCompleteAssignment(assignment.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              标记完成
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  暂无分配记录
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 分配教练对话框 */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>分配教练</DialogTitle>
            <DialogDescription>
              为学员 {selectedPurchase?.profiles?.display_name || '未知'} 分配专属教练
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择教练</Label>
              <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择一位教练" />
                </SelectTrigger>
                <SelectContent>
                  {coaches?.map((coach) => (
                    <SelectItem key={coach.id} value={coach.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={coach.avatar_url || ''} />
                          <AvatarFallback>{coach.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{coach.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({coach.specialties?.slice(0, 2).join('、') || '暂无专长'})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Textarea
                placeholder="添加分配备注..."
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAssignCoach} 
              disabled={!selectedCoachId || createAssignment.isPending}
            >
              {createAssignment.isPending ? '分配中...' : '确认分配'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
