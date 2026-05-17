import PageHeader from "@/components/PageHeader";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { productCategories, brandGroups, type BrandId } from "@/config/productCategories";
import { ProductComparisonTable } from "@/components/ProductComparisonTable";
import { UnifiedPayDialog } from "@/components/UnifiedPayDialog";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DynamicOGMeta } from "@/components/common/DynamicOGMeta";
import { usePaymentCallback } from "@/hooks/usePaymentCallback";
import { isWeChatMiniProgram } from "@/utils/platform";

const PENDING_PAYMENT_PACKAGE_KEY = 'pending_payment_package';

interface PackageInfo {
  key: string;
  name: string;
  price: number;
  quota?: number;
}

type CategoryId = typeof productCategories[number]['id'];

export default function Packages() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isMiniProgram = isWeChatMiniProgram();

  const [activeBrand, setActiveBrand] = useState<BrandId>('youjin');
  const [activeTab, setActiveTab] = useState<CategoryId>('youjin-member');
  const [selectedPackage, setSelectedPackage] = useState<PackageInfo | null>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);

  const paymentResumeHandledRef = useRef(false);
  const reopenPayDialogTimerRef = useRef<number | null>(null);
  const paymentResume = searchParams.get('payment_resume') === '1';
  const paymentOpenId = searchParams.get('payment_openid');
  const paymentAuthError = searchParams.get('payment_auth_error') === '1';
  const miniProgramOpenId = searchParams.get('mp_openid');
  const miniProgramUnionId = searchParams.get('mp_unionid');

  const resumedOpenId = useMemo(() => {
    if (isMiniProgram) {
      try {
        return miniProgramOpenId || sessionStorage.getItem('wechat_mp_openid') || undefined;
      } catch {
        return miniProgramOpenId || undefined;
      }
    }

    return paymentOpenId || undefined;
  }, [isMiniProgram, miniProgramOpenId, paymentOpenId]);

  useEffect(() => {
    try {
      if (miniProgramOpenId) {
        sessionStorage.setItem('wechat_mp_openid', miniProgramOpenId);
        localStorage.setItem('cached_payment_openid_mp', miniProgramOpenId);
        sessionStorage.setItem('cached_payment_openid_mp', miniProgramOpenId);
      }

      if (miniProgramUnionId) {
        sessionStorage.setItem('wechat_mp_unionid', miniProgramUnionId);
      }
    } catch {
      // ignore
    }
  }, [miniProgramOpenId, miniProgramUnionId]);

  const { isPaymentCallback, orderNo: callbackOrderNo } = usePaymentCallback({
    onSuccess: (order) => {
      console.log('[Packages] Payment callback verified success, order:', order);
      setPayDialogOpen(false);
    },
    showToast: false,
    showConfetti: false,
    autoRedirect: false,
  });

  useEffect(() => {
    if (isPaymentCallback && callbackOrderNo) {
      console.log('[Packages] Payment callback detected, order:', callbackOrderNo);
    }
  }, [isPaymentCallback, callbackOrderNo]);

  useEffect(() => {
    return () => {
      if (reopenPayDialogTimerRef.current) {
        window.clearTimeout(reopenPayDialogTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (paymentResumeHandledRef.current) return;

    if (paymentAuthError) {
      paymentResumeHandledRef.current = true;
      toast.error("微信授权失败", { description: "请重新尝试支付" });
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      url.searchParams.delete('payment_auth_error');
      window.history.replaceState({}, '', url.toString());
      return;
    }

    if (paymentResume) {
      paymentResumeHandledRef.current = true;
      try {
        const cachedPackageStr = sessionStorage.getItem(PENDING_PAYMENT_PACKAGE_KEY);
        if (cachedPackageStr) {
          const cachedPackage = JSON.parse(cachedPackageStr) as PackageInfo;
          console.log('[Packages] Resuming payment for package:', cachedPackage.name);
          setSelectedPackage(cachedPackage);
          setPayDialogOpen(true);
          sessionStorage.removeItem(PENDING_PAYMENT_PACKAGE_KEY);
        }
      } catch (e) {
        console.error('[Packages] Failed to parse cached package:', e);
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('payment_resume');
      window.history.replaceState({}, '', url.toString());
    }
  }, [paymentResume, paymentAuthError]);

  const brandCategories = useMemo(
    () => productCategories.filter(c => c.brand === activeBrand),
    [activeBrand]
  );

  const handleBrandChange = (brand: BrandId) => {
    setActiveBrand(brand);
    const firstCategory = productCategories.find(c => c.brand === brand);
    if (firstCategory) {
      setActiveTab(firstCategory.id);
    }
  };

  const handlePurchase = (packageInfo: PackageInfo) => {
    if (isPaymentCallback) {
      console.log('[Packages] Payment callback in progress, skipping new dialog');
      return;
    }
    if (packageInfo.key === 'youjin-camps') {
      navigate('/camp-list');
      return;
    }
    if (!user) {
      toast.error("请先登录", { description: "登录后即可购买套餐" });
      navigate('/auth');
      return;
    }

    if (reopenPayDialogTimerRef.current) {
      window.clearTimeout(reopenPayDialogTimerRef.current);
      reopenPayDialogTimerRef.current = null;
    }

    if (payDialogOpen && selectedPackage?.key !== packageInfo.key) {
      setPayDialogOpen(false);
      reopenPayDialogTimerRef.current = window.setTimeout(() => {
        setSelectedPackage(packageInfo);
        setPayDialogOpen(true);
        reopenPayDialogTimerRef.current = null;
      }, 80);
      return;
    }

    setSelectedPackage(packageInfo);
    setPayDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    console.log('[Packages] Dialog payment success callback');
    setPayDialogOpen(false);
    setSelectedPackage(null);
  };

  const currentCategory = productCategories.find(c => c.id === activeTab);

  return (
    <>
      <DynamicOGMeta pageKey="packages" />
      <div
        className="h-screen overflow-y-auto overscroll-contain bg-background"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <PageHeader title="产品中心" />

        <div className="container max-w-2xl mx-auto px-3 py-3 space-y-3">
          {/* 有劲AI 365会员 详细介绍 */}
          <details className="group rounded-xl border border-orange-200/70 bg-gradient-to-br from-orange-50 via-white to-orange-50/40 shadow-sm overflow-hidden" open>
            <summary className="flex items-start gap-3 p-4 cursor-pointer list-none">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                劲
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-foreground leading-tight">
                  有劲AI 365会员
                </h2>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  AI 测评 + 教练对话 + 每日守护，一次开通 <span className="font-semibold text-orange-600">365 会员</span>，全年仅 ¥365（¥1/天）。
                  <span className="text-orange-600 ml-1 group-open:hidden">展开详情 ▾</span>
                  <span className="text-orange-600 ml-1 hidden group-open:inline">收起 ▴</span>
                </p>
              </div>
            </summary>

            <div className="px-4 pb-4 space-y-4 text-sm text-foreground/90 leading-relaxed border-t border-orange-100 pt-4">
              <section>
                <h3 className="font-semibold text-orange-700 mb-1">一、它是什么</h3>
                <p>
                  有劲AI 是面向<strong>所有需要"加点劲"人群</strong>的能量加油站——青少年、年轻职场人、宝妈、中年男女、银发父母都能找到对应的 AI 教练与训练营：把 AI 测评、AI 教练对话、AI 训练营、每日守护工具整合在一起，帮你把"扛不住的情绪、说不清的关系、看不清的财务、提不起劲的状态"一点点理顺。
                  <strong>365 会员</strong>是有劲AI 的<strong>主推年卡</strong>，一次开通，全家全年所有 AI 能力按点数畅用。
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-orange-700 mb-1">二、365会员 权益一览</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>价格：¥365 / 年</strong>（折合 ¥1/天）</li>
                  <li><strong>赠送 1000 AI 点数</strong>，有效期 365 天</li>
                  <li><strong>不限次解锁</strong>全部 AI 测评工具（情绪、关系、财富、亲子、SCL-90、SBTI 等）</li>
                  <li><strong>不限次进入</strong> AI 教练语音对话（情绪/财富/亲子/有劲生活）</li>
                  <li><strong>全部 7 天 / 21 天 AI 训练营</strong>畅打卡</li>
                  <li>每日守护：早安能量卡、深夜陪伴、情绪急救按钮</li>
                  <li>点数余额不清零，可续费叠加</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-orange-700 mb-1">三、点数怎么用</h3>
                <p>不同功能按点数计费，¥1 ≈ 2.7 点，1000 点足够大多数人一年使用：</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>AI 测评一次：约 5–10 点</li>
                  <li>AI 文字对话：每条约 1 点</li>
                  <li>AI 语音教练：每分钟约 2–3 点</li>
                  <li>训练营每日打卡：约 3–5 点</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-orange-700 mb-1">四、对比尝鲜会员</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-orange-100 rounded">
                    <thead className="bg-orange-100/60">
                      <tr>
                        <th className="text-left p-2">项目</th>
                        <th className="p-2">尝鲜会员</th>
                        <th className="p-2 text-orange-700">365会员（推荐）</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-100">
                      <tr><td className="p-2">价格</td><td className="text-center p-2">¥9.9</td><td className="text-center p-2 font-semibold">¥365</td></tr>
                      <tr><td className="p-2">点数</td><td className="text-center p-2">50 点</td><td className="text-center p-2 font-semibold">1000 点</td></tr>
                      <tr><td className="p-2">单价</td><td className="text-center p-2">¥0.20/点</td><td className="text-center p-2 font-semibold">¥0.37/点 + 全年权益</td></tr>
                      <tr><td className="p-2">购买限制</td><td className="text-center p-2 text-amber-600">限购 1 次</td><td className="text-center p-2">不限，可叠加</td></tr>
                      <tr><td className="p-2">有效期</td><td className="text-center p-2">365 天</td><td className="text-center p-2">365 天</td></tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-orange-700 mb-1">五、适合谁</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>长期被情绪、压力、关系内耗困扰，需要一个"随时能聊"的 AI 教练</li>
                  <li>想系统使用全部测评和训练营，而不是单次购买</li>
                  <li>把每天的状态管理当作长期投资，希望一年内随时可用</li>
                </ul>
              </section>

              <section className="bg-orange-100/40 rounded-lg p-3">
                <h3 className="font-semibold text-orange-700 mb-1">六、常见问题</h3>
                <p><strong>Q：到期会清零吗？</strong>会员到期后未使用的点数失效，建议到期前续费叠加。</p>
                <p className="mt-1"><strong>Q：可以退款吗？</strong>开通后即时生效，不支持退款，建议先购买 ¥9.9 尝鲜会员体验。</p>
                <p className="mt-1"><strong>Q：和单项工具购买相比？</strong>365 会员相当于全年免费使用所有工具，单买 3 个测评+1 个训练营即超过 ¥365。</p>
              </section>

              <p className="text-xs text-muted-foreground text-center pt-2 border-t border-orange-100">
                下方"产品对比"中选择 <span className="font-semibold text-orange-600">365会员</span> 即可立即开通
              </p>
            </div>
          </details>

          <div className="flex gap-1.5 p-1 bg-muted/50 rounded-lg">
            {brandGroups.map(brand => (
              <button
                key={brand.id}
                onClick={() => handleBrandChange(brand.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
                  activeBrand === brand.id
                    ? brand.id === 'youjin'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-purple-500 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{brand.emoji}</span>
                <span>{brand.name}</span>
              </button>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as CategoryId)} className="w-full">
            <TabsList className="w-full h-auto flex gap-1 p-1 bg-muted/50">
              {brandCategories.map(category => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex-1 gap-1 py-2 px-3 text-xs whitespace-nowrap"
                >
                  <span>{category.emoji}</span>
                  <span>{category.shortName}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-3 space-y-3">
              {currentCategory?.tagline && (
                <p className="text-center text-sm font-medium text-foreground">{currentCategory.tagline}</p>
              )}
              <ProductComparisonTable category={activeTab} onPurchase={handlePurchase} />
            </TabsContent>
          </Tabs>

          <p className="text-[10px] text-center text-muted-foreground pt-2 border-t">
            💡 购买后立即生效 · ⏰ 会员365天有效 · 🔒 隐私安全
          </p>
        </div>

        <UnifiedPayDialog
          open={payDialogOpen || isPaymentCallback}
          onOpenChange={(open) => {
            if (!isPaymentCallback) {
              setPayDialogOpen(open);
            }
          }}
          packageInfo={selectedPackage}
          onSuccess={handlePaymentSuccess}
          openId={resumedOpenId}
        />
      </div>
    </>
  );
}
