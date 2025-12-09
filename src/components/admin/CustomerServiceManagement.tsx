import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Search, MessageSquare, AlertCircle, Lightbulb, CheckCircle, Clock, XCircle, Settings, Headphones, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Ticket {
  id: string;
  ticket_no: string;
  ticket_type: string;
  category: string | null;
  subject: string;
  description: string;
  priority: string;
  status: string;
  resolution: string | null;
  created_at: string;
  user_id: string | null;
}

interface Feedback {
  id: string;
  feedback_type: string;
  category: string | null;
  content: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  user_id: string | null;
}

const ticketStatusConfig = {
  open: { label: '待处理', color: 'bg-amber-500', icon: Clock },
  in_progress: { label: '处理中', color: 'bg-blue-500', icon: MessageSquare },
  resolved: { label: '已解决', color: 'bg-green-500', icon: CheckCircle },
  closed: { label: '已关闭', color: 'bg-gray-500', icon: XCircle },
};

const priorityConfig = {
  low: { label: '低', color: 'text-gray-500' },
  normal: { label: '普通', color: 'text-blue-500' },
  high: { label: '高', color: 'text-amber-500' },
  urgent: { label: '紧急', color: 'text-red-500' },
};

const feedbackStatusConfig = {
  pending: { label: '待审核', color: 'bg-amber-500' },
  reviewed: { label: '已审核', color: 'bg-blue-500' },
  implemented: { label: '已采纳', color: 'bg-green-500' },
  rejected: { label: '已拒绝', color: 'bg-gray-500' },
};

interface ServiceConfig {
  enabledModes: {
    text: boolean;
    voice_natural: boolean;
    voice_button: boolean;
  };
  defaultMode: 'text' | 'voice_natural' | 'voice_button';
  floatingButtonVisible: boolean;
}

