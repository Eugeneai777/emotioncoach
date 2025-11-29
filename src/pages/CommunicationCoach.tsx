import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/ChatMessage";
import { useCommunicationChat } from "@/hooks/useCommunicationChat";
import { useAuth } from "@/hooks/useAuth";
import { Send, RotateCcw, History, LogOut, Loader2, Settings, ChevronDown, Menu, Target, ShoppingBag } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CommunicationScenarios } from "@/components/communication/CommunicationScenarios";

const CommunicationCoach = () => {
  const [input, setInput] = useState("");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const { user, loading: authLoading, signOut } = useAuth();
  const { messages, isLoading, sendMessage, resetConversation } = useCommunicationChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input.trim();
    setInput("");
    await sendMessage(messageToSend);
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectScenario = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleNewConversation = () => {
    resetConversation();
    toast({
      title: "开始新对话",
      description: "已清空当前对话，可以开始新的沟通梳理了 🎯",
    });
  };

  const communicationSteps = [
    {
      id: 1,
      emoji: "1️⃣",
      title: "看见（See）",
      description: "把沟通问题变清晰",
      details: "从混乱 → 清晰可操作。我会帮你拆解沟通场景、对话对象、真正诉求和卡点。"
    },
    {
      id: 2,
      emoji: "2️⃣",
      title: "读懂（Understand）",
      description: "读懂对方的感受与动机",
      details: "一瞬间懂对方，解除情绪误解。从对方的角度看，理解他真正担心什么、需要什么。"
    },
    {
      id: 3,
      emoji: "3️⃣",
      title: "影响（Influence）",
      description: "给一句对方愿意听的话",
      details: "最小阻力沟通路径。提供可复制的开场话术、表达需求的方式、避坑话术和最佳策略。"
    },
    {
      id: 4,
      emoji: "4️⃣",
      title: "行动（Act）",
      description: "今天就能做的沟通微行动",
      details: "30秒能做、明天就能复制、让关系比现在好一点的具体行动。"
    }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/energy-studio#coach")}
              >
                <Menu className="w-4 h-4" />
              </Button>
              
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/energy-studio#coach")}
                  className="gap-1 md:gap-2 px-2 md:px-3"
                >
                  返回主页
                </Button>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              {/* 教练空间下拉 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 md:gap-2 px-2 md:px-3">
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">教练空间</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/")}>
                    <span className="text-green-500">💚</span>
                    <div className="flex flex-col ml-2">
                      <span className="font-medium">情绪觉醒教练</span>
                      <span className="text-xs text-muted-foreground">Feel · Name · Recognize · Transform</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/parent-coach")}>
                    <span className="text-purple-500">💜</span>
                    <div className="flex flex-col ml-2">
                      <span className="font-medium">家长情绪教练</span>
                      <span className="text-xs text-muted-foreground">Feel · See · Sense · Transform</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/communication-coach")}>
                    <span className="text-blue-500">💙</span>
                    <div className="flex flex-col ml-2">
                      <span className="font-medium">卡内基沟通教练</span>
                      <span className="text-xs text-muted-foreground">See · Understand · Influence · Act</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => navigate("/energy-studio#coach")}
                    className="gap-2 text-primary"
                  >
                    <Target className="w-4 h-4" />
                    教练空间主页
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* 有劲生活馆 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/energy-studio")}
                className="gap-1 md:gap-2 px-2 md:px-3"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">有劲生活馆</span>
              </Button>

              {/* 沟通日记 */}
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate("/communication-history")}
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white gap-1 md:gap-2 px-2 md:px-3"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">我的沟通日记</span>
              </Button>

              {/* 用户菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="w-4 h-4 mr-2" />
                    设置
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-4 md:py-8">
          {messages.length === 0 ? (
            <div className="space-y-6 md:space-y-8">
              <div className="text-center space-y-3 md:space-y-4 py-8 md:py-12">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">💙</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-transparent bg-clip-text">
                  卡内基沟通教练
                </h1>
                <p className="text-base md:text-lg text-muted-foreground">
                  温暖表达，有效影响
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  让每一个人都能更轻松地说出想说的话，并让对方愿意听 🎯
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-3 md:space-y-4">
                <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
                  <span className="text-blue-500">🎯</span>
                  卡内基沟通四步曲
                </h2>
                
                <div className="space-y-2">
                  {communicationSteps.map((step) => (
                    <Collapsible
                      key={step.id}
                      open={expandedStep === step.id}
                      onOpenChange={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 h-auto py-3 px-4 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                        >
                          <span className="text-2xl">{step.emoji}</span>
                          <div className="flex-1 text-left">
                            <div className="font-medium text-foreground">{step.title}</div>
                            <div className="text-xs text-muted-foreground">{step.description}</div>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedStep === step.id ? 'rotate-180' : ''}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-4 pb-3 text-sm text-muted-foreground">
                          {step.details}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>

              <CommunicationScenarios onSelectScenario={handleSelectScenario} />
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={index} 
                  role={message.role}
                  content={message.content}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在思考...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Footer Input */}
      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="container max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="分享你的沟通困境..."
              className="resize-none min-h-[60px] max-h-[200px]"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-2">
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNewConversation}
                  disabled={isLoading}
                  title="开始新对话"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CommunicationCoach;