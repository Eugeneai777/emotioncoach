import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  onComplete: (reflection: string, difficulty: number) => void;
}

export function ActionCompletionDialog({
  open,
  onOpenChange,
  action,
  onComplete,
}: ActionCompletionDialogProps) {
  const [reflection, setReflection] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reflection.trim()) return;
    setIsSubmitting(true);
    await onComplete(reflection, difficulty);
    setIsSubmitting(false);
    setReflection('');
    setDifficulty(3);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            完成给予行动
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Action display */}
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-1">今日给予：</p>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">{action}</p>
          </div>

          {/* Reflection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              完成这个行动时，你感受到了什么？
            </label>
            <Textarea
              placeholder="比如：一开始有点不好意思，但做完后感觉很温暖..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Difficulty rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium">执行难度如何？</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDifficulty(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      star <= difficulty 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-muted-foreground/30"
                    )}
                  />
                </button>
              ))}
              <span className="text-sm text-muted-foreground ml-2">
                {difficulty === 1 && '很容易'}
                {difficulty === 2 && '比较容易'}
                {difficulty === 3 && '适中'}
                {difficulty === 4 && '有点难'}
                {difficulty === 5 && '很有挑战'}
              </span>
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!reflection.trim() || isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? '保存中...' : '✅ 确认完成'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
