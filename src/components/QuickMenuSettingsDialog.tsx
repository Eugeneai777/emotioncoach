import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, RotateCcw } from 'lucide-react';
import { QuickMenuConfig, availablePages, defaultConfig } from '@/hooks/useQuickMenuConfig';

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

  const handleCustomSlotChange = (slot: 'customSlot1' | 'customSlot2', path: string) => {
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
      <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">自定义快捷菜单</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            设置首页和两个自定义快捷入口
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Home Page Setting */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              🏠 首页跳转
            </Label>
            <RadioGroup
              value={localConfig.homePagePath}
              onValueChange={handleHomePathChange}
              className="grid grid-cols-2 gap-2"
            >
              {availablePages.slice(0, 6).map((page) => (
                <div key={page.path} className="flex items-center space-x-2">
                  <RadioGroupItem value={page.path} id={`home-${page.path}`} />
                  <Label 
                    htmlFor={`home-${page.path}`} 
                    className="text-sm cursor-pointer"
                  >
                    {page.label}
                  </Label>
                </div>
              ))}
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
              className="grid grid-cols-2 gap-2"
            >
              {availablePages.map((page) => (
                <div key={page.path} className="flex items-center space-x-2">
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
              className="grid grid-cols-2 gap-2"
            >
              {availablePages.map((page) => (
                <div key={page.path} className="flex items-center space-x-2">
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
