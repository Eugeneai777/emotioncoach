import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Ticket, Users, Gem, Handshake, Calendar, Lightbulb } from "lucide-react";

export function ConversionGuide() {
  const stages = [
    {
      icon: <Ticket className="w-4 h-4" />,
      emoji: "🎟️",
      name: "兑换体验",
      color: "text-blue-600 bg-blue-100",
      definition: "用户通过你的兑换码/推广链接注册，开始免费体验21天训练营",
      metric: "兑换人数",
      action: "多渠道分享推广码，扩大触达面"
    },
    {
      icon: <Users className="w-4 h-4" />,
      emoji: "👥",
      name: "加入群聊",
      color: "text-orange-600 bg-orange-100",
      definition: "用户扫码加入你的学员群，建立私域连接",
      metric: "入群率",
      action: "注册后24小时内私信提醒加群"
    },
    {
      icon: <Gem className="w-4 h-4" />,
      emoji: "💎",
      name: "购买365",
      color: "text-green-600 bg-green-100",
      definition: "用户升级为365会员，解锁全部功能和1000次AI对话",
      metric: "购买转化率",
      action: "训练营Day7/14/21关键节点引导转化"
    },
    {
      icon: <Handshake className="w-4 h-4" />,
      emoji: "🤝",
      name: "成为合伙人",
      color: "text-purple-600 bg-purple-100",
      definition: "365会员进一步升级为有劲合伙人，开始自己推广",
      metric: "合伙人转化率",
      action: "毕业时分享收益机会，邀请加入"
    }
  ];

  const timeline = [
    { day: "Day 0", event: "兑换注册", note: "立即", highlight: false },
    { day: "Day 1-3", event: "加入学员群", note: "黄金72小时", highlight: true },
    { day: "Day 7", event: "第一个里程碑", note: "首次转化窗口", highlight: true },
    { day: "Day 14", event: "第二个里程碑", note: "中期转化窗口", highlight: true },
    { day: "Day 21", event: "训练营毕业", note: "最佳转化时机", highlight: true },
    { day: "Day 22+", event: "持续跟进", note: "长尾转化", highlight: false }
  ];

  const tips = {
    highPriority: [
      { trigger: "注册后48小时未加群", action: "私信提醒，发送群二维码" },
      { trigger: "Day 5-7 打卡活跃但未购买", action: "强调365会员的额外价值" },
      { trigger: "Day 21 毕业但未转化", action: "发送毕业祝贺 + 限时优惠" }
    ],
    bestTiming: [
      "Day 7 里程碑达成后",
      "Day 14 里程碑达成后",
      "Day 21 训练营毕业时",
      "用户主动咨询产品问题时"
    ]
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          转化流程指南
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible defaultValue="stages" className="w-full">
          {/* 四阶段转化流程 */}
          <AccordionItem value="stages">
            <AccordionTrigger className="text-sm font-medium py-3">
              📊 四阶段转化流程
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {stages.map((stage, idx) => (
                  <div key={idx} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg ${stage.color}`}>
                      {stage.emoji}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">阶段{idx + 1}: {stage.name}</span>
                        <Badge variant="outline" className="text-xs">{stage.metric}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{stage.definition}</p>
                      <p className="text-xs">
                        <span className="font-medium text-orange-600">💡 行动建议：</span>
                        {stage.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 转化周期时间线 */}
          <AccordionItem value="timeline">
            <AccordionTrigger className="text-sm font-medium py-3">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                转化周期时间线
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="relative pl-6 space-y-0">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative pb-4 last:pb-0">
                    {/* 连接线 */}
                    {idx < timeline.length - 1 && (
                      <div className="absolute left-[-16px] top-3 w-0.5 h-full bg-muted-foreground/20" />
                    )}
                    {/* 圆点 */}
                    <div className={`absolute left-[-20px] top-1 w-2 h-2 rounded-full ${
                      item.highlight ? 'bg-orange-500' : 'bg-muted-foreground/40'
                    }`} />
                    <div className="flex items-baseline gap-3">
                      <span className={`text-sm font-medium min-w-[60px] ${
                        item.highlight ? 'text-orange-600' : 'text-muted-foreground'
                      }`}>
                        {item.day}
                      </span>
                      <div>
                        <span className="text-sm">{item.event}</span>
                        <span className={`ml-2 text-xs ${
                          item.highlight ? 'text-orange-500' : 'text-muted-foreground'
                        }`}>
                          ({item.note})
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 关键节点提示 */}
          <AccordionItem value="tips">
            <AccordionTrigger className="text-sm font-medium py-3">
              🎯 关键转化节点提示
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* 高优先级跟进场景 */}
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">🔴 高优先级跟进场景</p>
                <div className="space-y-2">
                  {tips.highPriority.map((tip, idx) => (
                    <div key={idx} className="flex gap-2 text-xs p-2 rounded bg-red-50">
                      <span className="text-muted-foreground shrink-0">{tip.trigger}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-medium">{tip.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 最佳转化时机 */}
              <div>
                <p className="text-xs font-medium text-green-600 mb-2">🟢 最佳转化时机</p>
                <div className="flex flex-wrap gap-1.5">
                  {tips.bestTiming.map((timing, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs bg-green-50 border-green-200">
                      {timing}
                    </Badge>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
