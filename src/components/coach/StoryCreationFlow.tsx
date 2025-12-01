import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, RefreshCw, ArrowLeft, ArrowRight, BookOpen, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

type StoryStage = 'welcome' | 'problem' | 'turning' | 'growth' | 'reflection' | 'generating' | 'complete';
type StoryMode = 'guided' | 'direct' | 'briefing';

interface StoryAnswers {
  problem: string;
  turning: string;
  growth: string;
  reflection: string;
}

interface GeneratedStory {
  problem: { title: string; subtitle: string; content: string };
  turning: { title: string; subtitle: string; content: string };
  growth: { title: string; subtitle: string; content: string };
  reflection: { title: string; subtitle: string; content: string };
}

interface HistoricalBriefing {
  id: string;
  created_at: string;
  emotion_theme: string;
  emotion_intensity: number | null;
  stage_1_content: string | null;
  stage_2_content: string | null;
  stage_3_content: string | null;
  stage_4_content: string | null;
  insight: string | null;
  action: string | null;
  growth_story: string | null;
}

interface StoryCreationFlowProps {
  onComplete: (data: { title: string; story: string; emotionTag?: string }) => void;
  emotionTheme?: string;
  insight?: string;
  action?: string;
  campName?: string;
  campDay?: number;
}

const STAGE_SEQUENCE: StoryStage[] = ['problem', 'turning', 'growth', 'reflection'];

const COACH_MESSAGES: Partial<Record<StoryStage | 'direct', string>> & Record<StoryStage, string> = {
  welcome: `你好！我是你的故事教练 🎯

我会用"英雄之旅"的方法，帮你把经历和成长整理成一个完整的故事。

我们有三种创作方式，你想怎么开始？`,
  problem: "让我们从故事的开始说起。当时你遇到了什么挑战或困境？感受是什么？",
  turning: "很好！那么在这个过程中，有什么关键的转折时刻吗？是什么让你有了不同的思考或选择？",
  growth: "太棒了！经历这些之后，你对自己有了什么新的认识或发现？",
  reflection: "最后，如果用一句话总结今天的收获和感悟，你会怎么说？或者想对未来的自己说什么？",
  generating: "正在用心整理你的故事...",
  complete: "故事已经准备好了！",
  direct: "请把你的经历和感受写下来，想到什么就写什么，不用担心结构。我会帮你整理成一个完整的故事。"
};

const BRIEFING_COACH_MESSAGES: Partial<Record<StoryStage, string>> = {
  problem: `我看到你当时的情绪记录了。现在让我们把它变成一个故事的开头。

能告诉我更多吗？
• 这是在什么场景下发生的？（时间、地点）
• 当时具体发生了什么事？
• 有什么画面或对话让你印象深刻？`,

  turning: `很好！现在让我们找到故事的转折点。

在这个过程中：
• 有没有某个瞬间让你停下来思考？
• 是什么让你意识到可以换一种方式？
• 或者是谁/什么触发了你的转变？`,

  growth: `太棒了！现在让我们描述你的成长。

经历这些之后：
• 你对自己有了什么新的认识？
• 这个发现对你意味着什么？
• 你打算怎么用这个洞察？`,

  reflection: `最后，让我们总结这个故事。

如果用一句话总结收获和感悟：
• 你会对未来的自己说什么？
• 这个故事的"主题"是什么？`
};

const PLACEHOLDERS: Partial<Record<StoryStage | 'direct', string>> = {
  problem: "比如：今天早上醒来，感觉特别焦虑...",
  turning: "比如：当我意识到... / 后来我决定...",
  growth: "比如：我发现原来... / 我开始明白...",
  reflection: "比如：今天我学会了...",
  direct: "把你的想法、感受、经历都写下来吧，不用担心结构，我来帮你整理..."
};

const BRIEFING_PLACEHOLDERS: Partial<Record<StoryStage, string>> = {
  problem: "那天...(描述场景和发生的事)",
  turning: "后来，当我...(描述转折的瞬间)",
  growth: "我发现...(描述你的新认识)",
  reflection: "今天我学会了...(用一句话总结)"
};

const STAGE_ICONS = {
  problem: "🌪️",
  turning: "💡",
  growth: "🌱",
  reflection: "✨"
};

const STAGE_NAMES = {
  problem: "问题",
  turning: "转折",
  growth: "成长",
  reflection: "反思"
};

