import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, RotateCcw, Heart, Baby, Coins, Sparkles, Gamepad2, Users } from 'lucide-react';
import { QuickMenuConfig, availablePages, coachPages, defaultConfig } from '@/hooks/useQuickMenuConfig';

// Icon mapping for coach pages
const coachIconMap: Record<string, React.ElementType> = {
  Users, Heart, Baby, Coins, Sparkles, Gamepad2,
};

interface QuickMenuSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: QuickMenuConfig;
  onSave: (config: QuickMenuConfig) => void;
}

export const QuickMenuSettingsDialog = ({
  open,
  onOpenChange,
  config,
  onSave,
}: QuickMenuSettingsDialogProps) => {
  const [localConfig, setLocalConfig] = useState<QuickMenuConfig>(config);

  const handleHomePathChange = (path: string) => {
    setLocalConfig(prev => ({ ...prev, homePagePath: path }));
  };

  const handleCustomSlotChange = (slot: 'customSlot1' | 'customSlot2' | 'customSlot3', path: string) => {
    const selectedPage = availablePages.find(p => p.path === path);
    if (selectedPage) {
      setLocalConfig(prev => ({
        ...prev,
        [slot]: {
          id: slot,
          label: selectedPage.label,
          path: selectedPage.path,
          icon: selectedPage.icon,
          color: selectedPage.color,
        },
      }));
    }
  };

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalConfig(defaultConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">自定义快捷菜单</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            设置首页和两个自定义快捷入口
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Home Page Setting - Coach Pages */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              🏠 首页跳转（选择教练）
            </Label>
            <RadioGroup
              value={localConfig.homePagePath}
              onValueChange={handleHomePathChange}
              className="flex flex-col gap-1"
            >
              {coachPages.map((page) => {
                const Icon = coachIconMap[page.icon] || Users;
                return (
                  <div 
                    key={page.path} 
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <RadioGroupItem value={page.path} id={`home-${page.path}`} />
                    <div className={`w-6 h-6 rounded-full ${page.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <Label 
                      htmlFor={`home-${page.path}`} 
                      className="text-sm cursor-pointer flex-1"
                    >
                      {page.label}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Custom Slot 1 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              ⭐ 自定义按钮 1
            </Label>
            <RadioGroup
              value={localConfig.customSlot1.path}
              onValueChange={(path) => handleCustomSlotChange('customSlot1', path)}
              className="flex flex-col gap-1"
            >
              {availablePages.map((page) => (
                <div 
                  key={page.path} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <RadioGroupItem value={page.path} id={`slot1-${page.path}`} />
                  <Label 
                    htmlFor={`slot1-${page.path}`} 
                    className="text-sm cursor-pointer"
                  >
                    {page.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Slot 2 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              ⭐ 自定义按钮 2
            </Label>
            <RadioGroup
              value={localConfig.customSlot2.path}
              onValueChange={(path) => handleCustomSlotChange('customSlot2', path)}
              className="flex flex-col gap-1"
            >
              {availablePages.map((page) => (
                <div 
                  key={page.path} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <RadioGroupItem value={page.path} id={`slot2-${page.path}`} />
                  <Label 
                    htmlFor={`slot2-${page.path}`} 
                    className="text-sm cursor-pointer"
                  >
                    {page.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Slot 3 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              ⭐ 自定义按钮 3
            </Label>
            <RadioGroup
              value={localConfig.customSlot3.path}
              onValueChange={(path) => handleCustomSlotChange('customSlot3', path)}
              className="flex flex-col gap-1"
            >
              {availablePages.map((page) => (
                <div 
                  key={page.path} 
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <RadioGroupItem value={page.path} id={`slot3-${page.path}`} />
                  <Label 
                    htmlFor={`slot3-${page.path}`} 
                    className="text-sm cursor-pointer"
                  >
                    {page.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReset}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            重置
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            className="flex-1"
          >
            <Check className="w-4 h-4 mr-1" />
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
