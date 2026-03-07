import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UserPlus } from "lucide-react";

interface BindUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBind: (phone: string) => Promise<void>;
  isBinding: boolean;
}

export function BindUserDialog({ open, onOpenChange, onBind, isBinding }: BindUserDialogProps) {
  const [phone, setPhone] = useState("");

  const handleBind = async () => {
    if (!phone.trim()) return;
    await onBind(phone.trim());
    setPhone("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>设置负责人</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            输入负责人手机号，设置后该负责人可登录访问合伙人中心。
          </p>
          <div>
            <Label>手机号</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入用户手机号"
              onKeyDown={(e) => e.key === "Enter" && handleBind()}
            />
          </div>
          <Button onClick={handleBind} disabled={isBinding || !phone.trim()} className="w-full">
            {isBinding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
            确认设置
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
