import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, KeyRound } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("请输入有效的邮箱地址");
const passwordSchema = z.string().min(6, "密码至少需要6个字符");

export function AccountCredentials() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  
  // 邮箱设置
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  
  // 密码设置
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        // 检查用户是否有密码（通过 identities 判断）
        const hasEmailProvider = user.app_metadata?.providers?.includes('email') || 
                                  user.identities?.some(i => i.provider === 'email');
        setHasPassword(!!hasEmailProvider);
      }
    } catch (error) {
      console.error("Error loading user info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    setEmailError("");
    
    try {
      emailSchema.parse(newEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setEmailError(err.errors[0].message);
        return;
      }
    }

    setEmailSaving(true);
    try {
      // 直接更新邮箱，Supabase会自动检查唯一性
      // 直接更新邮箱，Supabase会自动检查唯一性
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        // 处理邮箱已存在的错误
        if (error.message.includes('already') || error.message.includes('exists') || error.message.includes('taken')) {
          throw new Error("该邮箱已被其他账号使用");
        }
        throw error;
      }

      setUserEmail(newEmail);
      toast({
        title: "邮箱已更新",
        description: "新邮箱已生效 ✉️",
      });
      setShowEmailDialog(false);
      setNewEmail("");
    } catch (error) {
      console.error("Error updating email:", error);
      setEmailError(error instanceof Error ? error.message : "更新失败，请稍后再试");
    } finally {
      setEmailSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError("");

    // 验证新密码
    try {
      passwordSchema.parse(newPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setPasswordError(err.errors[0].message);
        return;
      }
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("两次输入的密码不一致");
      return;
    }

    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: "密码已更新",
        description: "新密码已生效 🔐",
      });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setHasPassword(true);
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError(error instanceof Error ? error.message : "更新失败，请稍后再试");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleResetEmail = () => {
    setNewEmail("");
    setEmailError("");
    setShowEmailDialog(false);
  };

  const handleResetPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowPasswordDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          账号与密码
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          管理您的登录邮箱和密码
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 邮箱设置 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            登录邮箱
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="email"
              value={userEmail || "未设置"}
              readOnly
              className="bg-muted/50 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailDialog(true)}
            >
              {userEmail ? "更换" : "设置"}
            </Button>
          </div>
          {userEmail && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              邮箱已验证
            </p>
          )}
        </div>

        {/* 密码设置 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4" />
            登录密码
          </Label>
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value={hasPassword ? "••••••••" : ""}
              readOnly
              placeholder={hasPassword ? "" : "未设置密码"}
              className="bg-muted/50 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordDialog(true)}
            >
              {hasPassword ? "修改" : "设置"}
            </Button>
          </div>
          {!hasPassword && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700">
                您当前使用微信登录，设置密码后可使用邮箱密码登录
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 邮箱修改弹窗 */}
        <Dialog open={showEmailDialog} onOpenChange={(open) => !open && handleResetEmail()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                {userEmail ? "更换邮箱" : "设置邮箱"}
              </DialogTitle>
              <DialogDescription>
                {userEmail 
                  ? "请输入新的邮箱地址" 
                  : "设置邮箱后可使用邮箱密码登录"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {userEmail && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">当前邮箱</Label>
                  <Input value={userEmail} readOnly className="bg-muted/50" />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="new-email">新邮箱</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="请输入新邮箱地址"
                />
              </div>

              {emailError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{emailError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleResetEmail}>
                  取消
                </Button>
                <Button onClick={handleUpdateEmail} disabled={emailSaving || !newEmail}>
                  {emailSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  确认更新
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 密码修改弹窗 */}
        <Dialog open={showPasswordDialog} onOpenChange={(open) => !open && handleResetPassword()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {hasPassword ? "修改密码" : "设置密码"}
              </DialogTitle>
              <DialogDescription>
                {hasPassword 
                  ? "请输入新密码，密码至少需要6个字符" 
                  : "设置密码后可使用邮箱密码登录"
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">新密码</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码（至少6位）"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleResetPassword}>
                  取消
                </Button>
                <Button 
                  onClick={handleUpdatePassword} 
                  disabled={passwordSaving || !newPassword || !confirmPassword}
                >
                  {passwordSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {hasPassword ? "更新密码" : "设置密码"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
