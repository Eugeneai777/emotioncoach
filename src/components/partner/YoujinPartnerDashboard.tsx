import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { ResponsiveTabsTrigger } from "@/components/ui/responsive-tabs-trigger";
import { Partner } from "@/hooks/usePartner";
import { TrendingUp, Users, Wallet, Gift, Upload, ImageIcon, BarChart3 } from "lucide-react";
import { useState, useRef } from "react";
import { EntryTypeSelector } from "./EntryTypeSelector";
import { PartnerLevelProgress } from "./PartnerLevelProgress";
import { StudentList } from "./StudentList";
import { ConversionFunnel } from "./ConversionFunnel";
import { ConversionAlerts } from "./ConversionAlerts";
import { ConversionGuide } from "./ConversionGuide";
import { PartnerAnalytics } from "./PartnerAnalytics";
import { getPartnerLevel } from "@/config/partnerLevels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface YoujinPartnerDashboardProps {
  partner: Partner;
}

export function YoujinPartnerDashboard({ partner }: YoujinPartnerDashboardProps) {
  const [groupQrUrl, setGroupQrUrl] = useState(partner.wecom_group_qrcode_url || '');
  const [groupName, setGroupName] = useState(partner.wecom_group_name || '有劲学员群');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentLevel = getPartnerLevel('youjin', partner.partner_level);

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

  return (
    <div className="space-y-6">
      {/* 等级进度 */}
      <PartnerLevelProgress partner={partner} />

      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计收益</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{partner.total_earnings.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">可提现</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{partner.available_balance.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">直推用户</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.total_referrals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">预购数量</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.prepurchase_count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {partner.prepurchase_expires_at 
                ? `有效期至 ${new Date(partner.prepurchase_expires_at).toLocaleDateString()}`
                : '暂无预购'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 当前等级信息 */}
      {currentLevel && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{currentLevel.icon}</span>
              {currentLevel.name}
            </CardTitle>
            <CardDescription>{currentLevel.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                一级佣金 {(currentLevel.commissionRateL1 * 100).toFixed(0)}%
              </span>
              {currentLevel.commissionRateL2 > 0 && (
                <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-medium">
                  二级佣金 {(currentLevel.commissionRateL2 * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {currentLevel.benefits.map((benefit, idx) => (
                <div key={idx} className="text-sm text-muted-foreground">
                  • {benefit}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要功能区 - Tabs */}
      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <ResponsiveTabsTrigger value="tools" label="推广工具" shortLabel="推广" />
          <ResponsiveTabsTrigger value="group" label="群管理" shortLabel="群管" />
          <ResponsiveTabsTrigger value="students" label="我的学员" shortLabel="学员" />
          <ResponsiveTabsTrigger value="analytics" label="数据分析" shortLabel="分析" />
        </TabsList>

        <TabsContent value="tools" className="space-y-4">
          <EntryTypeSelector 
            partnerId={partner.id} 
            currentEntryType={partner.default_entry_type || 'free'}
          />
          
          <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
            <h4 className="font-medium text-teal-800 mb-2">💡 如何推广</h4>
            <p className="text-sm text-teal-700">
              设置入口类型后，你在社区分享帖子、训练营打卡或情绪按钮分享时，生成的二维码会自动使用你的设置。用户扫码后即可按你选择的方式（免费/付费）获得对话额度，并自动成为你的学员。
            </p>
          </div>
        </TabsContent>

        <TabsContent value="group" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                学员群管理
              </CardTitle>
              <CardDescription>上传群二维码，学员兑换后可扫码加群</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 群二维码 */}
              <div className="space-y-2">
                <Label>群二维码</Label>
                <div className="flex gap-3 items-start">
                  {groupQrUrl ? (
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-white p-2">
                      <img src={groupQrUrl} alt="群二维码" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/20">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
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
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? "上传中..." : groupQrUrl ? "更换二维码" : "上传二维码"}
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
                  />
                  <Button variant="outline" onClick={handleSaveGroupName}>
                    保存
                  </Button>
                </div>
              </div>

              {/* 提示 */}
              <div className="p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
                💡 学员通过你的兑换码注册后，会在训练营页面看到这个群二维码
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <ConversionFunnel partnerId={partner.id} />
          <ConversionAlerts partnerId={partner.id} />
          <ConversionGuide />
          <StudentList partnerId={partner.id} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PartnerAnalytics partnerId={partner.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}