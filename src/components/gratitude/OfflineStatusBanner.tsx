import { WifiOff, RefreshCw, CloudOff } from "lucide-react";

interface OfflineStatusBannerProps {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
}

export const OfflineStatusBanner = ({ 
  isOnline, 
  pendingCount, 
  isSyncing 
}: OfflineStatusBannerProps) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`flex items-center justify-center gap-2 py-2 px-4 text-sm ${
      !isOnline 
        ? 'bg-amber-500/20 text-amber-200' 
        : 'bg-blue-500/20 text-blue-200'
    }`}>
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4" />
          <span>离线模式 - 记录将在网络恢复后自动同步</span>
        </>
      ) : isSyncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>正在同步 {pendingCount} 条记录...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <CloudOff className="w-4 h-4" />
          <span>{pendingCount} 条待同步</span>
        </>
      ) : null}
    </div>
  );
};
