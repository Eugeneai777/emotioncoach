import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HeartHandshake, Shield, Clock, Mail, Lock } from "lucide-react";

interface AliveCheckIntroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSetup?: () => void;
}

const AliveCheckIntroDialog: React.FC<AliveCheckIntroDialogProps> = ({
  open,
  onOpenChange,
  onStartSetup
}) => {
  const handleStartSetup = () => {
    onOpenChange(false);
    onStartSetup?.();
  };

  const features = [
    {
      icon: Shield,
      title: '每日安全确认',
      description: '一键打卡，确认自己平安无事',
      color: 'text-rose-500',
      bg: 'bg-rose-50',
    },
    {
      icon: Mail,
      title: '自动邮件通知',
      description: '超过设定天数未打卡，自动通知紧急联系人',
      color: 'text-pink-500',
      bg: 'bg-pink-50',
    },
    {
      icon: Clock,
      title: '灵活阈值设置',
      description: '1-7天可调，适应不同生活节奏',
      color: 'text-fuchsia-500',
      bg: 'bg-fuchsia-50',
    },
    {
      icon: Lock,
      title: '隐私保护',
      description: '仅记录打卡时间，不追踪位置信息',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
  ];

  const targetAudience = [
    { emoji: '🏠', text: '独居的年轻人或老人' },
    { emoji: '✈️', text: '在外地工作、远离家人的游子' },
    { emoji: '💼', text: '高强度工作、容易忽略健康的职场人' },
    { emoji: '🌙', text: '有夜间活动习惯的人' },
    { emoji: '🎒', text: '独自旅行或户外探险者' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HeartHandshake className="w-6 h-6 text-rose-500" />
            关于"每日平安打卡"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Introduction */}
          <div className="text-center py-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl">
            <div className="text-4xl mb-3">💗</div>
            <p className="text-sm text-muted-foreground px-4">
              一个简单但重要的安全确认系统，<br />
              为独居、远离家人、或需要被关注的人设计。
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-sm font-semibold text-rose-900 mb-3">核心功能</h3>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className={`${feature.bg} rounded-xl p-3 space-y-2`}
                  >
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{feature.title}</div>
                      <div className="text-xs text-gray-600">{feature.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <h3 className="text-sm font-semibold text-rose-900 mb-3">适合人群</h3>
            <div className="bg-rose-50/50 rounded-xl p-4 space-y-2">
              {targetAudience.map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div>
            <h3 className="text-sm font-semibold text-rose-900 mb-3">使用流程</h3>
            <div className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4">
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <span className="text-lg">📝</span>
                </div>
                <div className="text-xs text-gray-600">设置紧急联系人</div>
              </div>
              <div className="text-rose-300 text-xl">→</div>
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <span className="text-lg">✅</span>
                </div>
                <div className="text-xs text-gray-600">每天点击打卡</div>
              </div>
              <div className="text-rose-300 text-xl">→</div>
              <div className="text-center flex-1">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
                  <span className="text-lg">🔔</span>
                </div>
                <div className="text-xs text-gray-600">超时自动通知</div>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <div className="bg-gray-50 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <span className="font-medium text-gray-700">隐私声明：</span>
              我们仅记录你的打卡时间，不会追踪位置或其他个人信息。只有在超过设定阈值未打卡时，才会发送通知给你指定的紧急联系人。
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              已了解
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:opacity-90"
              onClick={handleStartSetup}
            >
              开始设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AliveCheckIntroDialog;
