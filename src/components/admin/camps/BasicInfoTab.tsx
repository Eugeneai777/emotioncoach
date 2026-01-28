import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampFormData } from "./CampEditDialog";

interface BasicInfoTabProps {
  formData: CampFormData;
  updateFormData: (updates: Partial<CampFormData>) => void;
}

export function BasicInfoTab({ formData, updateFormData }: BasicInfoTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="camp_name">训练营名称</Label>
          <Input
            id="camp_name"
            value={formData.camp_name}
            onChange={(e) => updateFormData({ camp_name: e.target.value })}
            placeholder="21天情绪日记训练营"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">图标</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => updateFormData({ icon: e.target.value })}
            placeholder="📓"
            className="text-center text-2xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="camp_subtitle">副标题</Label>
        <Input
          id="camp_subtitle"
          value={formData.camp_subtitle}
          onChange={(e) => updateFormData({ camp_subtitle: e.target.value })}
          placeholder="系统化情绪管理训练"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_days">天数</Label>
          <Input
            id="duration_days"
            type="number"
            value={formData.duration_days}
            onChange={(e) =>
              updateFormData({ duration_days: parseInt(e.target.value) || 21 })
            }
            min={1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">分类</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => updateFormData({ category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="youjin">有劲训练营</SelectItem>
              <SelectItem value="bloom">绽放训练营</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_order">显示顺序</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            updateFormData({ display_order: parseInt(e.target.value) || 0 })
          }
          min={0}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="训练营详细描述..."
          rows={4}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div>
          <Label htmlFor="is_active">是否启用</Label>
          <p className="text-xs text-muted-foreground">
            禁用后前端不显示此训练营
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => updateFormData({ is_active: checked })}
        />
      </div>
    </div>
  );
}
