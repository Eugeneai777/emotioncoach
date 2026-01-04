import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, List, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { WealthJournalCard } from '@/components/wealth-camp/WealthJournalCard';
import { WealthProgressChart } from '@/components/wealth-camp/WealthProgressChart';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function WealthJournal() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Fetch all journal entries
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['wealth-journal-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('wealth_journal_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Calculate stats
  const stats = {
    totalDays: entries.length,
    avgBehavior: entries.filter(e => e.behavior_score).reduce((acc, e) => acc + (e.behavior_score || 0), 0) / (entries.filter(e => e.behavior_score).length || 1),
    avgEmotion: entries.filter(e => e.emotion_score).reduce((acc, e) => acc + (e.emotion_score || 0), 0) / (entries.filter(e => e.emotion_score).length || 1),
    avgBelief: entries.filter(e => e.belief_score).reduce((acc, e) => acc + (e.belief_score || 0), 0) / (entries.filter(e => e.belief_score).length || 1),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-background dark:from-amber-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="container max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">📖 我的财富日记</h1>
            <p className="text-xs text-muted-foreground">共 {stats.totalDays} 篇</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.avgBehavior.toFixed(1)}</div>
            <div className="text-xs text-amber-700 dark:text-amber-300">平均行为</div>
          </div>
          <div className="bg-pink-100 dark:bg-pink-900/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{stats.avgEmotion.toFixed(1)}</div>
            <div className="text-xs text-pink-700 dark:text-pink-300">平均情绪</div>
          </div>
          <div className="bg-violet-100 dark:bg-violet-900/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-violet-600">{stats.avgBelief.toFixed(1)}</div>
            <div className="text-xs text-violet-700 dark:text-violet-300">平均信念</div>
          </div>
        </div>

        {/* Progress Chart */}
        <WealthProgressChart entries={entries} />

        {/* Journal List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">还没有财富日记</p>
            <p className="text-sm">加入财富卡点训练营，开始记录你的财富成长之旅</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate('/wealth-camp-intro')}
            >
              加入训练营
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-muted-foreground">全部日记</h3>
            {entries.map((entry) => (
              <WealthJournalCard
                key={entry.id}
                entry={entry}
                onClick={() => navigate(`/wealth-journal/${entry.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