export default function CustomerServiceManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [resolution, setResolution] = useState("");
  const [adminNote, setAdminNote] = useState("");

  // 客服设置状态
  const [serviceConfig, setServiceConfig] = useState<ServiceConfig>({
    enabledModes: { text: true, voice_natural: true, voice_button: true },
    defaultMode: 'voice_natural',
    floatingButtonVisible: true,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    loadData();
    loadServiceConfig();
  }, []);

  const loadServiceConfig = async () => {
    const { data, error } = await supabase
      .from('customer_service_config')
      .select('config_key, config_value');
    
    if (error) {
      console.error('Config error:', error);
      return;
    }

    if (data && data.length > 0) {
      const configMap = data.reduce((acc, item) => {
        acc[item.config_key] = item.config_value;
        return acc;
      }, {} as Record<string, unknown>);

      setServiceConfig({
        enabledModes: (configMap['enabled_modes'] as ServiceConfig['enabledModes']) || serviceConfig.enabledModes,
        defaultMode: (configMap['default_mode'] as ServiceConfig['defaultMode']) || serviceConfig.defaultMode,
        floatingButtonVisible: configMap['floating_button_visible'] !== false,
      });
    }
  };

  const saveServiceConfig = async () => {
    setSavingConfig(true);
    try {
      const updates = [
        { config_key: 'enabled_modes', config_value: serviceConfig.enabledModes, description: '启用的客服模式' },
        { config_key: 'default_mode', config_value: serviceConfig.defaultMode, description: '默认客服模式' },
        { config_key: 'floating_button_visible', config_value: serviceConfig.floatingButtonVisible, description: '悬浮语音按钮是否显示' },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('customer_service_config')
          .upsert(update, { onConflict: 'config_key' });
        if (error) throw error;
      }

      toast.success('设置已保存');
    } catch (error) {
      console.error('Save config error:', error);
      toast.error('保存失败');
    } finally {
      setSavingConfig(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [ticketsRes, feedbacksRes] = await Promise.all([
      supabase.from('customer_tickets').select('*').order('created_at', { ascending: false }),
      supabase.from('user_feedback').select('*').order('created_at', { ascending: false }),
    ]);
    
    if (ticketsRes.error) console.error('Tickets error:', ticketsRes.error);
    if (feedbacksRes.error) console.error('Feedbacks error:', feedbacksRes.error);
    
    setTickets(ticketsRes.data || []);
    setFeedbacks(feedbacksRes.data || []);
    setLoading(false);
  };

  const handleUpdateTicket = async (ticketId: string, status: string) => {
    const updates: Record<string, unknown> = { status };
    if (status === 'resolved' && resolution) {
      updates.resolution = resolution;
      updates.resolved_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('customer_tickets')
      .update(updates)
      .eq('id', ticketId);
    
    if (error) {
      toast.error('更新失败');
    } else {
      toast.success('更新成功');
      loadData();
      setSelectedTicket(null);
      setResolution("");
    }
  };

  const handleUpdateFeedback = async (feedbackId: string, status: string) => {
    const updates: Record<string, unknown> = { 
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (adminNote) {
      updates.admin_note = adminNote;
    }
    
    const { error } = await supabase
      .from('user_feedback')
      .update(updates)
      .eq('id', feedbackId);
    
    if (error) {
      toast.error('更新失败');
    } else {
      toast.success('更新成功');
      loadData();
      setSelectedFeedback(null);
      setAdminNote("");
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = searchQuery === '' || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_no.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchesSearch = searchQuery === '' || 
      f.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  const feedbackStats = {
    total: feedbacks.length,
    pending: feedbacks.filter(f => f.status === 'pending').length,
    implemented: feedbacks.filter(f => f.status === 'implemented').length,
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{ticketStats.open}</div>
                <div className="text-sm text-muted-foreground">待处理工单</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{ticketStats.in_progress}</div>
                <div className="text-sm text-muted-foreground">处理中工单</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-100">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{feedbackStats.pending}</div>
                <div className="text-sm text-muted-foreground">待审核建议</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{feedbackStats.implemented}</div>
                <div className="text-sm text-muted-foreground">已采纳建议</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tickets">
        <TabsList>
          <TabsTrigger value="tickets">工单管理 ({ticketStats.total})</TabsTrigger>
          <TabsTrigger value="feedbacks">用户建议 ({feedbackStats.total})</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1">
            <Settings className="h-4 w-4" />
            客服设置
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          {/* 搜索和筛选 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索工单号或主题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(ticketStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工单号</TableHead>
                    <TableHead>主题</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">加载中...</TableCell>
                    </TableRow>
                  ) : filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无工单</TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => {
                      const statusConf = ticketStatusConfig[ticket.status as keyof typeof ticketStatusConfig];
                      const priorityConf = priorityConfig[ticket.priority as keyof typeof priorityConfig];
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-mono text-sm">{ticket.ticket_no}</TableCell>
                          <TableCell>
                            <div className="font-medium">{ticket.subject}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</div>
                          </TableCell>
                          <TableCell>
                            <span className={priorityConf?.color}>{priorityConf?.label}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConf?.color}>{statusConf?.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(ticket.created_at), 'MM-dd HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>
                              处理
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedbacks" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索建议内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.entries(feedbackStatusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">加载中...</TableCell>
                    </TableRow>
                  ) : filteredFeedbacks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无建议</TableCell>
                    </TableRow>
                  ) : (
                    filteredFeedbacks.map((feedback) => {
                      const statusConf = feedbackStatusConfig[feedback.status as keyof typeof feedbackStatusConfig];
                      return (
                        <TableRow key={feedback.id}>
                          <TableCell>
                            <Badge variant="outline">{feedback.feedback_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md line-clamp-2">{feedback.content}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConf?.color}>{statusConf?.label}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(feedback.created_at), 'MM-dd HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedFeedback(feedback)}>
                              处理
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 客服设置 Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                客服模式配置
              </CardTitle>
              <CardDescription>控制用户可用的客服交互方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 模式开关 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">文字客服</div>
                      <div className="text-sm text-muted-foreground">用户可通过文字与AI客服交流</div>
                    </div>
                  </div>
                  <Switch
                    checked={serviceConfig.enabledModes.text}
                    onCheckedChange={(checked) =>
                      setServiceConfig(prev => ({
                        ...prev,
                        enabledModes: { ...prev.enabledModes, text: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-teal-100">
                      <Headphones className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <div className="font-medium">语音客服 - 自然对话</div>
                      <div className="text-sm text-muted-foreground">自动检测用户语音，无需按钮控制</div>
                    </div>
                  </div>
                  <Switch
                    checked={serviceConfig.enabledModes.voice_natural}
                    onCheckedChange={(checked) =>
                      setServiceConfig(prev => ({
                        ...prev,
                        enabledModes: { ...prev.enabledModes, voice_natural: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Headphones className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">语音客服 - 按钮模式</div>
                      <div className="text-sm text-muted-foreground">用户按住按钮进行语音录制</div>
                    </div>
                  </div>
                  <Switch
                    checked={serviceConfig.enabledModes.voice_button}
                    onCheckedChange={(checked) =>
                      setServiceConfig(prev => ({
                        ...prev,
                        enabledModes: { ...prev.enabledModes, voice_button: checked }
                      }))
                    }
                  />
                </div>
              </div>

              {/* 默认模式 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">默认模式</label>
                <Select
                  value={serviceConfig.defaultMode}
                  onValueChange={(value: ServiceConfig['defaultMode']) =>
                    setServiceConfig(prev => ({ ...prev, defaultMode: value }))
                  }
                >
                  <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="选择默认模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text" disabled={!serviceConfig.enabledModes.text}>文字客服</SelectItem>
                    <SelectItem value="voice_natural" disabled={!serviceConfig.enabledModes.voice_natural}>语音-自然对话</SelectItem>
                    <SelectItem value="voice_button" disabled={!serviceConfig.enabledModes.voice_button}>语音-按钮模式</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">用户打开客服时默认显示的模式</p>
              </div>

              {/* 悬浮按钮设置 */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">显示悬浮客服按钮</div>
                  <div className="text-sm text-muted-foreground">在页面右下角显示快捷客服入口</div>
                </div>
                <Switch
                  checked={serviceConfig.floatingButtonVisible}
                  onCheckedChange={(checked) =>
                    setServiceConfig(prev => ({ ...prev, floatingButtonVisible: checked }))
                  }
                />
              </div>

              {/* 保存按钮 */}
              <div className="flex justify-end pt-4">
                <Button onClick={saveServiceConfig} disabled={savingConfig}>
                  {savingConfig ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 工单详情弹窗 */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>处理工单 {selectedTicket?.ticket_no}</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">主题</div>
                <div className="font-medium">{selectedTicket.subject}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">描述</div>
                <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">{selectedTicket.description}</div>
              </div>
              {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">解决方案</label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="填写处理结果或解决方案..."
                    rows={3}
                  />
                </div>
              )}
              <div className="flex gap-2 justify-end">
                {selectedTicket.status === 'open' && (
                  <Button variant="outline" onClick={() => handleUpdateTicket(selectedTicket.id, 'in_progress')}>
                    开始处理
                  </Button>
                )}
                {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
                  <Button onClick={() => handleUpdateTicket(selectedTicket.id, 'resolved')}>
                    标记已解决
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 建议详情弹窗 */}
      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>处理用户建议</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">建议内容</div>
                <div className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">{selectedFeedback.content}</div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">管理员备注</label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="填写处理备注..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => handleUpdateFeedback(selectedFeedback.id, 'reviewed')}>
                  已审核
                </Button>
                <Button variant="outline" onClick={() => handleUpdateFeedback(selectedFeedback.id, 'rejected')}>
                  拒绝
                </Button>
                <Button onClick={() => handleUpdateFeedback(selectedFeedback.id, 'implemented')}>
                  采纳
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
