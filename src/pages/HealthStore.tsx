import { useNavigate } from "react-router-dom";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { HealthStoreGrid } from "@/components/store/HealthStoreGrid";
import { getPromotionDomain } from "@/utils/partnerQRUtils";
import { Helmet } from "react-helmet";
import { usePartner } from "@/hooks/usePartner";
import { toast } from "sonner";

const HealthStore = () => {
  const navigate = useNavigate();
  const { partner } = usePartner();

  const handleShare = async () => {
    const baseUrl = `${getPromotionDomain()}/health-store`;
    const shareUrl = partner?.partner_code
      ? `${baseUrl}?ref=${partner.partner_code}`
      : baseUrl;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "有劲健康商城",
          text: "精选健康好物，守护你的身心能量 ✨",
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("链接已复制，快去分享吧！");
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DynamicOGMeta
        title="有劲健康商城"
        description="精选健康好物，守护你的身心能量"
        path="/health-store"
      />

      <PageHeader
        title="🛒 健康商城"
        showBack
        rightActions={
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="w-5 h-5" />
          </Button>
        }
      />

      <div className="px-4 pb-8 pt-2">
        <HealthStoreGrid />
      </div>
    </div>
  );
};

export default HealthStore;
