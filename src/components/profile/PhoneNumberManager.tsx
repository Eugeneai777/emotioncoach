import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone, Check, Pencil, X } from "lucide-react";

const countryCodes = [
  { code: '+86', country: '中国' },
  { code: '+852', country: '中国香港' },
  { code: '+853', country: '中国澳门' },
  { code: '+886', country: '中国台湾' },
  { code: '+1', country: '美国/加拿大' },
  { code: '+44', country: '英国' },
  { code: '+81', country: '日本' },
  { code: '+82', country: '韩国' },
  { code: '+65', country: '新加坡' },
  { code: '+60', country: '马来西亚' },
  { code: '+61', country: '澳大利亚' },
  { code: '+64', country: '新西兰' },
  { code: '+49', country: '德国' },
  { code: '+33', country: '法国' },
];

export function PhoneNumberManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+86");
  const [originalPhone, setOriginalPhone] = useState("");
  const [originalCountryCode, setOriginalCountryCode] = useState("+86");

  useEffect(() => {
    loadPhoneNumber();
  }, []);

  const loadPhoneNumber = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("phone, phone_country_code")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPhone(data.phone || "");
        setCountryCode(data.phone_country_code || "+86");
        setOriginalPhone(data.phone || "");
        setOriginalCountryCode(data.phone_country_code || "+86");
      }
    } catch (error) {
      console.error("Error loading phone:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 验证手机号格式（基础验证）
      if (phone && !/^\d{5,15}$/.test(phone)) {
        toast({
          title: "手机号格式错误",
          description: "请输入有效的手机号码",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          phone: phone.trim() || null,
          phone_country_code: countryCode,
        })
        .eq("id", user.id);

      if (error) throw error;

      setOriginalPhone(phone);
      setOriginalCountryCode(countryCode);
      setIsEditing(false);

      toast({
        title: "保存成功",
        description: phone ? "手机号已更新" : "手机号已移除",
      });
    } catch (error) {
      console.error("Error saving phone:", error);
      toast({
        title: "保存失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setPhone(originalPhone);
    setCountryCode(originalCountryCode);
    setIsEditing(false);
  };

  const formatDisplayPhone = () => {
    if (!originalPhone) return "未设置";
    return `${originalCountryCode} ${originalPhone}`;
  };

  if (loading) {
    return (
      <Card className="border-border shadow-lg mt-4">
        <CardContent className="py-6">
          <div className="flex items-center justify-center text-muted-foreground">
            加载中...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border shadow-lg mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base md:text-lg text-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              手机号管理
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-muted-foreground mt-1">
              添加或修改你的手机号（可选）
            </CardDescription>
          </div>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-primary"
            >
              <Pencil className="h-4 w-4 mr-1" />
              {originalPhone ? "修改" : "添加"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs md:text-sm">手机号</Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-[120px] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {countryCodes.map((item) => (
                      <SelectItem key={item.code} value={item.code}>
                        {item.code} {item.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入手机号"
                  maxLength={15}
                  className="flex-1 text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                手机号仅用于账号安全，不会对外展示
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
                className="flex-1"
              >
                {saving ? (
                  "保存中..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    保存
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                size="sm"
              >
                <X className="h-4 w-4 mr-1" />
                取消
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {formatDisplayPhone()}
                </p>
                {!originalPhone && (
                  <p className="text-xs text-muted-foreground">
                    添加手机号可提升账号安全性
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
