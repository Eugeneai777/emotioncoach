import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Download, FileText, Copy, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ImportedInvitation {
  invite_code: string;
  invitee_name: string;
  invitee_phone: string;
  link: string;
}

export function BloomPartnerBatchImport({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [csvContent, setCsvContent] = useState("");
  const [orderAmount, setOrderAmount] = useState("19800");
  const [results, setResults] = useState<ImportedInvitation[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BLOOM';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const parseCSV = (content: string): Array<{ name: string; phone: string; countryCode?: string; notes?: string }> => {
    const lines = content.trim().split('\n');
    const results: Array<{ name: string; phone: string; countryCode?: string; notes?: string }> = [];
    const errors: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header row if present
      if (i === 0 && (line.includes('姓名') || line.toLowerCase().includes('name'))) {
        continue;
      }
      
      const parts = line.split(/[,，\t]/).map(p => p.trim());
      const name = parts[0]?.trim();
      const phone = parts[1]?.trim() || '';
      
      if (!name) continue;
      
      // 手机号必填校验
      if (!phone) {
        errors.push(`第${i + 1}行「${name}」缺少手机号`);
        continue;
      }
      
      // 手机号格式校验（5-15位数字）
      if (!/^\d{5,15}$/.test(phone)) {
        errors.push(`第${i + 1}行「${name}」手机号格式不正确`);
        continue;
      }

      // 第三列：检测是否为区号（以+开头），否则视为备注
      const col3 = parts[2]?.trim() || '';
      let countryCode: string | undefined;
      let notes: string | undefined;
      
      if (col3.startsWith('+') && /^\+\d{1,4}$/.test(col3)) {
        countryCode = col3;
        notes = parts[3]?.trim() || undefined;
      } else {
        notes = col3 || undefined;
      }
      
      results.push({
        name,
        phone,
        countryCode,
        notes,
      });
    }
    
    if (errors.length > 0) {
      toast.error(`${errors.length}条数据校验失败`, {
        description: errors.slice(0, 3).join('；') + (errors.length > 3 ? `…等${errors.length}条` : ''),
        duration: 6000,
      });
    }
    
    return results;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const parsed = parseCSV(csvContent);
    
    if (parsed.length === 0) {
      toast.error("未找到有效数据，请检查CSV格式");
      return;
    }

    setImporting(true);
    const importedResults: ImportedInvitation[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        return;
      }

      const baseUrl = window.location.origin;
      const amount = parseFloat(orderAmount) || 19800;

      for (const item of parsed) {
        const inviteCode = generateInviteCode();
        
        const { error } = await supabase
          .from('partner_invitations')
          .insert({
            invite_code: inviteCode,
            partner_type: 'bloom',
            invitee_name: item.name,
            invitee_phone: item.phone,
            invitee_phone_country_code: item.countryCode || '+86',
            order_amount: amount,
            status: 'pending',
            created_by: user.id,
            notes: item.notes,
          });

        if (error) {
          console.error('Failed to create invitation:', error);
          toast.error(`创建邀请失败: ${item.name}`);
          continue;
        }

        importedResults.push({
          invite_code: inviteCode,
          invitee_name: item.name,
          invitee_phone: item.phone,
          link: `${baseUrl}/invite/${inviteCode}`,
        });
      }

      setResults(importedResults);
      toast.success(`成功创建 ${importedResults.length} 个邀请`);
      onSuccess?.();

    } catch (error) {
      console.error('Import error:', error);
      toast.error("导入失败");
    } finally {
      setImporting(false);
    }
  };

  const handleCopyLink = (code: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success("链接已复制");
  };

  const handleExportResults = () => {
    if (results.length === 0) return;

    const csvContent = [
      "姓名,手机号,邀请码,邀请链接",
      ...results.map(r => `${r.invitee_name},${r.invitee_phone},${r.invite_code},${r.link}`)
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `绽放合伙人邀请_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCsvContent("");
    setResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>批量导入绽放合伙人</DialogTitle>
        </DialogHeader>

        {results.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" />
                CSV 格式说明
              </div>
              <p className="text-sm text-muted-foreground">
                每行一条记录，格式：姓名（必填）,手机号（必填）,区号（可选，如+1）,备注（可选）
              </p>
              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                <span>手机号用于自动匹配用户账号，请务必填写</span>
              </div>
              <pre className="text-xs bg-background p-2 rounded">
{`张艳,13800138001
Angela安安,6109098999,+1
李四,13800138003
王五,13800138004,+86,线下招募`}
              </pre>
            </div>

            <div className="space-y-2">
              <Label>上传 CSV 文件</Label>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
              />
            </div>

            <div className="space-y-2">
              <Label>或直接粘贴数据</Label>
              <Textarea
                placeholder="姓名,手机号（每行一条）"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>订单金额（元）</Label>
              <Input
                type="number"
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
                placeholder="19800"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!csvContent.trim() || importing}
              >
                {importing ? "导入中..." : "开始导入"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span>成功创建 {results.length} 个邀请</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleExportResults}>
                <Download className="h-4 w-4 mr-2" />
                导出结果
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-2">
                {results.map((item) => (
                  <div 
                    key={item.invite_code}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{item.invitee_name}</div>
                      <div className="text-sm text-muted-foreground">{item.invitee_phone}</div>
                      <div className="text-xs font-mono text-primary">{item.invite_code}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyLink(item.invite_code, item.link)}
                    >
                      {copiedCode === item.invite_code ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                继续导入
              </Button>
              <Button onClick={() => setOpen(false)}>
                完成
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
