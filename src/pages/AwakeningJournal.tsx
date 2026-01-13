import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Trash2, Filter, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { awakeningDimensions, AwakeningType, LifeCard } from "@/config/awakeningConfig";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AwakeningEntry {
  id: string;
  user_id: string;
  type: AwakeningType;
  input_text: string;
  life_card: {
    seeing: string;
    encourage: string;
    blindSpot: string;
    insight: string;
    microAction: string;
    reminder?: {
      time: string;
      action: string;
    };
    recommendedCoach: string;
    recommendedTool?: string;
  };
  created_at: string;
}

const AwakeningJournal: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 获取觉察记录
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['awakening-entries', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('awakening_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as AwakeningEntry[];
    },
    enabled: !!user?.id
  });

  // 删除记录
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('awakening_entries')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['awakening-entries'] });
      toast.success('记录已删除');
    },
    onError: () => {
      toast.error('删除失败');
    }
  });

  // 过滤记录
  const filteredEntries = filterType === "all" 
    ? entries 
    : entries.filter(e => e.type === filterType);

  // 获取维度信息
  const getDimension = (type: AwakeningType) => {
    return awakeningDimensions.find(d => d.id === type);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-6">
          <Sparkles className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">登录后查看觉察日记</h2>
          <p className="text-sm text-muted-foreground">记录你的觉察时刻，追踪成长轨迹</p>
          <Button onClick={() => navigate('/auth')}>去登录</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicOGMeta pageKey="awakeningJournal" />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/awakening')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">觉察日记</h1>
            <div className="w-10" />
          </div>
        </header>

        {/* Filter */}
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="筛选类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {awakeningDimensions.map(dim => (
                  <SelectItem key={dim.id} value={dim.id}>
                    {dim.emoji} {dim.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              共 {filteredEntries.length} 条记录
            </span>
          </div>
        </div>

        {/* Content */}
        <main className="max-w-lg mx-auto px-4 pb-8 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">加载中...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="font-medium">还没有觉察记录</h3>
              <p className="text-sm text-muted-foreground">
                {filterType === "all" ? "开始你的第一次觉察之旅吧" : "没有这个类型的记录"}
              </p>
              <Button onClick={() => navigate('/awakening')}>开始觉察</Button>
            </div>
          ) : (
            <AnimatePresence>
              {filteredEntries.map((entry, index) => {
                const dimension = getDimension(entry.type);
                const isExpanded = expandedId === entry.id;
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-md overflow-hidden",
                        isExpanded && "ring-2 ring-primary/20"
                      )}
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <CardContent className="p-4 space-y-3">
                        {/* Header Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span 
                              className={cn(
                                "text-xl w-8 h-8 rounded-lg flex items-center justify-center",
                                `bg-gradient-to-br ${dimension?.gradient || 'from-gray-500 to-gray-400'}`
                              )}
                            >
                              {dimension?.emoji}
                            </span>
                            <div>
                              <span className="font-medium text-sm">{dimension?.title}觉察</span>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.created_at), 'MM月dd日 HH:mm', { locale: zhCN })}
                              </p>
                            </div>
                          </div>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>删除这条觉察记录？</AlertDialogTitle>
                                <AlertDialogDescription>
                                  此操作无法撤销，记录将被永久删除。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deleteMutation.mutate(entry.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>

                        {/* Input Preview */}
                        <p className={cn(
                          "text-sm text-muted-foreground",
                          !isExpanded && "line-clamp-2"
                        )}>
                          "{entry.input_text}"
                        </p>

                        {/* Life Card Preview */}
                        <div className={cn(
                          "rounded-lg bg-muted/50 p-3 space-y-2 text-sm",
                          !isExpanded && "line-clamp-3"
                        )}>
                          <p><span className="font-medium">👁️ 看见：</span>{entry.life_card.seeing}</p>
                          
                          {isExpanded && (
                            <>
                              <p><span className="font-medium">💛 鼓励：</span>{entry.life_card.encourage}</p>
                              <p><span className="font-medium">🔍 盲点：</span>{entry.life_card.blindSpot}</p>
                              <p><span className="font-medium">💡 启发：</span>{entry.life_card.insight}</p>
                              <p><span className="font-medium">⚡ 微行动：</span>{entry.life_card.microAction}</p>
                            </>
                          )}
                        </div>

                        {/* Expand Hint */}
                        {!isExpanded && (
                          <p className="text-xs text-center text-muted-foreground">
                            点击展开完整生命卡片
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </main>
      </div>
    </>
  );
};

export default AwakeningJournal;
