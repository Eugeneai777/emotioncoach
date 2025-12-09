import { Card, CardContent } from "@/components/ui/card";

interface PosterTemplate {
  key: string;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  sellingPoints: string[];
}

const posterTemplates: PosterTemplate[] = [
  {
    key: 'emotion_button',
    name: '情绪按钮',
    emoji: '🆘',
    tagline: '即时情绪稳定系统',
    gradient: 'from-teal-400 to-cyan-500',
    sellingPoints: ['288条认知提醒', '9种情绪场景', '4阶段科学设计']
  },
  {
    key: 'emotion_coach',
    name: '情绪教练',
    emoji: '💚',
    tagline: 'AI深度陪伴梳理',
    gradient: 'from-green-400 to-emerald-500',
    sellingPoints: ['情绪四部曲', '生成专属简报', '追踪情绪成长']
  },
  {
    key: 'parent_coach',
    name: '亲子教练',
    emoji: '👪',
    tagline: '科学育儿方法论',
    gradient: 'from-purple-400 to-violet-500',
    sellingPoints: ['亲子沟通技巧', '家庭情绪管理', '青少年心理支持']
  },
  {
    key: 'communication_coach',
    name: '沟通教练',
    emoji: '💬',
    tagline: '高效表达与倾听',
    gradient: 'from-blue-400 to-indigo-500',
    sellingPoints: ['化解冲突', '建立边界', '提升影响力']
  },
  {
    key: 'training_camp',
    name: '训练营',
    emoji: '🏕️',
    tagline: '21天习惯养成',
    gradient: 'from-orange-400 to-red-500',
    sellingPoints: ['每日打卡', '社群陪伴', '视频学习']
  },
  {
    key: '365_member',
    name: '365会员',
    emoji: '👑',
    tagline: '全功能解锁一整年',
    gradient: 'from-amber-400 to-yellow-500',
    sellingPoints: ['1000点AI额度', '全部教练功能', '专属训练营']
  },
  {
    key: 'partner_recruit',
    name: '招募合伙人',
    emoji: '🤝',
    tagline: 'AI时代创业机会',
    gradient: 'from-rose-400 to-pink-500',
    sellingPoints: ['被动收入', '三级分销', '团队裂变']
  }
];

interface PosterTemplateGridProps {
  onSelect: (templateKey: string) => void;
}

export function PosterTemplateGrid({ onSelect }: PosterTemplateGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {posterTemplates.map((template) => (
        <Card 
          key={template.key}
          className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 overflow-hidden group"
          onClick={() => onSelect(template.key)}
        >
          <div className={`h-2 bg-gradient-to-r ${template.gradient}`} />
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{template.emoji}</span>
              <span className="font-medium text-sm">{template.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{template.tagline}</p>
            <div className="space-y-1">
              {template.sellingPoints.map((point, idx) => (
                <div key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  {point}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export { posterTemplates };
export type { PosterTemplate };
