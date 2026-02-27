import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import QRCode from "qrcode";
import { type Perspective } from "./communicationAssessmentData";

interface CommInviteCardProps {
  inviteCode: string;
  perspective: Perspective;
}

export function CommInviteCard({ inviteCode, perspective }: CommInviteCardProps) {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');

  const targetLabel = perspective === 'parent' ? '孩子' : '家长';
  const inviteLink = `${window.location.origin}/communication-assessment?invite=${inviteCode}`;

  useEffect(() => {
    QRCode.toDataURL(inviteLink, {
      width: 140,
      margin: 1,
      color: { dark: '#6366f1', light: '#FFFFFF' }
    }).then(setQrUrl).catch(console.error);
  }, [inviteLink]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('邀请码已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('邀请链接已复制');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-400 to-pink-400" />
        <CardContent className="p-5">
          <div className="text-center mb-4">
            <span className="text-3xl">📨</span>
            <h3 className="text-base font-bold mt-2">邀请{targetLabel}一起测评</h3>
            <p className="text-xs text-muted-foreground mt-1">
              完成双视角对比，发现你们之间的认知差异
            </p>
          </div>

          {/* 邀请码 */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl font-bold tracking-widest text-violet-700 bg-violet-100 px-4 py-2 rounded-lg font-mono">
              {inviteCode}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopy} className="text-violet-600">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          {/* 二维码 */}
          {qrUrl && (
            <div className="flex flex-col items-center mb-4">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <img src={qrUrl} alt="邀请二维码" className="w-[120px] h-[120px]" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">扫码直接进入测评</p>
            </div>
          )}

          {/* 复制链接按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="w-full border-violet-200 text-violet-600 hover:bg-violet-50"
          >
            <Copy className="w-3.5 h-3.5 mr-1.5" />
            复制邀请链接
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
