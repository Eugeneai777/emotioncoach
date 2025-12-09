import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Palette } from "lucide-react";
import { usePartner } from "@/hooks/usePartner";
import { useAuth } from "@/hooks/useAuth";
import { PosterTemplateGrid } from "@/components/poster/PosterTemplateGrid";
import { PosterGenerator } from "@/components/poster/PosterGenerator";
import { Badge } from "@/components/ui/badge";

export default function PosterCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { partner, loading } = usePartner();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">请先登录后使用海报生成中心</p>
            <Button onClick={() => navigate('/auth')}>前往登录</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <div className="animate-pulse text-orange-600">加载中...</div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Palette className="w-12 h-12 mx-auto text-orange-400" />
            <h2 className="text-xl font-semibold">海报生成中心</h2>
            <p className="text-muted-foreground">成为有劲合伙人后可使用推广海报生成功能</p>
            <Button onClick={() => navigate('/partner/type')} className="bg-gradient-to-r from-orange-500 to-amber-500">
              成为合伙人
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entryType = partner.default_entry_type || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold flex items-center gap-2">
                <Palette className="w-5 h-5 text-orange-500" />
                推广海报中心
              </h1>
            </div>
          </div>
          <Badge variant={entryType === 'free' ? 'secondary' : 'default'} className="text-xs">
            {entryType === 'free' ? '🆓 免费入口' : '💰 付费入口'}
          </Badge>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* 入口类型提示 */}
        <div className="p-3 bg-white/60 backdrop-blur rounded-xl border border-orange-100 text-sm text-orange-700">
          <span className="font-medium">当前入口类型：</span>
          {entryType === 'free' ? '免费体验（用户扫码免费获得体验套餐）' : '付费入口（用户扫码支付¥9.9获得体验套餐）'}
          <span className="text-orange-500 ml-2">可在合伙人后台修改</span>
        </div>

        {selectedTemplate ? (
          <PosterGenerator
            templateKey={selectedTemplate}
            partnerId={partner.id}
            entryType={entryType as 'free' | 'paid'}
            onBack={() => setSelectedTemplate(null)}
          />
        ) : (
          <>
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-gray-800">选择你要推广的产品</h2>
              <p className="text-sm text-muted-foreground">AI将根据产品卖点生成专属推广海报</p>
            </div>
            <PosterTemplateGrid onSelect={setSelectedTemplate} />
          </>
        )}
      </div>
    </div>
  );
}
