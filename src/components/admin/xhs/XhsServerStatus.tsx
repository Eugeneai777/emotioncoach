import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface XhsServerStatusProps {
  status: { configured: boolean; reachable: boolean } | null;
  onRefresh: () => void;
}

export function XhsServerStatus({ status, onRefresh }: XhsServerStatusProps) {
  if (!status) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        正在检查 MCP Server 状态...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
      {!status.configured ? (
        <>
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">MCP Server 未配置</p>
            <p className="text-xs text-muted-foreground">
              请先在阿里云服务器部署小红书 MCP Server，然后配置 XHS_MCP_SERVER_URL 密钥
            </p>
          </div>
          <Badge variant="outline" className="text-amber-600 border-amber-300">
            待配置
          </Badge>
        </>
      ) : status.reachable ? (
        <>
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium">MCP Server 已连接</p>
            <p className="text-xs text-muted-foreground">可以正常搜索小红书笔记</p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-300">
            在线
          </Badge>
        </>
      ) : (
        <>
          <XCircle className="h-5 w-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-medium">MCP Server 不可达</p>
            <p className="text-xs text-muted-foreground">
              服务器地址已配置但无法连接，请检查服务器是否运行
            </p>
          </div>
          <Badge variant="destructive">离线</Badge>
        </>
      )}
      <Button variant="ghost" size="icon" onClick={onRefresh}>
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
