import React from "react";
import { Clock, MessageSquare, Wind, Award } from "lucide-react";

interface SessionSummaryCardProps {
  durationSeconds: number;
  remindersViewed: number;
  cyclesCompleted: number;
  breathingCompleted: boolean;
}

const SessionSummaryCard: React.FC<SessionSummaryCardProps> = ({
  durationSeconds,
  remindersViewed,
  cyclesCompleted,
  breathingCompleted,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}分${secs}秒`;
    }
    return `${secs}秒`;
  };

  const stats = [
    {
      icon: Clock,
      label: "陪伴时长",
      value: formatDuration(durationSeconds),
      color: "text-teal-600",
      bgColor: "bg-teal-100/50",
    },
    {
      icon: MessageSquare,
      label: "提醒次数",
      value: `${remindersViewed}条`,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100/50",
    },
    {
      icon: Award,
      label: "完成轮次",
      value: `${cyclesCompleted}轮`,
      color: "text-blue-600",
      bgColor: "bg-blue-100/50",
    },
    {
      icon: Wind,
      label: "呼吸练习",
      value: breathingCompleted ? "已完成" : "未使用",
      color: breathingCompleted ? "text-emerald-600" : "text-gray-400",
      bgColor: breathingCompleted ? "bg-emerald-100/50" : "bg-gray-100/50",
    },
  ];

  return (
    <div className="w-full max-w-sm bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-teal-100/50 mb-6">
      <h3 className="text-sm font-medium text-teal-700 mb-3 text-center">本次记录</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label, value, color, bgColor }) => (
          <div
            key={label}
            className={`flex items-center gap-2 p-3 rounded-xl ${bgColor}`}
          >
            <Icon className={`w-4 h-4 ${color}`} />
            <div>
              <div className={`text-sm font-medium ${color}`}>{value}</div>
              <div className="text-xs text-teal-500/60">{label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionSummaryCard;
