import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: string;
  content: string;
}

interface ParentCoachChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (message: string) => void;
  onSelectOption: (option: string) => void;
}

export const ParentCoachChat = ({ 
  messages, 
  isLoading, 
  onSendMessage,
  onSelectOption 
}: ParentCoachChatProps) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' ? (
                <div className="max-w-[80%]">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">劲老师 🌿</div>
                      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      </Card>
                    </div>
                  </div>
                </div>
              ) : (
                <Card className="p-4 bg-primary text-primary-foreground max-w-[80%]">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-xs text-muted-foreground">劲老师正在思考...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="用一句话说说发生了什么..."
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};