export default function StoryCreationFlow({
  onComplete,
  emotionTheme,
  insight,
  action,
  campName,
  campDay
}: StoryCreationFlowProps) {
  const [stage, setStage] = useState<StoryStage>('welcome');
  const [mode, setMode] = useState<StoryMode | null>(null);
  const [answers, setAnswers] = useState<StoryAnswers>({
    problem: '', turning: '', growth: '', reflection: ''
  });
  const [rawContent, setRawContent] = useState('');
  const [generatedStory, setGeneratedStory] = useState<GeneratedStory | null>(null);
  const [suggestedTitles, setSuggestedTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [customTitleInput, setCustomTitleInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedEmotionTag, setExtractedEmotionTag] = useState<string | undefined>(undefined);
  const [historicalBriefings, setHistoricalBriefings] = useState<HistoricalBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<HistoricalBriefing | null>(null);
  const [loadingBriefings, setLoadingBriefings] = useState(false);
  const [showBriefingList, setShowBriefingList] = useState(false);
  const [briefingContext, setBriefingContext] = useState<{
    problem: string;
    turning: string;
    growth: string;
    reflection: string;
  } | null>(null);

  const currentStageIndex = STAGE_SEQUENCE.indexOf(stage as any);

  const loadHistoricalBriefings = async () => {
    setLoadingBriefings(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', user.id);

      if (!conversations?.length) return;

      const { data, error } = await supabase
        .from('briefings')
        .select(`
          id, created_at, emotion_theme, emotion_intensity,
          stage_1_content, stage_2_content, stage_3_content, stage_4_content,
          insight, action, growth_story
        `)
        .in('conversation_id', conversations.map(c => c.id))
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistoricalBriefings(data || []);
    } catch (error) {
      console.error('Error loading briefings:', error);
      toast.error("加载简报失败");
    } finally {
      setLoadingBriefings(false);
    }
  };

  const handleSelectBriefing = (briefing: HistoricalBriefing) => {
    setSelectedBriefing(briefing);
    
    setBriefingContext({
      problem: [
        briefing.emotion_theme && `情绪主题：${briefing.emotion_theme}`,
        briefing.stage_1_content
      ].filter(Boolean).join('\n'),
      
      turning: [
        briefing.stage_2_content && `情绪背后的需求：${briefing.stage_2_content}`,
        briefing.stage_3_content && `原有应对方式：${briefing.stage_3_content}`
      ].filter(Boolean).join('\n'),
      
      growth: [
        briefing.stage_4_content && `选择的回应：${briefing.stage_4_content}`,
        briefing.insight && `洞察：${briefing.insight}`
      ].filter(Boolean).join('\n'),
      
      reflection: [
        briefing.action && `行动计划：${briefing.action}`,
        briefing.growth_story
      ].filter(Boolean).join('\n')
    });
    
    setAnswers({ problem: '', turning: '', growth: '', reflection: '' });
    setShowBriefingList(false);
    setStage('problem');
  };

  const handleModeSelect = (selectedMode: StoryMode) => {
    setMode(selectedMode);
    if (selectedMode === 'briefing') {
      setShowBriefingList(true);
      loadHistoricalBriefings();
    } else if (selectedMode === 'guided') {
      setStage('problem');
    } else {
      setStage('direct' as any);
    }
  };

  const updateAnswer = (key: keyof StoryAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const goToNextStage = () => {
    if (mode === 'direct') {
      handleGenerate();
      return;
    }

    const currentIndex = STAGE_SEQUENCE.indexOf(stage as any);
    if (currentIndex < STAGE_SEQUENCE.length - 1) {
      setStage(STAGE_SEQUENCE[currentIndex + 1]);
    } else {
      handleGenerate();
    }
  };

  const goToPreviousStage = () => {
    if (mode === 'direct' || stage === 'problem') {
      setStage('welcome');
      setMode(null);
      return;
    }

    const currentIndex = STAGE_SEQUENCE.indexOf(stage as any);
    if (currentIndex > 0) {
      setStage(STAGE_SEQUENCE[currentIndex - 1]);
    }
  };

  const handleGenerate = async () => {
    setStage('generating');
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-story-coach', {
        body: {
          mode,
          answers: mode === 'guided' || mode === 'briefing' ? answers : undefined,
          briefingContext: mode === 'briefing' ? briefingContext : undefined,
          rawContent: mode === 'direct' ? rawContent : undefined,
          context: {
            emotionTheme,
            campName,
            day: campDay,
            insight,
            action
          }
        }
      });

      if (error) throw error;

      setGeneratedStory(data.story);
      setSuggestedTitles(data.suggestedTitles);
      setSelectedTitle(data.suggestedTitles[0]);
      setExtractedEmotionTag(data.emotionTag);
      setStage('complete');
    } catch (error) {
      console.error('Story generation error:', error);
      toast.error("生成失败，请重试");
      setStage(mode === 'guided' ? 'reflection' : 'welcome');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseStory = () => {
    if (!generatedStory) return;

    const finalTitle = customTitleInput || selectedTitle;
    
    const formattedStory = `【问题】${generatedStory.problem.title}
> ${generatedStory.problem.subtitle}

${generatedStory.problem.content}

【转折】${generatedStory.turning.title}
> ${generatedStory.turning.subtitle}

${generatedStory.turning.content}

【成长】${generatedStory.growth.title}
> ${generatedStory.growth.subtitle}

${generatedStory.growth.content}

【反思】${generatedStory.reflection.title}
> ${generatedStory.reflection.subtitle}

${generatedStory.reflection.content}`;
    
    onComplete({
      title: finalTitle,
      story: formattedStory,
      emotionTag: extractedEmotionTag
    });
    
    // Reset
    setStage('welcome');
    setMode(null);
    setAnswers({ problem: '', turning: '', growth: '', reflection: '' });
    setRawContent('');
    setGeneratedStory(null);
    setSuggestedTitles([]);
    setSelectedTitle('');
    setCustomTitleInput('');
    setExtractedEmotionTag(undefined);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const getCurrentInput = () => {
    if (mode === 'direct') return rawContent;
    return answers[stage as keyof StoryAnswers] || '';
  };

  const canProceed = () => {
    if (stage === 'welcome') return false;
    if (mode === 'direct') return rawContent.trim().length > 0;
    return answers[stage as keyof StoryAnswers]?.trim().length > 0;
  };

  const getCoachMessage = () => {
    if (mode === 'briefing' && BRIEFING_COACH_MESSAGES[stage]) {
      return BRIEFING_COACH_MESSAGES[stage];
    }
    return COACH_MESSAGES[stage];
  };

  const getBriefingPlaceholder = (currentStage: StoryStage) => {
    if (mode === 'briefing' && BRIEFING_PLACEHOLDERS[currentStage]) {
      return BRIEFING_PLACEHOLDERS[currentStage];
    }
    return PLACEHOLDERS[currentStage] || '';
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {mode === 'guided' && stage !== 'welcome' && stage !== 'generating' && stage !== 'complete' && (
        <div className="flex gap-1">
          {STAGE_SEQUENCE.map((s, i) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-1 rounded-full transition-colors",
                i <= currentStageIndex ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      {/* Welcome stage */}
      {stage === 'welcome' && !showBriefingList && (
        <div className="space-y-6">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <span className="text-2xl">📖</span>
            </Avatar>
            <div className="flex-1 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg p-4 text-sm whitespace-pre-line">
              {COACH_MESSAGES.welcome}
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => handleModeSelect('briefing')} 
              className="w-full h-auto flex-col gap-2 py-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span className="font-medium text-lg">从简报开始</span>
                <Badge variant="secondary" className="text-xs bg-white/20">推荐</Badge>
              </div>
              <span className="text-xs opacity-90">选择一个历史简报，基于完整内容创作</span>
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={() => handleModeSelect('guided')} 
                className="h-auto flex-col gap-2 py-6 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
              >
                <span className="text-3xl">💬</span>
                <span className="font-medium">教练引导我</span>
                <span className="text-xs text-muted-foreground">从头开始问答</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleModeSelect('direct')} 
                className="h-auto flex-col gap-2 py-6 border-amber-200 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/30"
              >
                <span className="text-3xl">📝</span>
                <span className="font-medium">帮我整理</span>
                <span className="text-xs text-muted-foreground">输入完整内容</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Briefing list */}
      {showBriefingList && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-orange-500" />
              选择一个简报
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setShowBriefingList(false); setStage('welcome'); }}
              className="hover:bg-orange-50 dark:hover:bg-orange-950/30"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </div>
          
          {loadingBriefings ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : historicalBriefings.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              暂无历史简报
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3 pr-4">
                {historicalBriefings.map((briefing) => (
                  <Card 
                    key={briefing.id}
                    className="p-4 cursor-pointer hover:bg-orange-50/50 dark:hover:bg-orange-950/20 transition-colors border-orange-100 dark:border-orange-900"
                    onClick={() => handleSelectBriefing(briefing)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-medium">{briefing.emotion_theme}</span>
                      {briefing.emotion_intensity && (
                        <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                          {briefing.emotion_intensity}/10
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(briefing.created_at), 'yyyy年M月d日 HH:mm', { locale: zhCN })}
                    </p>
                    {briefing.stage_1_content && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {briefing.stage_1_content}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      {/* Conversation stages */}
      {stage !== 'welcome' && stage !== 'generating' && stage !== 'complete' && !showBriefingList && (
        <div className="space-y-6">
          {/* Coach message */}
          <div className="flex gap-3">
            <Avatar className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-amber-500/20">
              <span className="text-2xl">{STAGE_ICONS[stage as keyof typeof STAGE_ICONS] || "📖"}</span>
            </Avatar>
            <div className="flex-1 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-lg p-4 text-sm whitespace-pre-line">
              {getCoachMessage()}
            </div>
          </div>

          {/* Context reference */}
          {mode === 'briefing' && briefingContext && (
            <Card className="p-4 bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900 dark:text-orange-100">参考内容</span>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-line">
                {briefingContext[stage as keyof typeof briefingContext]}
              </p>
            </Card>
          )}

          {/* User input */}
          <div className="space-y-2">
            <Textarea
              value={mode === 'direct' ? rawContent : getCurrentInput()}
              onChange={(e) => {
                if (mode === 'direct') {
                  setRawContent(e.target.value);
                } else {
                  updateAnswer(stage as keyof StoryAnswers, e.target.value);
                }
              }}
              placeholder={getBriefingPlaceholder(stage as StoryStage)}
              className="min-h-[200px] resize-none border-orange-200 focus-visible:ring-orange-500 dark:border-orange-800"
            />
            
            {/* Navigation buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={goToPreviousStage}
                className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                上一步
              </Button>
              <Button
                onClick={goToNextStage}
                disabled={!canProceed()}
                className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
              >
                {currentStageIndex === STAGE_SEQUENCE.length - 1 || mode === 'direct' ? (
                  <>生成故事 <Sparkles className="h-4 w-4 ml-1" /></>
                ) : (
                  <>下一步 <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Generating stage */}
      {stage === 'generating' && (
        <div className="py-12 text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="h-16 w-16 animate-spin text-orange-500" />
              <Sparkles className="h-6 w-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <p className="text-muted-foreground">{COACH_MESSAGES.generating}</p>
        </div>
      )}

      {/* Complete stage */}
      {stage === 'complete' && generatedStory && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-6 w-6" />
            <span className="font-medium">{COACH_MESSAGES.complete}</span>
          </div>

          {/* Story preview */}
          <ScrollArea className="h-[400px] rounded-lg border border-orange-200 dark:border-orange-800 p-4 bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/10 dark:to-amber-950/10">
            <div className="space-y-6 pr-4">
              {(['problem', 'turning', 'growth', 'reflection'] as const).map((section) => (
                <div key={section} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{STAGE_ICONS[section]}</span>
                    <h3 className="font-bold text-lg">{generatedStory[section].title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground italic">
                    {generatedStory[section].subtitle}
                  </p>
                  <p className="text-sm whitespace-pre-line leading-relaxed">
                    {generatedStory[section].content}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Title selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">选择标题</Label>
            <div className="grid gap-2">
              {suggestedTitles.map((title) => (
                <Button
                  key={title}
                  variant={selectedTitle === title ? "default" : "outline"}
                  className={cn(
                    "justify-start text-left h-auto py-3 px-4",
                    selectedTitle === title 
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600" 
                      : "border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
                  )}
                  onClick={() => {
                    setSelectedTitle(title);
                    setCustomTitleInput('');
                  }}
                >
                  {title}
                </Button>
              ))}
              
              <div className="flex gap-2">
                <Input
                  value={customTitleInput}
                  onChange={(e) => {
                    setCustomTitleInput(e.target.value);
                    setSelectedTitle('');
                  }}
                  placeholder="或者输入自定义标题..."
                  className="flex-1 border-orange-200 focus-visible:ring-orange-500 dark:border-orange-800"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              重新生成
            </Button>
            <Button
              onClick={handleUseStory}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              使用这个故事
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
