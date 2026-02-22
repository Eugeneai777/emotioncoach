import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Partner, usePartner } from "@/hooks/usePartner";
import { Upload, ImageIcon, Palette, Users, TrendingUp, Wallet, ChevronDown, ChevronUp, Bell, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StudentList } from "./StudentList";
import { ConversionFunnel } from "./ConversionFunnel";
import { ConversionAlerts } from "./ConversionAlerts";
import { ConversionGuide } from "./ConversionGuide";
import { PromotionHub } from "./PromotionHub";
import { PartnerAnalytics } from "./PartnerAnalytics";
import { CommissionHistory } from "./CommissionHistory";
import { StoreCommissionProducts } from "./StoreCommissionProducts";
import { WithdrawalForm } from "./WithdrawalForm";
import { PartnerOverviewCard } from "./PartnerOverviewCard";
import { PartnerUpgradeCard } from "./PartnerUpgradeCard";
import { PartnerSelfRedeemCard } from "./PartnerSelfRedeemCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YoujinPartnerDashboardProps {
  partner: Partner;
}

export function YoujinPartnerDashboard({ partner }: YoujinPartnerDashboardProps) {
  const navigate = useNavigate();
  const { isExpired, daysUntilExpiry, needsRenewalReminder } = usePartner();
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
    <div className="space-y-3">
      {/* 过期横幅 */}
      {isExpired && (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-orange-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-red-800 text-sm">佣金权益已冻结</p>
                <p className="text-xs text-red-600 mt-0.5">
                  合伙人资格已过期，新订单不再产生佣金。续费后即可恢复。
                </p>
              </div>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-red-500 to-orange-500 text-white shrink-0"
                onClick={() => navigate('/partner/youjin-intro')}
              >
                立即续费
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 顶部概览卡片（含转化漏斗） */}
      <PartnerOverviewCard 
        partner={partner} 
        isExpired={isExpired}
        daysUntilExpiry={daysUntilExpiry}
        onWithdraw={() => setActiveTab('earnings')}
        onStudentsClick={() => setActiveTab('students')}
      />

      {/* 续费/升级提示 */}
      <PartnerUpgradeCard 
        currentLevel={partner.partner_level} 
        isExpired={isExpired}
        daysUntilExpiry={daysUntilExpiry}
      />

      {/* 主要功能区 - Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-11 bg-muted/50">
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
        <TabsContent value="promote" className="space-y-3 mt-3">
          {/* 自用兑换体验包 */}
          <PartnerSelfRedeemCard 
            partnerId={partner.id} 
            prepurchaseCount={partner.prepurchase_count || 0} 
          />
          
          {/* 推广中心（合并入口设置+链接+复制+二维码） */}
          <PromotionHub 
            partnerId={partner.id}
            currentEntryType={partner.default_entry_type || 'free'}
            prepurchaseCount={partner.prepurchase_count || 0}
            currentSelectedPackages={partner.selected_experience_packages}
            onUpdate={() => setRefreshKey(k => k + 1)}
          />
        </TabsContent>

        {/* 学员Tab */}
        <TabsContent value="students" className="space-y-3 mt-3">
          {/* 跟进提醒 */}
          <ConversionAlerts partnerId={partner.id} />
          
          {/* 学员列表 */}
          <StudentList partnerId={partner.id} />

          {/* 详细漏斗 */}
          <ConversionFunnel partnerId={partner.id} />

          {/* 工具与指南 - 折叠区块 */}
          <Collapsible open={groupExpanded} onOpenChange={setGroupExpanded}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/20 transition-colors py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      工具与指南
                    </CardTitle>
                    <div className="flex items-center gap-2">
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
                  {/* 转化指南 */}
                  <ConversionGuide />

                  {/* 群管理 */}
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-orange-500" />
                      学员群管理
                    </h4>
                    {/* 群二维码 */}
                    <div className="space-y-2">
                      <Label>群二维码</Label>
                      <div className="flex gap-3 items-start">
                        {groupQrUrl ? (
                          <div className="w-20 h-20 border rounded-lg overflow-hidden bg-white p-1">
                            <img src={groupQrUrl} alt="群二维码" loading="lazy" decoding="async" className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
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
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </TabsContent>

        {/* 收益Tab */}
        <TabsContent value="earnings" className="space-y-3 mt-3">
          {/* 数据分析 */}
          <PartnerAnalytics partnerId={partner.id} />
          
           {/* 分成商品 */}
          <StoreCommissionProducts partnerType="youjin" />
          
          {/* 佣金明细 */}
          <CommissionHistory partnerId={partner.id} />
          
          {/* 提现申请 */}
          <WithdrawalForm partner={partner} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
