import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

const STYLE_CATEGORIES = [
  {
    name: "基础风格",
    styles: [
      { key: "warm", label: "🌸 温暖治愈", desc: "柔和温馨的插画风格" },
      { key: "minimal", label: "🌿 简约清新", desc: "干净简洁的现代设计" },
      { key: "anime", label: "🎀 日系插画", desc: "可爱的动漫插画风格" },
      { key: "watercolor", label: "🎨 水彩画风", desc: "艺术水彩画效果" },
    ]
  },
  {
    name: "自然风光",
    styles: [
      { key: "nature", label: "🏔️ 自然风光", desc: "美丽的自然风景" },
      { key: "sunset", label: "🌅 日落暖阳", desc: "金色夕阳温暖光晕" },
      { key: "ocean", label: "🌊 海洋蓝调", desc: "宁静海滩蓝色调" },
      { key: "forest", label: "🍃 森林秘境", desc: "神秘森林阳光斑驳" },
      { key: "countryside", label: "🏡 田园风光", desc: "宁静乡村田野" },
    ]
  },
  {
    name: "艺术风格",
    styles: [
      { key: "geometric", label: "🔷 几何渐变", desc: "现代几何图形设计" },
      { key: "vintage", label: "📷 复古胶片", desc: "怀旧的胶片摄影风格" },
      { key: "oilpainting", label: "🎭 油画艺术", desc: "经典油画印象派" },
      { key: "chinese", label: "🎐 中国风", desc: "水墨画中式古典" },
      { key: "popart", label: "🎪 波普艺术", desc: "鲜艳色彩波普风" },
    ]
  },
  {
    name: "氛围主题",
    styles: [
      { key: "cosmic", label: "✨ 梦幻星空", desc: "梦幻的星空宇宙" },
      { key: "moonlight", label: "🌙 月光剪影", desc: "宁静夜色月光" },
      { key: "city", label: "🏙️ 城市剪影", desc: "都市天际线霓虹" },
      { key: "cafe", label: "☕ 咖啡时光", desc: "温馨咖啡馆午后" },
      { key: "floral", label: "🌺 花卉主题", desc: "精美花朵花园" },
      { key: "rainbow", label: "🌈 彩虹糖果", desc: "明亮彩虹童趣" },
    ]
  },
];

interface ImageStyleSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ImageStyleSelector = ({ value, onChange }: ImageStyleSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">选择头图风格</Label>
      <ScrollArea className="h-[280px] pr-4">
        <RadioGroup value={value} onValueChange={onChange} className="space-y-4">
          {STYLE_CATEGORIES.map((category) => (
            <div key={category.name} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">{category.name}</h4>
              <div className="grid grid-cols-2 gap-2">
                {category.styles.map((style) => (
                  <div
                    key={style.key}
                    className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      value === style.key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => onChange(style.key)}
                  >
                    <RadioGroupItem value={style.key} id={style.key} className="mt-0.5" />
                    <Label htmlFor={style.key} className="cursor-pointer flex-1">
                      <span className="font-medium text-sm">{style.label}</span>
                      <span className="text-xs text-muted-foreground block">{style.desc}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </RadioGroup>
      </ScrollArea>
    </div>
  );
};

export { STYLE_CATEGORIES };
