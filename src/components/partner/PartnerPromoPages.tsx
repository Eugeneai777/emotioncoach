import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PartnerPromoPagesProps {
  partnerId: string;
  partnerCode: string;
}

interface PromoCard {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  path: string;
  tag?: string;
}

const promoCards: PromoCard[] = [
  {
    id: "synergy",
    title: "心智×身体 全天候抗压套餐",
    subtitle: "训练营 + 知乐胶囊，双引擎协同",
    emoji: "🔥",
    path: "/promo/synergy",
    tag: "限时特惠",
  },
];

export function PartnerPromoPages({ partnerCode }: PartnerPromoPagesProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const PRODUCTION_DOMAIN = "https://wechat.eugenewe.net";

  const generateLink = (path: string) => {
    return `${PRODUCTION_DOMAIN}${path}?ref=${partnerCode}`;
  };

  const handleCopy = async (card: PromoCard) => {
    const link = generateLink(card.path);
    await navigator.clipboard.writeText(link);
    setCopiedId(card.id);
    toast({ title: "链接已复制", description: "推广链接已复制到剪贴板" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpen = (path: string) => {
    window.open(generateLink(path), "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">推广页面</h3>
          <p className="text-sm text-muted-foreground">
            复制带归因的推广链接，分享给潜在客户
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          共 {promoCards.length} 个页面
        </span>
      </div>

      <div className="space-y-3">
        {promoCards.map((card) => (
          <Card key={card.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xl">{card.emoji}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold truncate">{card.title}</h4>
                    {card.tag && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground shrink-0">
                        {card.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {card.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => handleCopy(card)}
                >
                  {copiedId === card.id ? (
                    <><Check className="w-3.5 h-3.5 mr-1" /> 已复制</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5 mr-1" /> 复制推广链接</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={() => handleOpen(card.path)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> 预览
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2 break-all">
                {generateLink(card.path)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
