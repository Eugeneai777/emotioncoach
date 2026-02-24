import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, Cloud, CloudOff, Loader2, X } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MeditationLibraryCard } from '@/components/wealth-camp/MeditationLibraryCard';
import { WealthMeditationPlayer } from '@/components/wealth-camp/WealthMeditationPlayer';
import { useAudioCache } from '@/hooks/useAudioCache';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface WealthMeditation {
  id: string;
  day_number: number;
  title: string;
  description?: string;
  audio_url: string;
  duration_seconds: number;
  reflection_prompts: string[];
}

export default function MeditationLibrary() {
  const navigate = useNavigate();
  const [selectedMeditation, setSelectedMeditation] = useState<WealthMeditation | null>(null);
  const [isCachingAll, setIsCachingAll] = useState(false);

  const { 
    isSupported,
    cachedUrls,
    formattedTotalSize,
    isCached,
    cacheAudio,
    clearAllCache,
    isLoading: isCacheLoading
  } = useAudioCache();

  // Fetch all meditations
  const { data: meditations = [], isLoading } = useQuery({
    queryKey: ['all-wealth-meditations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wealth_meditations')
        .select('*')
        .order('day_number', { ascending: true });
      
      if (error) throw error;
      return (data || []) as WealthMeditation[];
    },
  });

  // Count cached meditations
  const cachedCount = meditations.filter(m => isCached(m.audio_url)).length;

  // Cache all meditations
  const handleCacheAll = async () => {
    if (isCachingAll) return;
    
    setIsCachingAll(true);
    let successCount = 0;
    
    for (const meditation of meditations) {
      if (!isCached(meditation.audio_url)) {
        const success = await cacheAudio(meditation.audio_url);
        if (success) successCount++;
      }
    }
    
    setIsCachingAll(false);
    
    if (successCount > 0) {
      toast.success(`已缓存 ${successCount} 首冥想音频`);
    } else if (cachedCount === meditations.length) {
      toast.info('所有音频已缓存');
    }
  };

  // Clear all cache
  const handleClearCache = async () => {
    await clearAllCache();
  };

  // Handle meditation selection
  const handleSelectMeditation = (meditation: WealthMeditation) => {
    setSelectedMeditation(meditation);
  };

  // Handle meditation complete (no-op in library mode, just for interface)
  const handleMeditationComplete = (reflection: string) => {
    toast.success('冥想完成！感受已记录');
    setSelectedMeditation(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
        <PageHeader title="冥想音频库" backTo="/wealth-camp-checkin" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto overscroll-contain bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/20 dark:to-background" style={{ WebkitOverflowScrolling: 'touch' }}>
      <PageHeader title="冥想音频库" backTo="/wealth-camp-checkin" />
      
      <main className="container max-w-lg mx-auto px-4 py-6 pb-32">
        {/* Cache Status Bar */}
        {isSupported && (
          <Card className="mb-6 bg-white/80 dark:bg-black/20 border-amber-200 dark:border-amber-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <Cloud className="w-4 h-4" />
                  <span>已缓存 {cachedCount}/{meditations.length} 首</span>
                  {formattedTotalSize !== '0 B' && (
                    <span className="text-xs text-muted-foreground">({formattedTotalSize})</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  {cachedCount < meditations.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCacheAll}
                      disabled={isCachingAll}
                      className="text-xs h-8 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      {isCachingAll ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          缓存中...
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 mr-1" />
                          一键缓存
                        </>
                      )}
                    </Button>
                  )}
                  
                  {cachedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearCache}
                      className="text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      清空
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meditation Grid */}
        <div className="grid grid-cols-2 gap-3">
          {meditations.map((meditation, index) => (
            <motion.div
              key={meditation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <MeditationLibraryCard
                meditation={meditation}
                isCached={isCached(meditation.audio_url)}
                isSelected={selectedMeditation?.id === meditation.id}
                onSelect={() => handleSelectMeditation(meditation)}
                onCache={() => cacheAudio(meditation.audio_url)}
              />
            </motion.div>
          ))}
        </div>

        {/* Instruction */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          点击任意冥想卡片开始播放
        </p>
      </main>

      {/* Bottom Player Sheet */}
      <AnimatePresence>
        {selectedMeditation && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-auto"
          >
            {/* Handle Bar */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 pt-3 pb-2 px-4 flex justify-between items-center">
              <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedMeditation(null)}
                className="absolute right-2 top-2"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Player Content */}
            <div className="px-4 pb-8">
              <WealthMeditationPlayer
                dayNumber={selectedMeditation.day_number}
                title={selectedMeditation.title}
                description={selectedMeditation.description}
                audioUrl={selectedMeditation.audio_url}
                durationSeconds={selectedMeditation.duration_seconds}
                reflectionPrompts={selectedMeditation.reflection_prompts || []}
                onComplete={handleMeditationComplete}
                isCompleted={false}
                isCycleMode={true}
                cycleWeek={1}
                listenCount={1}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay when player is open */}
      <AnimatePresence>
        {selectedMeditation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMeditation(null)}
            className="fixed inset-0 bg-black/30 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
