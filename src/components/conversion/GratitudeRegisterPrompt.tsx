import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cloud, Shield, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GratitudeRegisterPromptProps {
  open: boolean;
  onClose: () => void;
  entryCount: number;
}

export const GratitudeRegisterPrompt = ({
  open,
  onClose,
  entryCount,
}: GratitudeRegisterPromptProps) => {
  const navigate = useNavigate();

  const handleRegister = () => {
    onClose();
    navigate("/auth?redirect=/gratitude-history");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 flex items-center justify-center">
            <Cloud className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>
          <DialogTitle className="text-xl">保护你的感恩记录</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            每一条感恩都是你的心灵足迹，值得被永久珍藏
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                你已记录 {entryCount} 条感恩
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Shield className="w-5 h-5 text-teal-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium">云端永久保存</p>
                <p className="text-xs text-muted-foreground">
                  注册后自动同步，换设备也不丢失
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleRegister}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            免费注册
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            暂时跳过
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
