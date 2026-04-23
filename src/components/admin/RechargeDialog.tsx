import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { extractEdgeFunctionError } from "@/lib/edgeFunctionError";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  onSuccess: () => void;
}

type Phase = 'idle' | 'submitting' | 'verifying';

const PENDING_KEY_PREFIX = 'admin_recharge_pending_';

const APPLY_TIMEOUT_MS = 20_000;
const STATUS_POLL_TIMEOUT_MS = 8_000;
const STATUS_POLL_INTERVAL_MS = 2_000;
const STATUS_POLL_MAX_ATTEMPTS = 6;

function genRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`__TIMEOUT__:${label}`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

export function RechargeDialog({ open, onOpenChange, userId, userName, onSuccess }: RechargeDialogProps) {
  const [quantity, setQuantity] = useState("100");
  const [packageType, setPackageType] = useState("custom");
  const [notes, setNotes] = useState("");
  const [expiryDays, setExpiryDays] = useState("");
  const [phase, setPhase] = useState<Phase>('idle');
  const pendingRequestIdRef = useRef<string | null>(null);
  const loading = phase !== 'idle';

  const pendingKey = `${PENDING_KEY_PREFIX}${userId}`;

  // 打开时自动恢复未完成的请求
  useEffect(() => {
    if (!open) return;
    try {
      const raw = sessionStorage.getItem(pendingKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.requestId) {
          pendingRequestIdRef.current = parsed.requestId;
          setPhase('verifying');
          verifyExisting(parsed.requestId);
        }
      }
    } catch {/* ignore */}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const resetForm = () => {
    setQuantity("100");
    setPackageType("custom");
    setNotes("");
    setExpiryDays("");
  };

  const clearPending = () => {
    pendingRequestIdRef.current = null;
    try { sessionStorage.removeItem(pendingKey); } catch {/* ignore */}
  };

  const handleSuccess = (amount: number, alreadyProcessed: boolean) => {
    clearPending();
    if (alreadyProcessed) {
      toast.success(`已核实：${userName} 的充值已成功到账`);
    } else {
      toast.success(`成功为 ${userName} 充值 ${amount} 点`);
    }
    setPhase('idle');
    onSuccess();
    onOpenChange(false);
    resetForm();
  };

  const handleFailure = (msg: string) => {
    clearPending();
    setPhase('idle');
    toast.error(msg);
  };

  const pollStatus = async (requestId: string): Promise<void> => {
    setPhase('verifying');
    for (let attempt = 1; attempt <= STATUS_POLL_MAX_ATTEMPTS; attempt++) {
      try {
        const { data, error } = await withTimeout(
          supabase.functions.invoke('admin-recharge', {
            body: { action: 'status', requestId },
          }),
          STATUS_POLL_TIMEOUT_MS,
          'status'
        );

        if (data?.error || error) {
          // 网络/服务错误，继续重试
          console.warn('[Recharge] status check error', { data, error });
        } else if (data?.found) {
          if (data.status === 'applied') {
            handleSuccess(Number(quantity) || 0, true);
            return;
          }
          if (data.status === 'failed') {
            handleFailure(data.errorMessage || '充值失败');
            return;
          }
          // processing：继续轮询
        }
        // 未找到：可能是请求未到达后端，继续短轮询
      } catch (e: any) {
        console.warn('[Recharge] status poll attempt failed', e?.message);
      }

      if (attempt < STATUS_POLL_MAX_ATTEMPTS) {
        await new Promise(r => setTimeout(r, STATUS_POLL_INTERVAL_MS));
      }
    }

    // 多次轮询仍无结果：保留 pending，提示稍后刷新
    setPhase('idle');
    toast.warning('结果核实中，请稍后刷新用户列表查看；切勿重复点击充值', { duration: 6000 });
  };

  const verifyExisting = async (requestId: string) => {
    toast.info('检测到上次充值未完成，正在核实结果...');
    await pollStatus(requestId);
  };

  const handleRecharge = async () => {
    if (loading) return;

    const amount = parseInt(quantity);
    if (!amount || amount <= 0) {
      toast.error("请输入有效的充值额度");
      return;
    }

    const requestId = genRequestId();
    pendingRequestIdRef.current = requestId;
    try {
      sessionStorage.setItem(pendingKey, JSON.stringify({ requestId, amount, ts: Date.now() }));
    } catch {/* ignore */}

    setPhase('submitting');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        handleFailure('认证已过期，请刷新页面后重试');
        return;
      }

      console.log('[Recharge] invoking apply', { requestId, userId, amount });

      const { data, error } = await withTimeout(
        supabase.functions.invoke('admin-recharge', {
          body: {
            action: 'apply',
            requestId,
            userId,
            quantity: amount,
            packageType,
            notes,
            expiryDays: expiryDays ? parseInt(expiryDays) : null,
          },
        }),
        APPLY_TIMEOUT_MS,
        'apply'
      );

      console.log('[Recharge] apply response', { data, error });

      if (data?.success && data?.status === 'applied') {
        handleSuccess(amount, !!data.alreadyProcessed);
        return;
      }

      if (data?.error || error) {
        // 不直接判失败：先核实状态，避免重复扣点
        const errMsg = await extractEdgeFunctionError(data, error, '充值请求异常');
        console.warn('[Recharge] apply returned error, verifying status', errMsg);
        toast.warning('请求异常，正在核实结果...');
        await pollStatus(requestId);
        return;
      }

      // 兜底：进入核实
      await pollStatus(requestId);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (msg.startsWith('__TIMEOUT__')) {
        console.warn('[Recharge] apply timeout, verifying status');
        toast.info('网络较慢，正在核实充值结果，请勿重复点击');
        await pollStatus(requestId);
        return;
      }
      console.error('[Recharge] apply unexpected error', e);
      toast.warning('请求异常，正在核实结果...');
      await pollStatus(requestId);
    }
  };

  const handleDialogChange = (next: boolean) => {
    if (loading && !next) {
      toast.info('正在处理中，请等待结果');
      return;
    }
    onOpenChange(next);
  };

  const buttonText = phase === 'submitting'
    ? '提交中...'
    : phase === 'verifying'
      ? '核实结果中...'
      : '确认充值';

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>手动充值</DialogTitle>
          <DialogDescription>
            为 {userName} 增加使用额度
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">充值额度 *</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="输入充值数量"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageType">套餐类型</Label>
            <Select value={packageType} onValueChange={setPackageType} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">自定义充值</SelectItem>
                <SelectItem value="monthly">月卡</SelectItem>
                <SelectItem value="yearly">年卡</SelectItem>
                <SelectItem value="trial">试用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDays">有效期（天数，可选）</Label>
            <Input
              id="expiryDays"
              type="number"
              value={expiryDays}
              onChange={(e) => setExpiryDays(e.target.value)}
              placeholder="留空表示永久有效"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">备注说明</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录充值原因或相关说明"
              rows={3}
              disabled={loading}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            若网络较慢，请勿重复点击；系统会自动核实是否已充值成功，避免重复赠送。
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleDialogChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleRecharge} disabled={loading}>
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
