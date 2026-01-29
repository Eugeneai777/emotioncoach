import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { DailyTodo, DailyTodoSummary } from '@/hooks/useDailyTodos';

interface DailyTodoCardProps {
  todos: DailyTodo[];
  summary?: DailyTodoSummary | null;
  onToggle: (id: string, completed: boolean) => void;
  onAdd?: (title: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export function DailyTodoCard({ 
  todos, 
  summary, 
  onToggle, 
  onAdd, 
  onDelete,
  isLoading = false 
}: DailyTodoCardProps) {
  const [newTodo, setNewTodo] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const completedCount = todos.filter(t => t.completed).length;
  const completionRate = todos.length > 0 
    ? Math.round((completedCount / todos.length) * 100) 
    : 0;

  const handleAddTodo = () => {
    if (newTodo.trim() && onAdd) {
      onAdd(newTodo.trim());
      setNewTodo('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
    } else if (e.key === 'Escape') {
      setNewTodo('');
      setIsAdding(false);
    }
  };

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedTodos = [...todos].sort((a, b) => {
    // 未完成的排前面
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    // 然后按优先级排序
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  if (isLoading) {
    return (
      <Card className="border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 text-white" />
            </div>
            今日待办
          </CardTitle>
          <Badge variant="outline" className="text-xs bg-white/60 dark:bg-black/20">
            {completedCount}/{todos.length} ({completionRate}%)
          </Badge>
        </div>
        
        {todos.length > 0 && (
          <Progress value={completionRate} className="h-1.5 mt-2" />
        )}
      </CardHeader>
      
      <CardContent className="space-y-3 pt-2">
        {todos.length === 0 && !isAdding ? (
          <div className="text-center py-6 space-y-2">
            <CheckSquare className="w-10 h-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">还没有待办事项</p>
            <p className="text-xs text-muted-foreground">通过AI来电或手动添加</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTodos.map(todo => (
              <div 
                key={todo.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all",
                  todo.completed 
                    ? "bg-emerald-50/80 dark:bg-emerald-950/20" 
                    : "bg-white/60 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10"
                )}
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={(checked) => onToggle(todo.id, !!checked)}
                />
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm block truncate",
                    todo.completed && "line-through text-muted-foreground"
                  )}>
                    {todo.title}
                  </span>
                  {todo.estimated_time && (
                    <span className="text-xs text-muted-foreground">
                      ~{todo.estimated_time}分钟
                    </span>
                  )}
                </div>
                {todo.priority === 'high' && !todo.completed && (
                  <Badge variant="destructive" className="text-xs shrink-0">
                    优先
                  </Badge>
                )}
                {todo.source === 'ai_call' && (
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(todo.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 添加待办 */}
        {isAdding ? (
          <div className="flex gap-2">
            <Input
              placeholder="输入待办事项..."
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="flex-1 h-9 text-sm"
            />
            <Button size="sm" onClick={handleAddTodo} disabled={!newTodo.trim()}>
              添加
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => { setNewTodo(''); setIsAdding(false); }}
            >
              取消
            </Button>
          </div>
        ) : onAdd && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            添加待办
          </Button>
        )}

        {/* AI 总结 */}
        {summary?.ai_summary && (
          <>
            <div 
              className="flex items-center gap-2 pt-2 cursor-pointer"
              onClick={() => setShowSummary(!showSummary)}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                AI 每日总结
              </span>
              {showSummary ? (
                <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />
              )}
            </div>
            {showSummary && (
              <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 text-sm space-y-2">
                <p className="text-amber-800 dark:text-amber-200">{summary.ai_summary}</p>
                {summary.insights && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    💡 {summary.insights}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
