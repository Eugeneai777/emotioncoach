import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Calendar, CheckCircle2, Crown, UserPlus, ChevronDown, ChevronUp, Download, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { StudentTimeline } from "./StudentTimeline";
import { toast } from "sonner";

interface Student {
  id: string;
  referred_user_id: string;
  created_at: string;
  has_joined_group: boolean;
  joined_group_at: string | null;
  joined_camp_id: string | null;
  joined_camp_at: string | null;
  conversion_status: string;
  profile?: {
    display_name: string | null;
  } | null;
}

interface StudentListProps {
  partnerId: string;
}

type FilterStatus = 'all' | 'not_joined' | 'in_group' | 'purchased' | 'partner';

export function StudentList({ partnerId }: StudentListProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadStudents();
  }, [partnerId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('partner_referrals')
        .select(`
          id,
          referred_user_id,
          created_at,
          has_joined_group,
          joined_group_at,
          joined_camp_id,
          joined_camp_at,
          conversion_status
        `)
        .eq('partner_id', partnerId)
        .eq('level', 1)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 获取用户资料
      const userIds = data?.map(s => s.referred_user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const studentsWithProfiles = (data || []).map(student => ({
        ...student,
        profile: profileMap.get(student.referred_user_id)
      }));

      setStudents(studentsWithProfiles);
    } catch (error) {
      console.error("Load students error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, hasJoinedGroup: boolean) => {
    if (status === 'became_partner') {
      return <Badge className="bg-purple-100 text-purple-700 border-0"><Crown className="w-3 h-3 mr-1" />合伙人</Badge>;
    }
    if (status === 'purchased_365') {
      return <Badge className="bg-green-100 text-green-700 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />365会员</Badge>;
    }
    if (hasJoinedGroup) {
      return <Badge className="bg-blue-100 text-blue-700 border-0"><Users className="w-3 h-3 mr-1" />已入群</Badge>;
    }
    if (status === 'in_camp') {
      return <Badge className="bg-orange-100 text-orange-700 border-0">训练中</Badge>;
    }
    return <Badge variant="secondary">体验中</Badge>;
  };

  const filteredStudents = students.filter(student => {
    // 搜索过滤
    if (searchQuery) {
      const name = student.profile?.display_name || '';
      if (!name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    }

    // 状态过滤
    if (filterStatus === 'not_joined') {
      return !student.has_joined_group;
    }
    if (filterStatus === 'in_group') {
      return student.has_joined_group && student.conversion_status !== 'purchased_365' && student.conversion_status !== 'became_partner';
    }
    if (filterStatus === 'purchased') {
      return student.conversion_status === 'purchased_365';
    }
    if (filterStatus === 'partner') {
      return student.conversion_status === 'became_partner';
    }

    return true;
  });

  const handleExport = () => {
    const csvContent = [
      ['昵称', '加入时间', '入群状态', '转化状态'].join(','),
      ...students.map(s => [
        s.profile?.display_name || '未设置',
        format(new Date(s.created_at), 'yyyy-MM-dd HH:mm'),
        s.has_joined_group ? '已入群' : '未入群',
        s.conversion_status === 'became_partner' ? '合伙人' 
          : s.conversion_status === 'purchased_365' ? '365会员' 
          : '体验中'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `学员列表_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-8 text-center">
          <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">暂无学员</p>
          <p className="text-sm text-muted-foreground mt-1">
            分享你的兑换码，邀请更多人加入
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索学员..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
          <SelectTrigger className="w-28">
            <Filter className="w-4 h-4 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="not_joined">未入群</SelectItem>
            <SelectItem value="in_group">已入群</SelectItem>
            <SelectItem value="purchased">365会员</SelectItem>
            <SelectItem value="partner">合伙人</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={handleExport} title="导出">
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* 学员列表 */}
      <div className="space-y-2">
        {filteredStudents.map(student => (
          <Collapsible 
            key={student.id}
            open={expandedId === student.id}
            onOpenChange={(open) => setExpandedId(open ? student.id : null)}
          >
            <Card className="hover:shadow-md transition-shadow overflow-hidden">
              <CollapsibleTrigger className="w-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <span className="text-lg">
                          {student.profile?.display_name?.[0] || '👤'}
                        </span>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {student.profile?.display_name || '未设置昵称'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(student.created_at), "MM月dd日加入", { locale: zhCN })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(student.conversion_status, student.has_joined_group)}
                      {expandedId === student.id 
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </CardContent>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="border-t bg-muted/20">
                  <StudentTimeline 
                    studentId={student.referred_user_id}
                    registeredAt={student.created_at}
                    hasJoinedGroup={student.has_joined_group}
                    joinedGroupAt={student.joined_group_at}
                    joinedCampAt={student.joined_camp_at}
                    conversionStatus={student.conversion_status}
                  />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* 统计 */}
      <p className="text-xs text-muted-foreground text-center">
        显示 {filteredStudents.length} / 共 {students.length} 位学员
      </p>
    </div>
  );
}