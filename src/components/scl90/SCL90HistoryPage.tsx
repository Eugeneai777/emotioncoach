import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Activity, History, TrendingUp, GitCompare, Plus, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SCL90History, SCL90HistoryRecord } from './SCL90History';
import { SCL90Trend } from './SCL90Trend';
import { SCL90Comparison } from './SCL90Comparison';
import { SeverityLevel, SCL90Factor } from './scl90Data';

interface SCL90HistoryPageProps {
  onStartNew?: () => void;
  onBack?: () => void;
  onViewDetail?: (record: SCL90HistoryRecord) => void;
}

export function SCL90HistoryPage({ onStartNew, onBack, onViewDetail }: SCL90HistoryPageProps) {
  const { user } = useAuth();
  const [records, setRecords] = useState<SCL90HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('history');
  const [compareRecords, setCompareRecords] = useState<[SCL90HistoryRecord, SCL90HistoryRecord] | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scl90_assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match SCL90HistoryRecord type
      const transformedData: SCL90HistoryRecord[] = (data || []).map(item => ({
        id: item.id,
        gsi: Number(item.gsi) || 0,
        total_score: item.total_score || 0,
        positive_count: item.positive_count || 0,
        positive_score_avg: Number(item.positive_score_avg) || 0,
        severity_level: (item.severity_level as SeverityLevel) || 'normal',
        primary_symptom: item.primary_symptom as SCL90Factor | null,
        secondary_symptom: item.secondary_symptom as SCL90Factor | null,
        somatization_score: Number(item.somatization_score) || 0,
        obsessive_score: Number(item.obsessive_score) || 0,
        interpersonal_score: Number(item.interpersonal_score) || 0,
        depression_score: Number(item.depression_score) || 0,
        anxiety_score: Number(item.anxiety_score) || 0,
        hostility_score: Number(item.hostility_score) || 0,
        phobic_score: Number(item.phobic_score) || 0,
        paranoid_score: Number(item.paranoid_score) || 0,
        psychoticism_score: Number(item.psychoticism_score) || 0,
        other_score: Number(item.other_score) || 0,
        created_at: item.created_at,
      }));

      setRecords(transformedData);

      // 自动设置对比记录（最新 vs 上一次）
      if (transformedData.length >= 2) {
        setCompareRecords([transformedData[0], transformedData[1]]);
      }
    } catch (e) {
      console.error('Error fetching SCL-90 records:', e);
      toast({
        title: '加载失败',
        description: '无法加载历史记录',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scl90_assessments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(prev => prev.filter(r => r.id !== id));
      toast({
        title: '删除成功',
        description: '测评记录已删除',
      });
    } catch (e) {
      console.error('Error deleting record:', e);
      toast({
        title: '删除失败',
        description: '无法删除记录',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              SCL-90 测评历史
            </h2>
            <p className="text-sm text-muted-foreground">
              共 {records.length} 次测评记录
            </p>
          </div>
        </div>
        {onStartNew && (
          <Button size="sm" onClick={onStartNew} className="gap-1.5">
            <Plus className="w-4 h-4" />
            新测评
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      {records.length > 0 && (
        <motion.div
          initial={{ opacity: 0.01, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ transform: 'translateZ(0)' }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{records.length}</div>
                  <div className="text-xs text-muted-foreground">测评次数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{records[0]?.gsi || '-'}</div>
                  <div className="text-xs text-muted-foreground">最新 GSI</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {records.length >= 2 
                      ? (records[0].gsi - records[records.length - 1].gsi).toFixed(2)
                      : '-'}
                  </div>
                  <div className="text-xs text-muted-foreground">GSI 变化</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3 h-10">
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="w-3.5 h-3.5" />
            历史记录
          </TabsTrigger>
          <TabsTrigger value="trend" className="gap-1.5 text-xs" disabled={records.length < 2}>
            <TrendingUp className="w-3.5 h-3.5" />
            趋势分析
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5 text-xs" disabled={records.length < 2}>
            <GitCompare className="w-3.5 h-3.5" />
            对比分析
          </TabsTrigger>
        </TabsList>

        {/* History List */}
        <TabsContent value="history" className="mt-4">
          <SCL90History
            records={records}
            isLoading={loading}
            onDelete={handleDelete}
            onViewDetail={onViewDetail}
          />
        </TabsContent>

        {/* Trend Analysis */}
        <TabsContent value="trend" className="mt-4">
          {records.length >= 2 ? (
            <SCL90Trend records={records} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">需要至少2次测评记录才能查看趋势分析</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comparison */}
        <TabsContent value="compare" className="mt-4">
          {compareRecords ? (
            <SCL90Comparison current={compareRecords[0]} previous={compareRecords[1]} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <GitCompare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">需要至少2次测评记录才能进行对比分析</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
