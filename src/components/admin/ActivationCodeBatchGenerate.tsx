import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Download, CheckCircle, Key } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ActivationCodeBatchGenerateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface GeneratedCode {
  code: string;
  batch_name: string;
  source_channel: string | null;
  expires_at: string | null;
}

const SOURCE_CHANNELS = [
  '线下活动',
  '公众号推广',
  '朋友圈',
  '社群推广',
  '合作伙伴',
  '其他',
];

export function ActivationCodeBatchGenerate({
  open,
  onOpenChange,
  onSuccess,
}: ActivationCodeBatchGenerateProps) {
  const [count, setCount] = useState(10);
  const [batchName, setBatchName] = useState('');
  const [sourceChannel, setSourceChannel] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [step, setStep] = useState<'form' | 'result'>('form');

  const resetForm = () => {
    setCount(10);
    setBatchName('');
    setSourceChannel('');
    setExpiresAt('');
    setGeneratedCodes([]);
    setStep('form');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!batchName.trim()) {
      toast.error('请输入批次名称');
      return;
    }

    if (count < 1 || count > 1000) {
      toast.error('生成数量必须在 1-1000 之间');
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-activation-codes', {
        body: {
          count,
          batch_name: batchName.trim(),
          source_channel: sourceChannel || null,
          expires_at: expiresAt || null,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || '生成失败');

      setGeneratedCodes(data.codes);
      setStep('result');
      toast.success(`成功生成 ${data.codes.length} 个激活码`);
      onSuccess();
    } catch (error: any) {
      console.error('Generate activation codes error:', error);
      toast.error(error.message || '生成激活码失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (generatedCodes.length === 0) return;

    const baseUrl = window.location.origin;
    const headers = ['激活码', '激活链接', '批次名称', '来源渠道', '有效期'];
    const rows = generatedCodes.map(code => [
      code.code,
      `${baseUrl}/wealth-block-activate?code=${code.code}`,
      code.batch_name,
      code.source_channel || '',
      code.expires_at ? format(new Date(code.expires_at), 'yyyy-MM-dd') : '永久有效',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `激活码_${batchName}_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success('CSV 文件已下载');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {step === 'form' ? '批量生成激活码' : '生成完成'}
          </DialogTitle>
        </DialogHeader>

        {step === 'form' ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="count">生成数量</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={1000}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                placeholder="输入生成数量（1-1000）"
              />
              <p className="text-xs text-muted-foreground">最多一次生成 1000 个激活码</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batchName">批次名称 *</Label>
              <Input
                id="batchName"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="例如：2026年2月线下活动"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceChannel">来源渠道</Label>
              <Select value={sourceChannel} onValueChange={setSourceChannel}>
                <SelectTrigger>
                  <SelectValue placeholder="选择来源渠道（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_CHANNELS.map(channel => (
                    <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">有效期（可选）</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <p className="text-xs text-muted-foreground">不设置则永久有效</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium text-primary">
                  成功生成 {generatedCodes.length} 个激活码
                </p>
                <p className="text-sm text-muted-foreground">
                  批次：{batchName}
                </p>
              </div>
            </div>

            <div className="max-h-[300px] overflow-auto border rounded-lg">
              <div className="grid grid-cols-2 gap-2 p-3">
                {generatedCodes.slice(0, 20).map((code, index) => (
                  <div
                    key={code.code}
                    className="font-mono text-sm bg-muted px-2 py-1 rounded"
                  >
                    {code.code}
                  </div>
                ))}
                {generatedCodes.length > 20 && (
                  <div className="col-span-2 text-center text-sm text-muted-foreground py-2">
                    ... 还有 {generatedCodes.length - 20} 个激活码
                  </div>
                )}
              </div>
            </div>

            <Button onClick={exportToCSV} variant="outline" className="w-full gap-2">
              <Download className="h-4 w-4" />
              导出 CSV 文件
            </Button>
          </div>
        )}

        <DialogFooter>
          {step === 'form' ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                取消
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                生成激活码
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={resetForm}>
                继续生成
              </Button>
              <Button onClick={handleClose}>
                完成
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
