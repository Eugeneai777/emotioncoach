import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, CheckCircle2 } from "lucide-react";

interface Template {
  id: string;
  category: string;
  title: string;
  content: string;
}

const templates: Template[] = [
  {
    id: "1",
    category: "励志",
    title: "积极面对",
    content: "今天，我选择以积极的心态面对一切挑战。我相信自己的能力，感恩生活中的每一个美好瞬间。我充满能量，准备迎接新的一天！"
  },
  {
    id: "2",
    category: "励志",
    title: "主宰命运",
    content: "我是自己命运的主宰。今天，我将专注于我的目标，克服任何障碍。我值得拥有成功和幸福！"
  },
  {
    id: "3",
    category: "成长",
    title: "释放恐惧",
    content: "我释放所有的恐惧和怀疑，拥抱无限的可能性。今天，我将采取行动，向我的梦想迈进一步。"
  },
  {
    id: "4",
    category: "成长",
    title: "充满力量",
    content: "我的思想充满力量，我的身体充满活力。今天，我将传播正能量，影响周围的人。"
  },
  {
    id: "5",
    category: "感恩",
    title: "感恩当下",
    content: "我感恩我所拥有的一切，并对我将获得的一切保持开放。今天将是美好而富有成效的一天！"
  },
  {
    id: "6",
    category: "感恩",
    title: "珍惜拥有",
    content: "我珍惜生命中的每一刻，感激身边的每一个人。今天，我将带着感恩的心，创造更多美好。"
  },
  {
    id: "7",
    category: "健康",
    title: "活力满满",
    content: "我的身体充满活力，我的心灵充满平静。今天，我将照顾好自己，让每个细胞都充满能量。"
  },
  {
    id: "8",
    category: "健康",
    title: "身心和谐",
    content: "我倾听身体的声音，尊重它的节奏。今天，我将以爱和尊重对待自己，保持身心和谐。"
  }
];

interface TemplateSelectorProps {
  onTemplateSelect: (content: string) => void;
  onClose: () => void;
}

export const TemplateSelector = ({ onTemplateSelect, onClose }: TemplateSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  
  const categories = ["全部", ...Array.from(new Set(templates.map(t => t.category)))];
  
  const filteredTemplates = selectedCategory === "全部"
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">选择宣言模板</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Templates List */}
        <ScrollArea className="h-[500px] p-4">
          <div className="space-y-3">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onTemplateSelect(template.content);
                  onClose();
                }}
                className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {template.category}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {template.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {template.content}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
