import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Gift, CreditCard, Check, Loader2, AlertCircle, Sparkles, BarChart3, Package } from "lucide-react";
import type { PartnerProductType } from "@/utils/partnerQRUtils";

// 体验包选项定义
const EXPERIENCE_PACKAGES = [
  { key: 'basic', label: 'AI对话点数', description: '50点' },
  { key: 'emotion_health_assessment', label: '情绪健康测评', description: '专业测评' },
  { key: 'scl90_report', label: 'SCL-90心理测评', description: '心理健康筛查' },
] as const;

const DEFAULT_PACKAGES = ['basic', 'emotion_health_assessment', 'scl90_report'];

interface EntryTypeSelectorProps {
  partnerId: string;
  currentEntryType?: string;
  currentProductType?: PartnerProductType;
  prepurchaseCount?: number;
  currentSelectedPackages?: string[] | null;
  onUpdate?: () => void;
}

export function EntryTypeSelector({ 
  partnerId, 
  currentEntryType = 'free',
  currentProductType = 'trial_member',
  prepurchaseCount = 0,
  currentSelectedPackages,
  onUpdate 
}: EntryTypeSelectorProps) {
  const [entryType, setEntryType] = useState<'free' | 'paid'>(currentEntryType as 'free' | 'paid');
  const [productType, setProductType] = useState<PartnerProductType>(currentProductType);
  const [selectedPackages, setSelectedPackages] = useState<string[]>(
    currentSelectedPackages || DEFAULT_PACKAGES
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEntryType(currentEntryType as 'free' | 'paid');
    setProductType(currentProductType);
    setSelectedPackages(currentSelectedPackages || DEFAULT_PACKAGES);
    setHasChanges(false);
  }, [currentEntryType, currentProductType, currentSelectedPackages]);

  const checkHasChanges = (
    newEntryType: string, 
    newProductType: string, 
    newSelectedPackages: string[]
  ) => {
    const currentPkgs = currentSelectedPackages || DEFAULT_PACKAGES;
    const pkgsChanged = 
      newSelectedPackages.length !== currentPkgs.length ||
      !newSelectedPackages.every(p => currentPkgs.includes(p));
    return newEntryType !== currentEntryType || 
           newProductType !== currentProductType || 
           pkgsChanged;
  };

  const handleSelectEntryType = (type: 'free' | 'paid') => {
    setEntryType(type);
    setHasChanges(checkHasChanges(type, productType, selectedPackages));
  };

  const handleSelectProductType = (type: PartnerProductType) => {
    setProductType(type);
    setHasChanges(checkHasChanges(entryType, type, selectedPackages));
  };

  const handleTogglePackage = (packageKey: string) => {
    const newPackages = selectedPackages.includes(packageKey)
      ? selectedPackages.filter(p => p !== packageKey)
      : [...selectedPackages, packageKey];
    setSelectedPackages(newPackages);
    setHasChanges(checkHasChanges(entryType, productType, newPackages));
  };

  const handleSelectAllPackages = (selectAll: boolean) => {
    const newPackages = selectAll ? [...DEFAULT_PACKAGES] : [];
    setSelectedPackages(newPackages);
    setHasChanges(checkHasChanges(entryType, productType, newPackages));
  };

  const isAllSelected = selectedPackages.length === EXPERIENCE_PACKAGES.length;

  const handleSave = async () => {
    if (productType === 'trial_member' && selectedPackages.length === 0) {
      toast.error("请至少选择一项体验包内容");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          default_entry_type: entryType,
          default_product_type: productType,
          default_entry_price: productType === 'wealth_assessment' ? 9.9 : (entryType === 'paid' ? 9.9 : 0),
          default_quota_amount: productType === 'trial_member' ? 50 : 0,
          selected_experience_packages: productType === 'trial_member' ? selectedPackages : null,
          updated_at: new Date().toISOString()
        } as Record<string, unknown>)
        .eq('id', partnerId);

      if (error) throw error;

      toast.success("推广设置已保存");
      setHasChanges(false);
      onUpdate?.();
    } catch (error) {
      console.error("Save entry type error:", error);
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-orange-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gift className="w-5 h-5 text-orange-500" />
          推广入口设置
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 预购额度提示 */}
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          prepurchaseCount > 0 
            ? 'bg-teal-50 border border-teal-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}>
          {prepurchaseCount > 0 ? (
            <>
              <Check className="w-4 h-4 text-teal-600" />
              <span className="text-sm text-teal-700">
                剩余 <span className="font-bold">{prepurchaseCount}</span> 个体验名额可分发
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                体验名额已用完，请联系管理员购买
              </span>
            </>
          )}
        </div>

        {/* Step 1: 选择推广产品 */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">1</span>
            选择推广产品
          </div>
          <Tabs value={productType} onValueChange={(v) => handleSelectProductType(v as PartnerProductType)}>
            <TabsList className="grid w-full grid-cols-2 h-auto p-1">
              <TabsTrigger 
                value="trial_member" 
                className="data-[state=active]:bg-teal-500 data-[state=active]:text-white py-2"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                尝鲜会员
              </TabsTrigger>
              <TabsTrigger 
                value="wealth_assessment"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white py-2"
              >
                <BarChart3 className="w-4 h-4 mr-1.5" />
                财富测评
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trial_member" className="mt-3">
              <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-teal-800">💎 尝鲜会员</span>
                  <span className="text-xs text-teal-600">价值 ¥9.9</span>
                </div>
                <ul className="text-xs text-teal-700 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> 50点AI对话额度
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> 5位AI教练体验
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> 情绪工具 + 社区
                  </li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="wealth_assessment" className="mt-3">
              <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-purple-800">📊 财富卡点测评</span>
                  <span className="text-xs text-purple-600">价值 ¥9.9</span>
                </div>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> 30道财富场景诊断
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> 三层深度分析
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3 h-3" /> AI个性化突破路径
                  </li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Step 2: 入口方式（仅尝鲜会员有此选项） */}
        {productType === 'trial_member' && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">2</span>
              入口方式
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Free Entry */}
              <div
                onClick={() => handleSelectEntryType('free')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  entryType === 'free'
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Gift className={`w-4 h-4 ${entryType === 'free' ? 'text-teal-600' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${entryType === 'free' ? 'text-teal-700' : 'text-gray-600'}`}>
                    免费领取
                  </span>
                  {entryType === 'free' && (
                    <Check className="w-3 h-3 text-teal-600 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  扫码直接获得体验套餐
                </p>
              </div>

              {/* Paid Entry */}
              <div
                onClick={() => handleSelectEntryType('paid')}
                className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  entryType === 'paid'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className={`w-4 h-4 ${entryType === 'paid' ? 'text-orange-600' : 'text-gray-400'}`} />
                  <span className={`font-medium text-sm ${entryType === 'paid' ? 'text-orange-700' : 'text-gray-600'}`}>
                    付费 ¥9.9
                  </span>
                  {entryType === 'paid' && (
                    <Check className="w-3 h-3 text-orange-600 ml-auto" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  支付后获得体验套餐
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 体验包内容（仅尝鲜会员有此选项） */}
        {productType === 'trial_member' && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold">3</span>
              体验包内容
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
              {/* 全选复选框 */}
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAllPackages(checked === true)}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  全选
                </label>
              </div>
              
              {/* 体验包列表 */}
              {EXPERIENCE_PACKAGES.map((pkg) => (
                <div key={pkg.key} className="flex items-center gap-2">
                  <Checkbox
                    id={pkg.key}
                    checked={selectedPackages.includes(pkg.key)}
                    onCheckedChange={() => handleTogglePackage(pkg.key)}
                  />
                  <label htmlFor={pkg.key} className="flex-1 cursor-pointer">
                    <span className="text-sm font-medium">{pkg.label}</span>
                    <span className="text-xs text-muted-foreground ml-1">({pkg.description})</span>
                  </label>
                </div>
              ))}

              {selectedPackages.length === 0 && (
                <p className="text-xs text-red-500 mt-2">⚠️ 请至少选择一项体验包内容</p>
              )}
            </div>
          </div>
        )}

        {/* 财富测评说明 */}
        {productType === 'wealth_assessment' && (
          <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded-lg">
            <p>💡 财富测评固定价格 ¥9.9，用户扫码后需付费完成测评</p>
            <p className="mt-1">📈 测评完成后用户进入财富觉醒训练营转化漏斗</p>
          </div>
        )}

        {/* Save button */}
        {hasChanges && selectedPackages.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              '保存设置'
            )}
          </Button>
        )}

        {/* Hint */}
        <div className="text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg space-y-1">
          <p>💡 <strong>设置影响固定推广链接</strong></p>
          <p>🔗 用户通过推广链接注册后将永久绑定为你的学员</p>
          <p>💰 学员后续所有消费你都能获得佣金分成</p>
        </div>
      </CardContent>
    </Card>
  );
}
