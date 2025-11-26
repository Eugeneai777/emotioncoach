import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AIDeclarationGeneratorProps {
  onDeclarationGenerated: (declaration: string) => void;
}

export const AIDeclarationGenerator = ({ onDeclarationGenerated }: AIDeclarationGeneratorProps) => {
  const [keywords, setKeywords] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDeclaration = async () => {
    if (!keywords.trim()) {
      toast({
        title: "请输入关键词",
        description: "输入一些关键词来生成个性化宣言",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: "user",
              content: `请根据以下关键词生成一段积极向上的能量宣言，要求：
1. 第一人称表达
2. 充满正能量和激励性
3. 80-150字之间
4. 语言优美流畅
5. 可以分段表达（用换行符分隔）

关键词：${keywords}

请直接输出宣言内容，不要有任何解释或前缀。`
            }
          ]
        }
      });

      if (error) throw error;

      if (data && typeof data === 'string') {
        onDeclarationGenerated(data.trim());
        toast({
          title: "生成成功",
          description: "AI已为你生成专属宣言",
        });
        setKeywords("");
      }
    } catch (error) {
      console.error("生成宣言失败:", error);
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs sm:text-sm font-semibold text-foreground">AI智能生成</Label>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="输入关键词，如：勇气、成长、感恩"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && generateDeclaration()}
          className="flex-1 text-sm"
          disabled={isGenerating}
        />
        <Button
          onClick={generateDeclaration}
          disabled={isGenerating}
          variant="outline"
          className="px-4"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-1" />
          )}
          {isGenerating ? "生成中..." : "生成"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        💡 提示：输入你想表达的情绪、目标或价值观，AI会为你生成专属宣言
      </p>
    </div>
  );
};
