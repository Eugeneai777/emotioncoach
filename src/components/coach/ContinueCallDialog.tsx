import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, X } from 'lucide-react';

interface ContinueCallDialogProps {
  isOpen: boolean;
  scenario: string;
  onChoice: (wantMore: boolean) => void;
}

const SCENARIO_LABELS: Record<string, string> = {
  care: '日常关怀',
  reminder: '任务提醒',
  reactivation: '久别问候',
  camp_followup: '训练营督促',
  emotion_check: '情绪关怀',
  late_night_companion: '深夜陪伴',
  gratitude_reminder: '感恩提醒',
};

const SCENARIO_EMOJIS: Record<string, string> = {
  care: '💚',
  reminder: '⏰',
  reactivation: '👋',
  camp_followup: '🏕️',
  emotion_check: '🌈',
  late_night_companion: '🌙',
  gratitude_reminder: '🌸',
};

export function ContinueCallDialog({ isOpen, scenario, onChoice }: ContinueCallDialogProps) {
  const label = SCENARIO_LABELS[scenario] || '来电提醒';
  const emoji = SCENARIO_EMOJIS[scenario] || '📞';

  return (
    <Dialog open={isOpen}>
      <DialogContent hideCloseButton className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-3xl">{emoji}</span>
            </div>
          </div>
          <DialogTitle className="text-lg">这次通话有帮助吗？</DialogTitle>
          <DialogDescription className="text-center">
            你希望继续接收「{label}」来电吗？
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={() => onChoice(true)}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Heart className="w-4 h-4 mr-2" />
            继续提醒我
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onChoice(false)}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            暂时不需要了
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-2">
          你随时可以在「设置 → 通知」中调整
        </p>
      </DialogContent>
    </Dialog>
  );
}
