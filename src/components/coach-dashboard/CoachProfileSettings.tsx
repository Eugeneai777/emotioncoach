import { useState } from "react";
import { useUpdateCoachProfile } from "@/hooks/useCoachDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Save, 
  Camera,
  Star,
  Shield,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface CoachProfileSettingsProps {
  coach: Record<string, unknown> & {
    id: string;
    name: string;
    title?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    specialties?: string[] | null;
    experience_years?: number | null;
    hourly_rate?: number | null;
    is_verified?: boolean | null;
    is_accepting_new?: boolean | null;
    is_active?: boolean | null;
    rating?: number | null;
    total_reviews?: number | null;
    badge_type?: string | null;
  };
}

export function CoachProfileSettings({ coach }: CoachProfileSettingsProps) {
  const [formData, setFormData] = useState({
    name: coach.name || '',
    title: coach.title || '',
    bio: coach.bio || '',
    specialties: coach.specialties?.join(', ') || '',
    experience_years: coach.experience_years?.toString() || '',
    hourly_rate: coach.hourly_rate?.toString() || '',
    is_accepting_new: coach.is_accepting_new ?? true,
  });

  const updateProfile = useUpdateCoachProfile();

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        coachId: coach.id,
        updates: {
          name: formData.name,
          title: formData.title,
          bio: formData.bio,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean),
          experience_years: parseInt(formData.experience_years) || null,
          hourly_rate: parseFloat(formData.hourly_rate) || null,
          is_accepting_new: formData.is_accepting_new,
        },
      });
      toast.success("个人信息已更新");
    } catch (error) {
      toast.error("保存失败，请重试");
    }
  };

  const getBadgeInfo = (badgeType: string | null) => {
    switch (badgeType) {
      case 'gold':
        return { label: '金牌教练', color: 'bg-yellow-500' };
      case 'preferred':
        return { label: '优选教练', color: 'bg-blue-500' };
      case 'certified':
        return { label: '认证教练', color: 'bg-green-500' };
      default:
        return { label: '新人教练', color: 'bg-gray-500' };
    }
  };

  const badgeInfo = getBadgeInfo(coach.badge_type);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">个人设置</h1>
        <p className="text-muted-foreground">管理您的教练资料</p>
      </div>

      {/* Profile Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            账户状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-16 w-16">
                <AvatarImage src={coach.avatar_url || ''} />
                <AvatarFallback className="text-xl">{coach.name?.charAt(0) || 'C'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{coach.name}</p>
                <p className="text-sm text-muted-foreground">{coach.title}</p>
              </div>
            </div>
            
            <Separator orientation="vertical" className="h-12 hidden md:block" />
            
            <div className="flex flex-wrap gap-2">
              <Badge className={badgeInfo.color}>
                {badgeInfo.label}
              </Badge>
              {coach.is_verified ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  已认证
                </Badge>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  待认证
                </Badge>
              )}
              {coach.is_active ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  在线
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600">
                  离线
                </Badge>
              )}
            </div>

            <Separator orientation="vertical" className="h-12 hidden md:block" />

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{coach.rating?.toFixed(1) || '5.0'}</span>
              </div>
              <span className="text-muted-foreground">
                {coach.total_reviews || 0} 条评价
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>姓名</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="您的姓名"
              />
            </div>
            <div>
              <Label>职称</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="如：心理咨询师、家庭教育指导师"
              />
            </div>
          </div>

          <div>
            <Label>个人简介</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="介绍您的专业背景、咨询理念..."
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>专长领域</Label>
              <Input
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                placeholder="用逗号分隔，如：情绪管理, 亲子沟通, 职场压力"
              />
              <p className="text-xs text-muted-foreground mt-1">多个专长用逗号分隔</p>
            </div>
            <div>
              <Label>从业年限</Label>
              <Input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                placeholder="5"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>参考时薪（元/小时）</Label>
              <Input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="200"
              />
              <p className="text-xs text-muted-foreground mt-1">实际定价以服务项目为准</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>接单设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">接受新预约</p>
              <p className="text-sm text-muted-foreground">
                关闭后，用户将无法预约您的咨询服务
              </p>
            </div>
            <Switch
              checked={formData.is_accepting_new}
              onCheckedChange={(checked) => setFormData({ ...formData, is_accepting_new: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateProfile.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateProfile.isPending ? "保存中..." : "保存更改"}
        </Button>
      </div>
    </div>
  );
}
