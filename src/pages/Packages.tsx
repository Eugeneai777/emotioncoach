import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PurchaseHistory } from "@/components/PurchaseHistory";
import { AccountBalance } from "@/components/AccountBalance";
import { toast } from "sonner";

const packages = [
  {
    id: 'free',
    name: '免费体验',
    quota: 50,
    price: 0,
    duration: '永久',
    features: ['50次对话', '基础情绪记录', '简报生成', '基础数据分析']
  },
  {
    id: 'monthly',
    name: '月度套餐',
    quota: 300,
    price: 29,
    duration: '30天',
    features: ['300次对话', '高级情绪分析', '导出功能', '标签管理', '目标设定']
  },
  {
    id: 'youjin365',
    name: '有劲365',
    quota: 1500,
    price: 99,
    duration: '365天',
    features: ['1500次对话', '全部功能', '专属客服', '数据导出', '高级分析', '优先支持']
  }
];

export default function Packages() {
  const handlePurchase = (pkg: typeof packages[0]) => {
    toast.info("支付功能开发中", {
      description: "请联系管理员进行充值操作"
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">选择适合您的套餐</h1>
          <p className="text-muted-foreground">根据您的使用需求，选择最合适的对话次数套餐</p>
        </div>

        <div className="flex justify-center">
          <AccountBalance />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={pkg.id === 'monthly' ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>{pkg.name}</CardTitle>
                <CardDescription>{pkg.duration}有效期</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-bold">
                  {pkg.price === 0 ? '免费' : `¥${pkg.price}`}
                </div>
                <div className="text-muted-foreground">
                  {pkg.quota} 次对话
                </div>
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handlePurchase(pkg)}
                  disabled={pkg.price === 0}
                  variant={pkg.id === 'monthly' ? 'default' : 'outline'}
                >
                  {pkg.price === 0 ? '当前套餐' : '立即购买'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <PurchaseHistory />
      </div>
    </div>
  );
}
