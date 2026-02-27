import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Lock, Users, MessageCircle, Heart } from "lucide-react";
import type { Perspective } from "./communicationAssessmentData";

interface CommAssessmentStartScreenProps {
  onStart: (perspective: Perspective) => void;
  onBack?: () => void;
  onEnterInviteCode?: () => void;
}

export function CommAssessmentStartScreen({ onStart, onBack, onEnterInviteCode }: CommAssessmentStartScreenProps) {
  const painPoints = [
    { text: '明明是为TA好，为什么TA就是不听？', emoji: '😤' },
    { text: '每次沟通都变成争吵，到底哪里出了问题？', emoji: '💥' },
    { text: '孩子越来越不愿意跟我说话了...', emoji: '😶' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 p-4 flex flex-col items-center justify-center relative">
      {onBack && (
        <motion.div
          initial={{ opacity: 0.01 }}
          animate={{ opacity: 1 }}
          className="absolute top-4 left-4"
          style={{ transform: 'translateZ(0)' }}
        >
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" />返回
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0.01, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-4"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* 标题 */}
        <motion.div initial={{ opacity: 0.01 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-center mb-2">
          <div className="text-4xl mb-2">🗣️</div>
          <h1 className="text-xl font-bold text-sky-800 mb-1">亲子沟通模式测评</h1>
          <p className="text-sm text-muted-foreground">双视角诊断，看见彼此的真实感受</p>
        </motion.div>

        {/* 痛点共鸣 */}
        <motion.div initial={{ opacity: 0.01, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-sky-200 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-sky-500" />
                <span className="font-medium text-sky-800 text-sm">你是否也有这样的困惑？</span>
              </div>
              {painPoints.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0.01, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                  style={{ transform: 'translateZ(0)' }}
                >
                  <span>{p.emoji}</span>
                  <span>{p.text}</span>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* 测评介绍 */}
        <motion.div initial={{ opacity: 0.01, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} style={{ transform: 'translateZ(0)' }}>
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-sky-50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-indigo-400" />
                <span className="font-medium text-indigo-700 text-sm">测评特色</span>
              </div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-indigo-400">•</span><span>24道专业量表，覆盖6大沟通维度</span></li>
                <li className="flex items-start gap-2"><span className="text-indigo-400">•</span><span>家长与青少年双视角，发现认知差异</span></li>
                <li className="flex items-start gap-2"><span className="text-indigo-400">•</span><span>AI生成个性化沟通改善建议</span></li>
                <li className="flex items-start gap-2"><span className="text-indigo-400">•</span><span>约5分钟完成，立即获取分析报告</span></li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        {/* 视角选择 */}
        <motion.div initial={{ opacity: 0.01, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-y-3 pt-2" style={{ transform: 'translateZ(0)' }}>
          <p className="text-center text-sm font-medium text-sky-800">选择你的身份开始测评</p>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onStart('parent')}
              className="h-14 bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-medium rounded-xl shadow-lg flex flex-col items-center gap-0.5"
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">我是家长</span>
            </Button>
            <Button
              onClick={() => onStart('teen')}
              className="h-14 bg-gradient-to-r from-violet-500 to-pink-500 hover:from-violet-600 hover:to-pink-600 text-white font-medium rounded-xl shadow-lg flex flex-col items-center gap-0.5"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm">我是青少年</span>
            </Button>
          </div>

          {onEnterInviteCode && (
            <button
              onClick={onEnterInviteCode}
              className="w-full text-xs text-muted-foreground underline underline-offset-2 hover:text-sky-600"
            >
              已有邀请码？点击输入，查看双视角对比
            </button>
          )}
        </motion.div>

        {/* 隐私 */}
        <motion.div initial={{ opacity: 0.01 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center" style={{ transform: 'translateZ(0)' }}>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" />回答完全保密，仅用于生成专属分析报告
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
