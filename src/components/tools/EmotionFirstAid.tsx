import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Angry, 
  Frown, 
  Meh, 
  AlertTriangle,
  Heart,
  Sparkles,
  Wind,
  Brain
} from "lucide-react";

interface Emotion {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  techniques: string[];
  sosAdvice: string;
}

const emotions: Emotion[] = [
  {
    id: "anger",
    name: "愤怒",
    icon: <Angry className="w-6 h-6" />,
    color: "hsl(0, 70%, 50%)",
    techniques: [
      "深呼吸 5 次，用 4-7-8 呼吸法",
      "离开当前环境，去安静的地方",
      "用力握拳再松开，重复 10 次",
      "写下你的感受，不要压抑",
      "做激烈运动，释放能量"
    ],
    sosAdvice: "如果愤怒难以控制，请立即联系心理咨询师或拨打心理援助热线。"
  },
  {
    id: "anxiety",
    name: "焦虑",
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "hsl(45, 100%, 50%)",
    techniques: [
      "使用「5-4-3-2-1」接地技巧",
      "专注当下，不要想象最坏情况",
      "列出担心的事，写下应对方案",
      "做渐进式肌肉放松练习",
      "与信任的人倾诉"
    ],
    sosAdvice: "如果焦虑持续加重或出现恐慌发作，请寻求专业帮助。"
  },
  {
    id: "sadness",
    name: "悲伤",
    icon: <Frown className="w-6 h-6" />,
    color: "hsl(210, 50%, 50%)",
    techniques: [
      "允许自己哭泣，释放情绪",
      "写感恩日记，关注美好的事",
      "做自己喜欢的事情",
      "与朋友或家人联系",
      "到户外散步，接触大自然"
    ],
    sosAdvice: "如果悲伤持续超过两周且影响日常生活，请考虑咨询心理医生。"
  },
  {
    id: "fear",
    name: "恐惧",
    icon: <AlertTriangle className="w-6 h-6" />,
    color: "hsl(270, 50%, 50%)",
    techniques: [
      "识别恐惧的具体来源",
      "区分真实威胁和想象威胁",
      "用理性思考挑战恐惧想法",
      "渐进式暴露，逐步面对恐惧",
      "寻求专业支持"
    ],
    sosAdvice: "如果恐惧严重影响生活，建议寻求认知行为疗法（CBT）帮助。"
  },
  {
    id: "overwhelm",
    name: "不知所措",
    icon: <Meh className="w-6 h-6" />,
    color: "hsl(30, 50%, 50%)",
    techniques: [
      "暂停所有活动，深呼吸",
      "列出所有待办事项",
      "按优先级排序，一次只做一件",
      "学会说「不」，设定界限",
      "寻求他人帮助和支持"
    ],
    sosAdvice: "长期感觉不知所措可能是压力过大的信号，考虑调整生活节奏。"
  }
];

export const EmotionFirstAid = () => {
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [showSOS, setShowSOS] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>你现在的情绪是？</CardTitle>
          <CardDescription>选择最接近你当前感受的情绪</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {emotions.map((emotion) => (
              <Button
                key={emotion.id}
                variant={selectedEmotion?.id === emotion.id ? "default" : "outline"}
                className="h-24 flex flex-col gap-2"
                onClick={() => {
                  setSelectedEmotion(emotion);
                  setShowSOS(false);
                }}
                style={{
                  borderColor: selectedEmotion?.id === emotion.id ? emotion.color : undefined,
                  backgroundColor: selectedEmotion?.id === emotion.id ? `${emotion.color}20` : undefined
                }}
              >
                <div style={{ color: emotion.color }}>{emotion.icon}</div>
                <span>{emotion.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedEmotion && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wind className="w-5 h-5" />
                快速缓解技巧
              </CardTitle>
              <CardDescription>
                针对{selectedEmotion.name}的有效方法
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {selectedEmotion.techniques.map((technique, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `${selectedEmotion.color}20`,
                        color: selectedEmotion.color
                      }}
                    >
                      {index + 1}
                    </div>
                    <span className="flex-1">{technique}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-2" style={{ borderColor: `${selectedEmotion.color}40` }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" style={{ color: selectedEmotion.color }} />
                专业建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertDescription>{selectedEmotion.sosAdvice}</AlertDescription>
              </Alert>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowSOS(!showSOS)}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  紧急支持
                </Button>
                <Button
                  className="flex-1"
                  style={{ backgroundColor: selectedEmotion.color }}
                  onClick={() => {
                    // TODO: 启动 AI 对话
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI 陪伴
                </Button>
              </div>
            </CardContent>
          </Card>

          {showSOS && (
            <Card className="bg-destructive/10 border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">紧急心理支持热线</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">24小时心理援助热线</div>
                  <div className="text-2xl font-bold text-destructive">400-161-9995</div>
                </div>
                <div>
                  <div className="font-medium">北京心理危机研究与干预中心</div>
                  <div className="text-2xl font-bold text-destructive">010-82951332</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  如果你感到极度痛苦或有自伤想法，请立即拨打以上热线或前往最近的医院急诊。
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedEmotion && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              选择一个情绪，获取专业的情绪管理建议
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
