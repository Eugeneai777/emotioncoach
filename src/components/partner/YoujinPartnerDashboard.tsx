import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Partner } from "@/hooks/usePartner";
import { Upload, ImageIcon, Palette, Users, TrendingUp, Wallet, ChevronDown, ChevronUp, Bell, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EntryTypeSelector } from "./EntryTypeSelector";
import { FixedPromoLinkCard } from "./FixedPromoLinkCard";
import { StudentList } from "./StudentList";
import { ConversionFunnel } from "./ConversionFunnel";
import { ConversionAlerts } from "./ConversionAlerts";
import { ConversionGuide } from "./ConversionGuide";
import { PartnerAnalytics } from "./PartnerAnalytics";
import { CommissionHistory } from "./CommissionHistory";
import { WithdrawalForm } from "./WithdrawalForm";
import { PartnerOverviewCard } from "./PartnerOverviewCard";
import { PartnerQuickActions } from "./PartnerQuickActions";
import { CompactConversionFunnel } from "./CompactConversionFunnel";
import { PartnerUpgradeCard } from "./PartnerUpgradeCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YoujinPartnerDashboardProps {
  partner: Partner;
}

export function YoujinPartnerDashboard({ partner }: YoujinPartnerDashboardProps) {
  const navigate = useNavigate();
  const [groupQrUrl, setGroupQrUrl] = useState(partner.wecom_group_qrcode_url || '');
  const [groupName, setGroupName] = useState(partner.wecom_group_name || '有劲学员群');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('promote');
  const [groupExpanded, setGroupExpanded] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadQR = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${partner.id}_group_qr.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('partner-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-assets')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('partners')
        .update({ wecom_group_qrcode_url: publicUrl })
        .eq('id', partner.id);

      if (updateError) throw updateError;

      setGroupQrUrl(publicUrl);
      toast.success("群二维码上传成功！");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveGroupName = async () => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ wecom_group_name: groupName })
        .eq('id', partner.id);

      if (error) throw error;
      toast.success("群名称已保存");
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="space-y-4">
      {/* 顶部概览卡片 */}
      <PartnerOverviewCard 
        partner={partner} 
        onWithdraw={() => setActiveTab('earnings')}
      />

      {/* 转化漏斗预览 */}
      <CompactConversionFunnel 
        partnerId={partner.id} 
        onClick={() => setActiveTab('students')}
      />

      {/* 升级提示 - 仅L1/L2显示 */}
      {partner.partner_level !== 'L3' && (
        <PartnerUpgradeCard currentLevel={partner.partner_level} />
      )}

      {/* 快捷操作 */}
      <PartnerQuickActions onTabChange={handleTabChange} />

      {/* 主要功能区 - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-white/80 backdrop-blur-sm">
          <ResponsiveTabsTrigger 
            value="promote" 
            label="推广"
            icon={<Palette className="w-4 h-4" />} 
          />
          <ResponsiveTabsTrigger 
            value="students" 
            label="学员"
            icon={<Users className="w-4 h-4" />}
          />
          <ResponsiveTabsTrigger 
            value="earnings" 
            label="收益"
            icon={<Wallet className="w-4 h-4" />}
          />
        </TabsList>

        {/* 推广Tab */}
        <TabsContent value="promote" className="space-y-4 mt-4">
          {/* 推广指南 - 放在最上面 */}
          <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-teal-800">💡 如何推广</h4>
              <Button 
                variant="link" 
                size="sm" 
                className="text-teal-600 p-0 h-auto"
                onClick={() => navigate('/partner/promo-guide')}
              >
                了解推广模式 →
              </Button>
            </div>
            <p className="text-sm text-teal-700">
              设置入口类型后，你在社区分享、训练营打卡或情绪按钮分享时，生成的二维码会自动使用你的设置。用户扫码后即可按你选择的方式获得对话额度，并自动成为你的学员。
            </p>
          </div>
          
          {/* 入口类型设置 */}
          <EntryTypeSelector 
            partnerId={partner.id} 
            currentEntryType={partner.default_entry_type || 'free'}
            prepurchaseCount={partner.prepurchase_count || 0}
            onUpdate={() => setRefreshKey(k => k + 1)}
          />
          
          {/* 推广链接 */}
          <FixedPromoLinkCard 
            key={refreshKey}
            partnerId={partner.id}
            entryType={(partner.default_entry_type || 'free') as 'free' | 'paid'}
            productType={(partner.default_product_type as 'trial_member' | 'wealth_assessment') || 'trial_member'}
          />
        </TabsContent>

        {/* 学员Tab */}
        <TabsContent value="students" className="space-y-4 mt-4">
          {/* 跟进提醒 */}
          <ConversionAlerts partnerId={partner.id} />
          
          {/* 详细漏斗 */}
          <ConversionFunnel partnerId={partner.id} />
          
          {/* 转化指南 */}
          <ConversionGuide />

          {/* 群管理 - 折叠区块 */}
          <Collapsible open={groupExpanded} onOpenChange={setGroupExpanded}>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      学员群管理
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {groupQrUrl && (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">已配置</span>
                      )}
                      {groupExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-4">
                  {/* 群二维码 */}
                  <div className="space-y-2">
                    <Label>群二维码</Label>
                    <div className="flex gap-3 items-start">
                      {groupQrUrl ? (
                        <div className="w-24 h-24 border rounded-lg overflow-hidden bg-white p-1.5">
                          <img src={groupQrUrl} alt="群二维码" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleUploadQR}
                          className="hidden"
                        />
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {uploading ? "上传中..." : groupQrUrl ? "更换" : "上传"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          上传微信/企业微信群二维码
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 群名称 */}
                  <div className="space-y-2">
                    <Label>群名称</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="输入群名称"
                        className="h-9"
                      />
                      <Button variant="outline" size="sm" onClick={handleSaveGroupName}>
                        保存
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
          
          {/* 学员列表 */}
          <StudentList partnerId={partner.id} />
        </TabsContent>

        {/* 收益Tab */}
        <TabsContent value="earnings" className="space-y-4 mt-4">
          {/* 数据分析 */}
          <PartnerAnalytics partnerId={partner.id} />
          
          {/* 佣金明细 */}
          <CommissionHistory partnerId={partner.id} />
          
          {/* 提现申请 */}
          <WithdrawalForm partner={partner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
