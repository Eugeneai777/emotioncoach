import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePackages, getPackagePrice, getPackageQuota } from "@/hooks/usePackages";

// 套餐配置（静态部分）
const packageConfig = [
  {
    key: "basic",
    name: "尝鲜会员",
    duration: "365天",
    icon: Sparkles,
    limitPurchase: true,
    features: ["AI对话体验", "基础功能", "365天有效", "⚠️ 限购一次"],
  },
  {
    key: "member365",
    name: "365会员",
    duration: "365天",
    icon: Crown,
    popular: true,
    features: ["AI对话无限使用", "全部高级功能", "365天有效期"],
  },
];

export const PackageSelector = () => {
  const navigate = useNavigate();
  const { data: packages, isLoading } = usePackages();

  // 从数据库获取动态价格和配额
  const basicPrice = getPackagePrice(packages, 'basic', 9.9);
  const basicQuota = getPackageQuota(packages, 'basic', 50);
  const member365Price = getPackagePrice(packages, 'member365', 365);
  const member365Quota = getPackageQuota(packages, 'member365', 1000);

  // 合并动态数据
  const packagesWithData = packageConfig.map(pkg => ({
    ...pkg,
    price: pkg.key === 'basic' ? basicPrice : member365Price,
    quota: pkg.key === 'basic' ? basicQuota : member365Quota,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>套餐选择</CardTitle>
        <CardDescription>选择适合您的套餐方案</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {packagesWithData.map((pkg) => {
              const Icon = pkg.icon;
              return (
                <Card key={pkg.key} className={pkg.popular ? "border-primary" : ""}>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                      </div>
                      {pkg.popular && <Badge variant="default">推荐</Badge>}
                    </div>
                    <div>
                      <div className="text-3xl font-bold">¥{pkg.price}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {pkg.quota}次 / {pkg.duration}
                      </div>
                      {pkg.limitPurchase && (
                        <div className="text-xs text-amber-600 dark:text-amber-500 font-medium mt-1">⚠️ 限购一次</div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant="default" onClick={() => navigate("/packages")}>
                      立即购买
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
