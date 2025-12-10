import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, QrCode, Eye, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface PosterStats {
  id: string;
  headline: string;
  template_key: string;
  scan_count: number;
  created_at: string;
}

const templateNames: Record<string, string> = {
  emotion_button: '情绪按钮',
  emotion_coach: '情绪教练',
  parent_coach: '亲子教练',
  communication_coach: '沟通教练',
  story_coach: '故事教练',
  emotion_journal_21: '情绪日记训练营',
  parent_emotion_21: '青少年困境突破营',
  '365_member': '365会员',
  member_365: '365会员',
  partner_recruit: '招募合伙人',
};

interface PosterStatsCardProps {
  partnerId: string;
}

export function PosterStatsCard({ partnerId }: PosterStatsCardProps) {
  const [posters, setPosters] = useState<PosterStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    fetchPosterStats();
  }, [partnerId]);

  const fetchPosterStats = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_posters')
        .select('id, headline, template_key, scan_count, created_at')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setPosters(data || []);
      setTotalScans((data || []).reduce((sum, p) => sum + p.scan_count, 0));
    } catch (e) {
      console.error('Failed to fetch poster stats:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="w-4 h-4" />
          海报扫码统计
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{posters.length}</p>
            <p className="text-xs text-amber-700">已创建海报</p>
          </div>
          <div className="bg-teal-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-teal-600">{totalScans}</p>
            <p className="text-xs text-teal-700">总扫码次数</p>
          </div>
        </div>

        {/* Poster List */}
        {posters.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <QrCode className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无海报数据</p>
            <p className="text-xs mt-1">去海报中心创建你的第一张海报吧</p>
          </div>
        ) : (
          <div className="space-y-2">
            {posters.map((poster) => (
              <div
                key={poster.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{poster.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {templateNames[poster.template_key] || poster.template_key} · 
                    {format(new Date(poster.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1 ml-2">
                  <Eye className="w-3 h-3 text-teal-500" />
                  <span className="text-xs font-medium text-teal-600">{poster.scan_count}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {posters.length > 0 && (
          <div className="mt-4 pt-3 border-t flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>扫码数据每扫描一次自动更新</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
