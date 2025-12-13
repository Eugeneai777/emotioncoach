import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NetworkQuality } from '@/hooks/useNetworkQuality';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quality: NetworkQuality;
  rtt: number | null;
  onContinue: () => void;
  onCancel: () => void;
}

export function NetworkCheckDialog({
  open,
  onOpenChange,
  quality,
  rtt,
  onContinue,
  onCancel,
}: NetworkCheckDialogProps) {
  const isFair = quality === 'fair';
  const isPoor = quality === 'poor';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              isPoor ? "bg-red-100" : "bg-yellow-100"
            )}>
              {isPoor ? (
                <WifiOff className="w-8 h-8 text-red-500" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              )}
            </div>
          </div>
          <AlertDialogTitle className="text-center">
            {isPoor ? '当前网络环境较差' : '网络状况提示'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-2">
            {isPoor ? (
              <>
                <p>检测到您的网络延迟较高{rtt ? `（${rtt}ms）` : ''}，可能导致通话质量不佳或连接失败。</p>
                <p className="text-muted-foreground">建议您切换到 WiFi 或信号更好的位置后再发起通话。</p>
              </>
            ) : (
              <>
                <p>检测到您的网络不太稳定{rtt ? `（延迟 ${rtt}ms）` : ''}，通话过程中可能出现断断续续的情况。</p>
                <p className="text-muted-foreground">是否仍要继续发起通话？</p>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onCancel} className="w-full sm:w-auto">
            {isPoor ? '知道了' : '取消通话'}
          </AlertDialogCancel>
          {!isPoor && (
            <AlertDialogAction onClick={onContinue} className="w-full sm:w-auto">
              继续通话
            </AlertDialogAction>
          )}
          {isPoor && (
            <AlertDialogAction onClick={onContinue} className="w-full sm:w-auto bg-muted text-muted-foreground hover:bg-muted/80">
              仍要尝试
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
