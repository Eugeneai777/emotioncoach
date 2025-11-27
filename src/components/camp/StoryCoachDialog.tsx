import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Sparkles, RefreshCw, ArrowLeft, ArrowRight, BookOpen, Loader2 } from "lucide-react";
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

interface StoryCoachDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  emotionTheme?: string;
  insight?: string;
  action?: string;
  campName: string;
  campDay: number;
  onComplete: (data: { title: string; story: string }) => void;
}

const STAGE_SEQUENCE: StoryStage[] = ['problem', 'turning', 'growth', 'reflection'];

const COACH_MESSAGES: Record<StoryStage, string> = {
  welcome: "欢迎来到故事教练！我会通过几个简单问题，帮你把今天的情绪体验变成一个动人的故事。准备好了吗？",
  problem: "当时发生了什么？或者是什么感受让你印象深刻？（不用写很多，一两句话就好）",
  turning: "在这个过程中，有没有某个瞬间让你停下来思考？或者是什么让你决定做出改变？",
  growth: "经历这些之后，你有什么新的发现或理解？对自己、对情绪、或对生活？",
  reflection: "如果用一句话总结今天的收获，你会怎么说？",
  generating: "太棒了！让我帮你把这些整理成一个完整的故事...",
  complete: "故事创作完成！选择一个标题，或者输入你自己的标题。"
};

const PLACEHOLDERS: Record<string, string> = {
  problem: "比如：今天早上醒来，感觉特别焦虑...",
  turning: "比如：当我意识到... / 后来我决定...",
  growth: "比如：我发现原来... / 我开始明白...",
  reflection: "比如：今天我学会了...",
  direct: "把你的想法、感受、经历都写下来吧，不用担心结构，我来帮你整理..."
};

