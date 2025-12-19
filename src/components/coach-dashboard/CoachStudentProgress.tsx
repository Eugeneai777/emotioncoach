import { useState } from "react";
import { useCoachStudentProgress, StudentCampInfo } from "@/hooks/useCoachStudentProgress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  Calendar,
  Sparkles,
  BookOpen,
  MessageCircle,
  Video,
  Target,
  TrendingUp,
  Eye
} from "lucide-react";
import { format, differenceInDays, isToday, parseISO } from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CoachStudentProgressProps {
  coachId: string;
}

export function CoachStudentProgress({ coachId }: CoachStudentProgressProps) {
  const { data: students, isLoading } = useCoachStudentProgress(coachId);
  const [selectedStudent, setSelectedStudent] = useState<StudentCampInfo | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 统计数据
  const activeStudents = students?.filter(s => s.status === 'active') || [];
  const completedStudents = students?.filter(s => s.status === 'completed') || [];
  
  // 今日打卡统计
  const todayCheckins = activeStudents.filter(s => {
    const todayProgress = s.progress.find(p => isToday(parseISO(p.progress_date)));
    return todayProgress?.is_checked_in;
  });

  // 计算学员完成率
  const calculateCompletionRate = (student: StudentCampInfo) => {
    if (!student.camp) return 0;
    const checkedInDays = student.progress.filter(p => p.is_checked_in).length;
    const totalDays = student.camp.current_day || 1;
    return Math.round((checkedInDays / totalDays) * 100);
  };

  // 获取今日进度状态
  const getTodayStatus = (student: StudentCampInfo) => {
    const todayProgress = student.progress.find(p => isToday(parseISO(p.progress_date)));
    if (!todayProgress) return { checked: false, declaration: false, reflection: false, video: false };
    return {
      checked: todayProgress.is_checked_in,
      declaration: todayProgress.declaration_completed,
      reflection: todayProgress.reflection_completed,
      video: todayProgress.video_learning_completed,
    };
  };

  const handleViewDetail = (student: StudentCampInfo) => {
    setSelectedStudent(student);
    setDetailDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" />
          绽放训练营学员管理
        </h2>
        <p className="text-muted-foreground text-sm">实时跟踪学员的打卡和作业完成情况</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">进行中</span>
            </div>
            <p className="text-2xl font-bold mt-1">{activeStudents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">已毕业</span>
            </div>
            <p className="text-2xl font-bold mt-1">{completedStudents.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">今日打卡</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {todayCheckins.length}/{activeStudents.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">平均完成率</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {activeStudents.length > 0 
                ? Math.round(activeStudents.reduce((sum, s) => sum + calculateCompletionRate(s), 0) / activeStudents.length)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 学员列表 */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">进行中 ({activeStudents.length})</TabsTrigger>
          <TabsTrigger value="completed">已毕业 ({completedStudents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {activeStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无进行中的学员
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {activeStudents.map((student) => {
                const completionRate = calculateCompletionRate(student);
                const todayStatus = getTodayStatus(student);
                
                return (
                  <Card key={student.assignment_id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* 用户信息 */}
                        <Avatar className="h-12 w-12 border-2 border-pink-200">
                          <AvatarImage src={student.user.avatar_url || ''} />
                          <AvatarFallback className="bg-pink-100 text-pink-700">
                            {student.user.display_name?.[0] || 'U'}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{student.user.display_name || '学员'}</h4>
                              <p className="text-sm text-muted-foreground">
                                {student.camp?.camp_name || student.camp?.camp_type}
                              </p>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewDetail(student)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              详情
                            </Button>
                          </div>

                          {/* 进度条 */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">
                                第 {student.camp?.current_day || 1} 天 / 共 {student.camp?.duration_days || 21} 天
                              </span>
                              <span className="font-medium">{completionRate}%</span>
                            </div>
                            <Progress value={completionRate} className="h-2" />
                          </div>

                          {/* 今日状态 */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge 
                              variant={todayStatus.checked ? "default" : "outline"}
                              className={cn(
                                "text-xs",
                                todayStatus.checked ? "bg-green-500" : "text-muted-foreground"
                              )}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {todayStatus.checked ? "已打卡" : "未打卡"}
                            </Badge>
                            <Badge 
                              variant={todayStatus.declaration ? "default" : "outline"}
                              className={cn(
                                "text-xs",
                                todayStatus.declaration ? "bg-blue-500" : "text-muted-foreground"
                              )}
                            >
                              <Target className="h-3 w-3 mr-1" />
                              {todayStatus.declaration ? "已宣言" : "未宣言"}
                            </Badge>
                            <Badge 
                              variant={todayStatus.reflection ? "default" : "outline"}
                              className={cn(
                                "text-xs",
                                todayStatus.reflection ? "bg-purple-500" : "text-muted-foreground"
                              )}
                            >
                              <BookOpen className="h-3 w-3 mr-1" />
                              {todayStatus.reflection ? "已反思" : "未反思"}
                            </Badge>
                            <Badge 
                              variant={todayStatus.video ? "default" : "outline"}
                              className={cn(
                                "text-xs",
                                todayStatus.video ? "bg-amber-500" : "text-muted-foreground"
                              )}
                            >
                              <Video className="h-3 w-3 mr-1" />
                              {todayStatus.video ? "已学习" : "未学习"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {completedStudents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                暂无毕业学员
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedStudents.map((student) => {
                const completionRate = calculateCompletionRate(student);
                
                return (
                  <Card key={student.assignment_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.user.avatar_url || ''} />
                          <AvatarFallback>{student.user.display_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-medium">{student.user.display_name || '学员'}</h4>
                          <p className="text-sm text-muted-foreground">
                            完成率 {completionRate}% · {student.camp?.camp_name}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">已毕业</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 学员详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={selectedStudent?.user.avatar_url || ''} />
                <AvatarFallback>{selectedStudent?.user.display_name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
              {selectedStudent?.user.display_name || '学员'} 的训练营进度
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[60vh] pr-4">
            {selectedStudent && (
              <div className="space-y-4">
                {/* 训练营信息 */}
                <Card>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">训练营</span>
                        <p className="font-medium">{selectedStudent.camp?.camp_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">开始日期</span>
                        <p className="font-medium">
                          {selectedStudent.camp?.start_date 
                            ? format(parseISO(selectedStudent.camp.start_date), 'yyyy年M月d日', { locale: zhCN })
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">当前进度</span>
                        <p className="font-medium">
                          第 {selectedStudent.camp?.current_day || 1} 天 / {selectedStudent.camp?.duration_days || 21} 天
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">完成天数</span>
                        <p className="font-medium">{selectedStudent.camp?.completed_days || 0} 天</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 每日进度 */}
                <div>
                  <h4 className="font-medium mb-3">每日打卡记录</h4>
                  <div className="space-y-2">
                    {selectedStudent.progress.slice(0, 14).map((p) => (
                      <div 
                        key={p.id} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          p.is_checked_in ? "bg-green-50 border-green-200" : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                            p.is_checked_in ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {p.is_checked_in ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {format(parseISO(p.progress_date), 'M月d日 EEEE', { locale: zhCN })}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {p.declaration_completed && (
                                <span className="text-xs text-blue-600">✓ 宣言</span>
                              )}
                              {p.emotion_logs_count > 0 && (
                                <span className="text-xs text-purple-600">✓ 情绪记录 ×{p.emotion_logs_count}</span>
                              )}
                              {p.reflection_completed && (
                                <span className="text-xs text-amber-600">✓ 反思</span>
                              )}
                              {p.video_learning_completed && (
                                <span className="text-xs text-pink-600">✓ 视频学习</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {p.checked_in_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(p.checked_in_at), 'HH:mm')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 任务完成情况 */}
                {selectedStudent.tasks.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">作业任务</h4>
                    <div className="space-y-2">
                      {selectedStudent.tasks.slice(0, 10).map((task) => (
                        <div 
                          key={task.id}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg",
                            task.is_completed ? "bg-green-50" : "bg-muted/30"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center",
                            task.is_completed ? "bg-green-500 text-white" : "border border-muted-foreground/30"
                          )}>
                            {task.is_completed && <CheckCircle className="h-3 w-3" />}
                          </div>
                          <span className={cn(
                            "text-sm flex-1",
                            task.is_completed && "line-through text-muted-foreground"
                          )}>
                            {task.task_title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(task.progress_date), 'M/d')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
