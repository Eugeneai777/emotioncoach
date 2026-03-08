import { Card, CardContent } from "@/components/ui/card";

interface DynamicAssessmentQRCardProps {
  qrImageUrl?: string | null;
  qrTitle?: string | null;
}

export function DynamicAssessmentQRCard({ qrImageUrl, qrTitle }: DynamicAssessmentQRCardProps) {
  if (!qrImageUrl) return null;

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-4">
        <img
          src={qrImageUrl}
          alt="二维码"
          className="w-20 h-20 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="font-medium text-sm text-foreground">
            {qrTitle || "扫码获取更多指导"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            长按识别二维码，获取专属服务
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
