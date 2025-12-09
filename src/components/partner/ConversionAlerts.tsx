import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Clock, GraduationCap, Star, Ghost, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ConversionAlertsProps {
  partnerId: string;
}

interface Alert {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  students: { id: string; name: string; daysAgo?: number; campDay?: number }[];
  action: string;
  script?: string;
  icon: React.ReactNode;
  color: string;
}

export function ConversionAlerts({ partnerId }: ConversionAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([]);
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [partnerId]);

  const loadAlerts = async () => {
    try {
      // 获取所有直推学员
      const { data: referrals, error: refError } = await supabase
        .from('partner_referrals')
        .select('id, referred_user_id, created_at, has_joined_group, joined_group_at, joined_camp_id, conversion_status')
        .eq('partner_id', partnerId)
        .eq('level', 1);

      if (refError) throw refError;
      if (!referrals || referrals.length === 0) {
        setAlerts([]);
        setLoading(false);
        return;
      }

      const userIds = referrals.map(r => r.referred_user_id);

      // 获取用户资料
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      // 获取训练营数据
      const { data: camps } = await supabase
        .from('training_camps')
        .select('user_id, current_day, status, milestone_7_reached, milestone_14_reached, milestone_21_completed, updated_at')
        .in('user_id', userIds);

      // 获取最近打卡记录
      const { data: recentProgress } = await supabase
        .from('camp_daily_progress')
        .select('user_id, progress_date, is_checked_in')
        .in('user_id', userIds)
        .gte('progress_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('progress_date', { ascending: false });

      const profileMap = new Map(profiles?.map(p => [p.id, p.display_name || '未知用户']) || []);
      const campMap = new Map(camps?.map(c => [c.user_id, c]) || []);
      
      // 计算最近活跃
      const lastActiveMap = new Map<string, Date>();
      recentProgress?.forEach(p => {
        if (p.is_checked_in) {
          const existing = lastActiveMap.get(p.user_id);
          const progressDate = new Date(p.progress_date);
          if (!existing || progressDate > existing) {
            lastActiveMap.set(p.user_id, progressDate);
          }
        }
      });

      const now = new Date();
      const generatedAlerts: Alert[] = [];

      // 1. 未入群提醒 (>48小时)
      const notJoinedGroup = referrals.filter(r => {
        if (r.has_joined_group) return false;
        const hours = (now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
        return hours > 48;
      });

      if (notJoinedGroup.length > 0) {
        generatedAlerts.push({
          type: 'not_joined_group',
          priority: 'high',
          title: '未入群提醒',
          description: `${notJoinedGroup.length}位学员注册超过48小时仍未加入学员群`,
          students: notJoinedGroup.map(r => ({
            id: r.referred_user_id,
            name: profileMap.get(r.referred_user_id) || '未知用户',
            daysAgo: Math.floor((now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24))
          })),
          action: '私信提醒加群，发送群二维码',
          script: '嗨，欢迎加入有劲学员群！群里有每日打卡互动和专属福利，扫码加入一起成长吧 💪',
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'border-red-200 bg-red-50/50'
        });
      }

      // 2. 训练营停滞 (3天未打卡)
      const stagnantCamps = referrals.filter(r => {
        const camp = campMap.get(r.referred_user_id);
        if (!camp || camp.status !== 'active') return false;
        const lastActive = lastActiveMap.get(r.referred_user_id);
        if (!lastActive) return true;
        const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive >= 3;
      });

      if (stagnantCamps.length > 0) {
        generatedAlerts.push({
          type: 'stagnant_camp',
          priority: 'medium',
          title: '训练营停滞',
          description: `${stagnantCamps.length}位学员连续3天未打卡`,
          students: stagnantCamps.map(r => ({
            id: r.referred_user_id,
            name: profileMap.get(r.referred_user_id) || '未知用户',
            campDay: campMap.get(r.referred_user_id)?.current_day || 0
          })),
          action: '鼓励继续打卡，询问是否遇到困难',
          script: '最近几天没看到你打卡，一切还好吗？如果遇到什么困难可以随时找我聊聊 😊',
          icon: <Clock className="w-4 h-4" />,
          color: 'border-orange-200 bg-orange-50/50'
        });
      }

      // 3. 即将毕业 (Day 18+)
      const nearGraduation = referrals.filter(r => {
        const camp = campMap.get(r.referred_user_id);
        return camp && camp.status === 'active' && camp.current_day >= 18 && !camp.milestone_21_completed;
      });

      if (nearGraduation.length > 0) {
        generatedAlerts.push({
          type: 'near_graduation',
          priority: 'low',
          title: '即将毕业',
          description: `${nearGraduation.length}位学员即将完成21天训练营`,
          students: nearGraduation.map(r => ({
            id: r.referred_user_id,
            name: profileMap.get(r.referred_user_id) || '未知用户',
            campDay: campMap.get(r.referred_user_id)?.current_day || 0
          })),
          action: '准备毕业祝贺和转化话术',
          script: '恭喜你即将完成21天训练营！这段时间的坚持真的很棒 🎉 想继续深入成长的话，365会员可以解锁更多功能哦~',
          icon: <GraduationCap className="w-4 h-4" />,
          color: 'border-green-200 bg-green-50/50'
        });
      }

      // 4. 转化最佳时机 (刚达成里程碑)
      const milestoneReached = referrals.filter(r => {
        const camp = campMap.get(r.referred_user_id);
        if (!camp) return false;
        return (camp.current_day === 7 && camp.milestone_7_reached) ||
               (camp.current_day === 14 && camp.milestone_14_reached) ||
               (camp.current_day === 21 && camp.milestone_21_completed);
      });

      if (milestoneReached.length > 0) {
        generatedAlerts.push({
          type: 'milestone_conversion',
          priority: 'high',
          title: '转化最佳时机',
          description: `${milestoneReached.length}位学员刚达成里程碑，是转化的最佳时机`,
          students: milestoneReached.map(r => ({
            id: r.referred_user_id,
            name: profileMap.get(r.referred_user_id) || '未知用户',
            campDay: campMap.get(r.referred_user_id)?.current_day || 0
          })),
          action: '发送祝贺并引导升级365会员',
          script: '恭喜达成里程碑！你的坚持让人感动 ✨ 升级365会员可以解锁1000次AI对话和全部高级功能，现在升级还有优惠~',
          icon: <Star className="w-4 h-4" />,
          color: 'border-blue-200 bg-blue-50/50'
        });
      }

      // 5. 长期未活跃 (>14天)
      const longInactive = referrals.filter(r => {
        if (r.conversion_status === 'paid' || r.conversion_status === 'partner') return false;
        const daysSinceJoin = (now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceJoin < 14) return false;
        const lastActive = lastActiveMap.get(r.referred_user_id);
        if (!lastActive) return true;
        const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceActive >= 7;
      });

      if (longInactive.length > 0) {
        generatedAlerts.push({
          type: 'long_inactive',
          priority: 'medium',
          title: '长期未活跃',
          description: `${longInactive.length}位学员超过14天但无近期活动`,
          students: longInactive.map(r => ({
            id: r.referred_user_id,
            name: profileMap.get(r.referred_user_id) || '未知用户',
            daysAgo: Math.floor((now.getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24))
          })),
          action: '重新激活，询问近况',
          script: '好久没看到你了，最近还好吗？如果有什么想聊的或者需要帮助的，随时联系我哦 🌿',
          icon: <Ghost className="w-4 h-4" />,
          color: 'border-gray-200 bg-gray-50/50'
        });
      }

      // 按优先级排序
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      generatedAlerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Load alerts error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlert = (type: string) => {
    setExpandedAlerts(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const copyScript = (script: string, type: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(type);
    toast.success("话术已复制");
    setTimeout(() => setCopiedScript(null), 2000);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-green-700 font-medium">暂无需要跟进的学员</p>
          <p className="text-sm text-muted-foreground mt-1">所有学员状态良好，继续保持！</p>
        </CardContent>
      </Card>
    );
  }

  const highPriorityAlerts = alerts.filter(a => a.priority === 'high');
  const otherAlerts = alerts.filter(a => a.priority !== 'high');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          智能跟进提醒
          <Badge variant="secondary" className="ml-auto">
            {alerts.reduce((sum, a) => sum + a.students.length, 0)} 位学员
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 高优先级提醒 */}
        {highPriorityAlerts.map(alert => (
          <Collapsible 
            key={alert.type} 
            open={expandedAlerts.includes(alert.type)}
            onOpenChange={() => toggleAlert(alert.type)}
          >
            <div className={`rounded-lg border ${alert.color}`}>
              <CollapsibleTrigger asChild>
                <div className="w-full p-3 flex items-center gap-3 text-left cursor-pointer">
                  <div className="p-1.5 rounded-full bg-white shadow-sm">
                    {alert.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{alert.title}</span>
                      <Badge variant="destructive" className="text-xs">
                        {alert.students.length}人
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                  </div>
                  {expandedAlerts.includes(alert.type) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {alert.students.map(s => (
                      <Badge key={s.id} variant="outline" className="text-xs">
                        {s.name}
                        {s.daysAgo !== undefined && <span className="ml-1 text-muted-foreground">({s.daysAgo}天前)</span>}
                        {s.campDay !== undefined && <span className="ml-1 text-muted-foreground">(Day{s.campDay})</span>}
                      </Badge>
                    ))}
                  </div>
                  <div className="p-2 bg-white/60 rounded text-xs">
                    <span className="font-medium">建议行动：</span>{alert.action}
                  </div>
                  {alert.script && (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 p-2 bg-white rounded text-xs italic text-muted-foreground">
                        "{alert.script}"
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-2"
                        onClick={() => copyScript(alert.script!, alert.type)}
                      >
                        {copiedScript === alert.type ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}

        {/* 其他优先级提醒 */}
        {otherAlerts.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <div className="w-full p-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 cursor-pointer">
                查看更多提醒 ({otherAlerts.length})
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {otherAlerts.map(alert => (
                <Collapsible 
                  key={alert.type}
                  open={expandedAlerts.includes(alert.type)}
                  onOpenChange={() => toggleAlert(alert.type)}
                >
                  <div className={`rounded-lg border ${alert.color}`}>
                    <CollapsibleTrigger asChild>
                      <div className="w-full p-3 flex items-center gap-3 text-left cursor-pointer">
                        <div className="p-1.5 rounded-full bg-white shadow-sm">
                          {alert.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{alert.title}</span>
                            <Badge variant="secondary" className="text-xs">
                              {alert.students.length}人
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
                        </div>
                        {expandedAlerts.includes(alert.type) ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-3 pb-3 space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {alert.students.map(s => (
                            <Badge key={s.id} variant="outline" className="text-xs">
                              {s.name}
                              {s.daysAgo !== undefined && <span className="ml-1 text-muted-foreground">({s.daysAgo}天前)</span>}
                              {s.campDay !== undefined && <span className="ml-1 text-muted-foreground">(Day{s.campDay})</span>}
                            </Badge>
                          ))}
                        </div>
                        <div className="p-2 bg-white/60 rounded text-xs">
                          <span className="font-medium">建议行动：</span>{alert.action}
                        </div>
                        {alert.script && (
                          <div className="flex items-start gap-2">
                            <div className="flex-1 p-2 bg-white rounded text-xs italic text-muted-foreground">
                              "{alert.script}"
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-2"
                              onClick={() => copyScript(alert.script!, alert.type)}
                            >
                              {copiedScript === alert.type ? (
                                <Check className="w-3.5 h-3.5 text-green-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
