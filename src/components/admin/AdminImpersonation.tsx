import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, ExternalLink, QrCode, Copy, AlertTriangle, History, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";

interface Candidate {
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
}

interface LogRow {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  target_display_name: string | null;
  target_phone: string | null;
  reason: string;
  opened_via: string | null;
  started_at: string;
  ended_at: string | null;
}

export default function AdminImpersonation() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [reason, setReason] = useState("");
  const [generating, setGenerating] = useState(false);
  const [actionLink, setActionLink] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setCandidates([]);
    setSelected(null);
    setActionLink(null);
    setQrDataUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-impersonate-user", {
        body: { action: "search", query: query.trim() },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "搜索失败");
      setCandidates(data.candidates || []);
      if ((data.candidates || []).length === 0) {
        toast({ title: "未找到匹配用户", description: "请尝试更精确的关键词" });
      }
    } catch (e: any) {
      toast({ title: "搜索失败", description: e?.message || "未知错误", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleGenerate = async (openedVia: "web" | "qrcode" | "copy") => {
    if (!selected || !reason.trim() || reason.trim().length < 4) {
      toast({ title: "请填写排查原因", description: "至少 4 个字", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setActionLink(null);
    setQrDataUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("admin-impersonate-user", {
        body: {
          action: "generate",
          targetUserId: selected.userId,
          reason: reason.trim(),
          openedVia,
        },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "生成失败");

      setActionLink(data.actionLink);

      if (openedVia === "web") {
        // 提示后由用户主动打开,避免弹窗拦截 / 当前会话冲突
        toast({
          title: "链接已生成",
          description: "点击下方「打开链接」按钮在新标签页登录",
        });
      } else if (openedVia === "qrcode") {
        const dataUrl = await QRCode.toDataURL(data.actionLink, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(dataUrl);
      } else if (openedVia === "copy") {
        try {
          await navigator.clipboard.writeText(data.actionLink);
          toast({ title: "链接已复制", description: "粘贴到任意浏览器或聊天工具打开" });
        } catch {
          toast({ title: "请手动复制下方链接", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: "生成失败", description: e?.message || "未知错误", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-impersonate-user", {
        body: { action: "history" },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "加载失败");
      setLogs(data.logs || []);
    } catch (e: any) {
      toast({ title: "加载失败", description: e?.message, variant: "destructive" });
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Eye className="h-6 w-6" />
          模拟登录用户
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          以指定用户身份登录前端,用于排查问题。所有操作将被审计记录。
        </p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          ⚠️ 高敏感操作:模拟登录后所有操作均为目标用户的真实操作。请勿用于支付、改密、删除数据等敏感场景。
          模拟会话不限时长,请用完后从前端横幅「退出模拟」。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="impersonate" onValueChange={(v) => v === "history" && loadLogs()}>
        <TabsList>
          <TabsTrigger value="impersonate">发起模拟</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-3 w-3 mr-1" />
            操作历史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impersonate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. 搜索用户</CardTitle>
              <CardDescription>输入用户昵称(模糊匹配)或手机号(部分即可)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="昵称或手机号"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching || !query.trim()}>
                  {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  搜索
                </Button>
              </div>

              {candidates.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-auto">
                  {candidates.map((c) => (
                    <button
                      key={c.userId}
                      onClick={() => {
                        setSelected(c);
                        setActionLink(null);
                        setQrDataUrl(null);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selected?.userId === c.userId
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={c.avatarUrl || undefined} />
                        <AvatarFallback>{(c.displayName || "U").charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.displayName || "(未设置昵称)"}</div>
                        <div className="text-xs text-muted-foreground">
                          {c.phoneCountryCode || ""} {c.phone || "无手机号"}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {c.userId.slice(0, 8)}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2. 填写排查原因(必填)</CardTitle>
                <CardDescription>该原因将记入审计日志,无法删除</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="例如:用户反馈训练营进度异常,需进入查看 day3 数据"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={500}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground text-right">{reason.length}/500</div>
              </CardContent>
            </Card>
          )}

          {selected && reason.trim().length >= 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">3. 选择打开方式</CardTitle>
                <CardDescription>3 种方式任选,跨端皆可</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleGenerate("web")}
                    disabled={generating}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>新标签页打开</span>
                    <span className="text-[10px] text-muted-foreground">PC 端</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerate("qrcode")}
                    disabled={generating}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <QrCode className="h-5 w-5" />
                    <span>显示二维码</span>
                    <span className="text-[10px] text-muted-foreground">手机扫码</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerate("copy")}
                    disabled={generating}
                    className="h-auto py-3 flex-col gap-1"
                  >
                    <Copy className="h-5 w-5" />
                    <span>复制链接</span>
                    <span className="text-[10px] text-muted-foreground">发同事/微信</span>
                  </Button>
                </div>

                {actionLink && (
                  <div className="space-y-3 pt-3 border-t">
                    {qrDataUrl && (
                      <div className="flex justify-center bg-white p-4 rounded-lg">
                        <img src={qrDataUrl} alt="登录二维码" className="w-64 h-64" />
                      </div>
                    )}
                    <div className="bg-muted/50 rounded p-2 text-xs font-mono break-all">
                      {actionLink}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm">
                        <a href={actionLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          打开链接
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(actionLink);
                          toast({ title: "已复制" });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        复制
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 链接为单次使用,有效期 1 小时。在新设备/浏览器打开后,该浏览器即以目标用户身份登录(顶部会显示红色横幅)。
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近 50 条操作记录</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">暂无记录</div>
              ) : (
                <div className="space-y-2">
                  {logs.map((l) => (
                    <div key={l.id} className="border rounded p-3 text-xs space-y-1">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium">
                          → {l.target_display_name || "(无昵称)"}{" "}
                          <span className="text-muted-foreground">{l.target_phone || ""}</span>
                        </span>
                        <Badge variant={l.ended_at ? "secondary" : "default"} className="shrink-0">
                          {l.ended_at ? "已结束" : "进行中"}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground">原因:{l.reason}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(l.started_at).toLocaleString()}
                        {l.ended_at && ` ~ ${new Date(l.ended_at).toLocaleString()}`}
                        {l.opened_via && ` · 方式:${l.opened_via}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
