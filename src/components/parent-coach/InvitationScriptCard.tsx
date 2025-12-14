import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  MessageCircle, 
  ChevronDown, 
  ChevronUp,
  Lightbulb,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { INVITATION_SCRIPTS } from "@/config/teenModeGuidance";

interface InvitationScriptCardProps {
  bindingCode: string;
}

export function InvitationScriptCard({ bindingCode }: InvitationScriptCardProps) {
  const { toast } = useToast();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const copyScript = (script: string) => {
    const fullMessage = `${script}\n\n绑定码：${bindingCode}\n（24小时内有效）`;
    navigator.clipboard.writeText(fullMessage);
    toast({ 
      title: "已复制话术和绑定码", 
      description: "可以直接发送给孩子" 
    });
  };

  const shareToWechat = (script: string) => {
    const fullMessage = `${script}\n\n绑定码：${bindingCode}\n（24小时内有效）`;
    // Try to use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: "邀请你使用青少年情绪教练",
        text: fullMessage
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(fullMessage);
        toast({ title: "已复制，可粘贴到微信分享" });
      });
    } else {
      navigator.clipboard.writeText(fullMessage);
      toast({ title: "已复制，可粘贴到微信分享" });
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-violet-500" />
          分享话术
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          选择合适的话术分享给孩子，邀请TA加入青少年模式
        </p>

        <div className="space-y-2">
          {INVITATION_SCRIPTS.map((item, index) => (
            <div 
              key={index}
              className="border border-violet-100 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-violet-50/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.scenario}</span>
                </div>
                {expandedIndex === index ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-3 pb-3 space-y-3">
                      <div className="p-3 bg-violet-50 rounded-lg">
                        <p className="text-sm text-foreground leading-relaxed">
                          "{item.script}"
                        </p>
                      </div>
                      
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span>{item.tips}</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyScript(item.script)}
                          className="flex-1 h-9"
                        >
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          复制
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => shareToWechat(item.script)}
                          className="flex-1 h-9 bg-green-500 hover:bg-green-600"
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1" />
                          分享
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
