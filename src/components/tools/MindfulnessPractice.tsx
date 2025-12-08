import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Play, BookOpen, Heart, Eye } from "lucide-react";

interface Practice {
  id: string;
  name: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  steps: string[];
  benefits: string[];
}

const practices: Practice[] = [
  {
    id: "body-scan",
    name: "身体扫描",
    description: "从头到脚感知身体的每个部位",
    duration: "10-15 分钟",
    icon: <Eye className="w-6 h-6" />,
    steps: [
      "找一个舒适的姿势躺下或坐着",
      "闭上眼睛，深呼吸几次",
      "将注意力集中在头顶",
      "慢慢向下扫描，感受每个身体部位",
      "注意任何感觉，不加评判",
      "感受脚趾，完成全身扫描"
    ],
    benefits: [
      "减轻身体紧张",
      "提高身体觉察力",
      "改善睡眠质量",
      "缓解慢性疼痛"
    ]
  },
  {
    id: "five-senses",
    name: "五感觉察",
    description: "用五种感官充分体验当下",
    duration: "5-10 分钟",
    icon: <Heart className="w-6 h-6" />,
    steps: [
      "找5样你能看到的东西",
      "找4样你能触摸到的东西",
      "找3样你能听到的声音",
      "找2样你能闻到的气味",
      "找1样你能尝到的味道",
      "全程保持专注和好奇"
    ],
    benefits: [
      "快速回到当下",
      "减轻焦虑",
      "提升感知能力",
      "培养感恩之心"
    ]
  },
  {
    id: "gratitude",
    name: "感恩冥想",
    description: "专注于生活中值得感恩的事物",
    duration: "5-10 分钟",
    icon: <BookOpen className="w-6 h-6" />,
    steps: [
      "找一个安静的地方坐下",
      "深呼吸，放松身心",
      "想起一件让你感恩的事",
      "详细回忆这件事的细节",
      "感受内心的温暖和感激",
      "默默说一声'谢谢'"
    ],
    benefits: [
      "提升幸福感",
      "改善人际关系",
      "增强积极情绪",
      "培养乐观心态"
    ]
  }
];

export const MindfulnessPractice = () => {
  const [selectedPractice, setSelectedPractice] = useState<Practice | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [reflection, setReflection] = useState("");

  const handleStartPractice = (practice: Practice) => {
    setSelectedPractice(practice);
    setShowSteps(true);
    setReflection("");
  };

  const handleComplete = () => {
    // TODO: 保存到数据库
    setShowSteps(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>选择正念练习</CardTitle>
          <CardDescription>每种练习都有独特的益处</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {practices.map((practice) => (
              <Card
                key={practice.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => !showSteps && handleStartPractice(practice)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      {practice.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{practice.name}</h3>
                        <span className="text-sm text-muted-foreground">{practice.duration}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {practice.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {practice.benefits.slice(0, 2).map((benefit, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPractice && showSteps && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedPractice.icon}
                {selectedPractice.name} - 练习步骤
              </CardTitle>
              <CardDescription>
                预计时长：{selectedPractice.duration}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {selectedPractice.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p>{step}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">练习益处</h4>
                <ul className="space-y-1">
                  {selectedPractice.benefits.map((benefit, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>练习后反思</CardTitle>
              <CardDescription>记录你的体验和感受</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="练习时有什么感受？注意到了什么？"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                rows={6}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSteps(false)}
                >
                  返回
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleComplete}
                >
                  完成练习
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
