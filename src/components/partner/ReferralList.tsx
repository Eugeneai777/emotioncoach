import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Users } from "lucide-react";

interface Referral {
  id: string;
  referred_user_id: string;
  level: number;
  created_at: string;
  profiles: {
    display_name: string | null;
  } | null;
}

interface ReferralListProps {
  partnerId: string;
}

export function ReferralList({ partnerId }: ReferralListProps) {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { data, error } = await supabase
          .from('partner_referrals')
          .select(`
            id,
            referred_user_id,
            level,
            created_at,
            profiles:referred_user_id (
              display_name
            )
          `)
          .eq('partner_id', partnerId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReferrals(data as any || []);
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferrals();
  }, [partnerId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <Users className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">还没有推荐用户</p>
            <p className="text-sm text-muted-foreground">分享您的推广链接，开始邀请好友吧！</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>推荐用户列表</CardTitle>
        <CardDescription>
          共 {referrals.length} 位用户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="font-medium">
                  {referral.profiles?.display_name || '用户'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(referral.created_at), 'PPP', { locale: zhCN })}
                </div>
              </div>
              <Badge variant={referral.level === 1 ? "default" : "secondary"}>
                {referral.level === 1 ? '一级' : '二级'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
