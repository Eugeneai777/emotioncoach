import { ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";

interface SupportPackageCardProps {
  package_ids?: string[];
  package_names?: string[];
  highlight_reason?: string;
}

interface PackageInfo {
  id: string;
  package_key: string;
  package_name: string;
  price: number;
  ai_quota: number;
  duration_days: number;
  description: string | null;
}

export const SupportPackageCard = ({ package_ids, package_names, highlight_reason }: SupportPackageCardProps) => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<PackageInfo | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const { data } = await supabase
        .from('packages')
        .select('id, package_key, package_name, price, ai_quota, duration_days, description')
        .eq('is_active', true)
        .order('display_order');
      
      if (data) {
        if (package_names && package_names.length > 0) {
          setPackages(data.filter(p => package_names.includes(p.package_name)));
        } else if (package_ids && package_ids.length > 0) {
          setPackages(data.filter(p => package_ids.includes(p.id)));
        } else {
          setPackages(data);
        }
      }
    };
    fetchPackages();
  }, [package_ids, package_names]);

  if (packages.length === 0) return null;

  const handleClick = (pkg: PackageInfo) => {
    // 直达支付：缩短客服 → 套餐页 → 详情 → 支付的转化路径
    if (pkg.price > 0 && pkg.package_key) {
      setSelectedPkg(pkg);
      setPayOpen(true);
    } else {
      navigate('/packages');
    }
  };

  return (
    <>
      <div className="space-y-3">
        {highlight_reason && (
          <p className="text-sm text-muted-foreground">「{highlight_reason}」</p>
        )}
        {packages.map((pkg, index) => (
          <div 
            key={pkg.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:shadow-md transition-all cursor-pointer"
            onClick={() => handleClick(pkg)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-foreground">{pkg.package_name}</span>
                  <span className="text-lg font-bold text-primary">¥{pkg.price}</span>
                  {index === packages.length - 1 && packages.length > 1 && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">推荐</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {pkg.ai_quota}点对话额度 · {pkg.duration_days}天有效期
                </p>
              </div>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPkg && (
        <UnifiedPayDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          packageInfo={{
            key: selectedPkg.package_key,
            name: selectedPkg.package_name,
            price: selectedPkg.price,
            quota: selectedPkg.ai_quota,
          }}
          onSuccess={() => {
            setPayOpen(false);
            navigate('/settings?tab=account');
          }}
        />
      )}
    </>
  );
};