export default function StoryCoachDialog({
  open,
  onOpenChange,
  emotionTheme,
  insight,
  action,
  campName,
  campDay,
  onComplete
}: StoryCoachDialogProps) {
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
  const [historicalBriefings, setHistoricalBriefings] = useState<HistoricalBriefing[]>([]);
  const [selectedBriefing, setSelectedBriefing] = useState<HistoricalBriefing | null>(null);
  const [loadingBriefings, setLoadingBriefings] = useState(false);
  const [showBriefingList, setShowBriefingList] = useState(false);

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
    
    setAnswers({
      problem: [
        briefing.emotion_theme && `今天的情绪主题是「${briefing.emotion_theme}」。`,
        briefing.stage_1_content
      ].filter(Boolean).join('\n\n'),
      
      turning: [
        briefing.stage_2_content,
        briefing.stage_3_content
      ].filter(Boolean).join('\n\n'),
      
      growth: [
        briefing.stage_4_content,
        briefing.insight
      ].filter(Boolean).join('\n\n'),
      
      reflection: [
        briefing.action,
        briefing.growth_story
      ].filter(Boolean).join('\n\n')
    });
    
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
      // Direct mode: skip to generation
      handleGenerate();
      return;
    }

    const currentIndex = STAGE_SEQUENCE.indexOf(stage as any);
    if (currentIndex < STAGE_SEQUENCE.length - 1) {
      setStage(STAGE_SEQUENCE[currentIndex + 1]);
    } else {
      // Last stage, generate story
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
          answers: mode === 'guided' ? answers : undefined,
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
      setSelectedTitle(data.suggestedTitles[0]); // Auto-select first
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
    
    // Format story content
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
      story: formattedStory
    });
    
    // Reset state
    setStage('welcome');
    setMode(null);
    setAnswers({ problem: '', turning: '', growth: '', reflection: '' });
    setRawContent('');
    setGeneratedStory(null);
    setSuggestedTitles([]);
    setSelectedTitle('');
    setCustomTitleInput('');
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
    if (mode === 'briefing') {
      const briefingMessages: Partial<Record<StoryStage, string>> = {
        problem: "我已经读到了你的简报内容。你可以在这个基础上补充更多细节：当时具体发生了什么？有什么场景或画面让你印象深刻？",
        turning: "简报中有提到你情绪背后的需求和原来的应对方式。能再分享一下，是什么让你有了转变的念头？",
        growth: "你的洞察和选择的回应方式很棒！可以展开说说这个发现对你意味着什么？",
        reflection: "最后，用一句话总结今天的收获和感悟，或者对未来自己说的话？"
      };
      return briefingMessages[stage] || COACH_MESSAGES[stage];
    }
    return COACH_MESSAGES[stage];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            说好故事教练
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress indicator for guided mode */}
          {mode === 'guided' && stage !== 'welcome' && stage !== 'generating' && stage !== 'complete' && (
            <div className="flex gap-1">
              {STAGE_SEQUENCE.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-colors",
                    i <= currentStageIndex ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          )}

          {/* Welcome stage */}
          {stage === 'welcome' && !showBriefingList && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex items-center justify-center bg-primary/10">
                  <span className="text-lg">🎯</span>
                </Avatar>
                <div className="flex-1 bg-primary/5 rounded-lg p-4 text-sm">
                  {COACH_MESSAGES.welcome}
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => handleModeSelect('briefing')} 
                  className="w-full h-auto flex-col gap-1.5 py-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <span className="font-medium">从简报开始</span>
                    <Badge variant="secondary" className="text-xs">推荐</Badge>
                  </div>
                  <span className="text-xs opacity-70">选择一个历史简报，基于完整内容创作</span>
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => handleModeSelect('guided')} className="h-auto flex-col gap-2 py-4">
                    <span className="text-2xl">💬</span>
                    <span className="font-medium">教练引导我</span>
                    <span className="text-xs opacity-70">从头开始问答</span>
                  </Button>
                  <Button variant="outline" onClick={() => handleModeSelect('direct')} className="h-auto flex-col gap-2 py-4">
                    <span className="text-2xl">📝</span>
                    <span className="font-medium">帮我整理</span>
                    <span className="text-xs opacity-70">输入完整内容</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Briefing list */}
          {showBriefingList && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  选择一个简报
                </h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowBriefingList(false); setStage('welcome'); }}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  返回
                </Button>
              </div>
              
              {loadingBriefings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : historicalBriefings.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  暂无历史简报
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {historicalBriefings.map((briefing) => (
                      <Card 
                        key={briefing.id}
                        className="p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => handleSelectBriefing(briefing)}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="font-medium text-sm">{briefing.emotion_theme}</span>
                          {briefing.emotion_intensity && (
                            <Badge variant="outline" className="text-xs">
                              {briefing.emotion_intensity}/10
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {format(new Date(briefing.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                        </div>
                        {briefing.insight && (
                          <p className="text-xs text-foreground/70 line-clamp-2">
                            💡 {briefing.insight}
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
          {stage !== 'welcome' && stage !== 'generating' && stage !== 'complete' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 flex items-center justify-center bg-primary/10">
                  <span className="text-lg">🎯</span>
                </Avatar>
                <div className="flex-1 bg-primary/5 rounded-lg p-4 text-sm">
                  {getCoachMessage()}
                </div>
              </div>

              <div>
                <Textarea
                  placeholder={mode === 'direct' ? PLACEHOLDERS.direct : PLACEHOLDERS[stage]}
                  value={getCurrentInput()}
                  onChange={(e) => {
                    if (mode === 'direct') {
                      setRawContent(e.target.value);
                    } else {
                      updateAnswer(stage as keyof StoryAnswers, e.target.value);
                    }
                  }}
                  rows={mode === 'direct' ? 10 : 4}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={goToPreviousStage}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  上一步
                </Button>
                <Button 
                  onClick={goToNextStage} 
                  disabled={!canProceed()}
                  className="flex-1"
                >
                  {mode === 'direct' || stage === 'reflection' ? '生成故事' : '继续'}
                  {mode !== 'direct' && stage !== 'reflection' && (
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Generating stage */}
          {stage === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="animate-spin">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{COACH_MESSAGES.generating}</p>
            </div>
          )}

          {/* Complete stage */}
          {stage === 'complete' && generatedStory && (
            <div className="space-y-4">
              {/* Story preview */}
              <div className="space-y-3 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                {Object.entries(generatedStory).map(([key, section]) => (
                  <div key={key} className="text-xs space-y-1">
                    <div className="font-semibold">
                      【{key === 'problem' ? '问题' : key === 'turning' ? '转折' : key === 'growth' ? '成长' : '反思'}】{section.title}
                    </div>
                    <div className="text-muted-foreground italic">&gt; {section.subtitle}</div>
                    <div className="text-muted-foreground">{section.content.substring(0, 50)}...</div>
                  </div>
                ))}
              </div>

              {/* Title selection */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  为你的故事选择标题
                </Label>

                <div className="space-y-1.5">
                  {suggestedTitles.map((title, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedTitle(title);
                        setCustomTitleInput('');
                      }}
                      className={cn(
                        "w-full text-left p-2.5 text-sm rounded-md transition-colors border",
                        selectedTitle === title
                          ? "bg-primary/10 border-primary/30"
                          : "hover:bg-primary/5 border-transparent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                          selectedTitle === title ? "border-primary" : "border-muted-foreground/30"
                        )}>
                          {selectedTitle === title && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <span className="flex-1">{title}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <Input
                    placeholder="或输入你自己的标题..."
                    value={customTitleInput}
                    onChange={(e) => {
                      setCustomTitleInput(e.target.value);
                      setSelectedTitle('');
                    }}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleUseStory}
                  disabled={!selectedTitle && !customTitleInput}
                  className="flex-1"
                >
                  使用这个故事
                </Button>
                <Button variant="ghost" onClick={handleRegenerate} disabled={isGenerating}>
                  <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", isGenerating && "animate-spin")} />
                  重新生成
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
