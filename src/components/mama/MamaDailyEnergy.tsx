import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const quotes = [
  "孩子需要的不是完美妈妈，而是一个真实、温暖的妈妈。",
  "你已经是一个很好的妈妈了，只是你还不知道。",
  "允许自己不完美，是给孩子最好的礼物。",
  "妈妈的微笑，是孩子最安全的港湾。",
  "每一天，你都在用爱创造奇迹。",
  "累了就休息，世界不会因为你休息一天就崩塌。",
  "孩子最需要的，是一个快乐的妈妈。",
  "你不需要做所有事，你只需要做最重要的事。",
  "今天的辛苦，会变成明天最温暖的回忆。",
  "爱孩子之前，先学会爱自己。",
  "慢慢来，比较快。教育孩子，也是如此。",
  "你不是一个人在战斗，有很多妈妈跟你一样。",
  "给自己倒一杯水，深呼吸，你值得被温柔对待。",
  "孩子在长大，你也在成长。",
  "今天只做好一件小事，就已经很棒了。",
  "放下手机，给孩子一个拥抱，你会收获更多。",
  "妈妈的力量，比你想象的要大得多。",
  "不需要比较，每个妈妈都有自己的节奏。",
  "你的温柔，正在塑造一个温暖的灵魂。",
  "做妈妈最重要的不是技巧，而是爱与陪伴。",
  "当你觉得撑不住的时候，看看孩子的笑脸。",
  "世界上最伟大的事业，就是做一个好妈妈。",
  "你给孩子的安全感，会伴随他一生。",
  "今天的你，比昨天的你更勇敢。",
  "允许孩子犯错，也允许自己犯错。",
  "你不需要做到100分，60分的妈妈也很好。",
  "在孩子眼里，你就是整个世界。",
  "疲惫的时候，记得给自己一个微笑。",
  "每一个平凡的日子，都是爱的积累。",
  "你正在用自己的方式，给孩子最好的爱。",
];

interface MamaDailyEnergyProps {
  onGratitudeSubmit: (text: string) => void;
}

const MamaDailyEnergy = ({ onGratitudeSubmit }: MamaDailyEnergyProps) => {
  const [gratitudeText, setGratitudeText] = useState("");

  const today = new Date();
  const dayIndex = Math.floor((today.getTime() / 86400000)) % quotes.length;
  const todayQuote = quotes[dayIndex];

  const handleSubmit = () => {
    if (!gratitudeText.trim()) return;
    onGratitudeSubmit(gratitudeText.trim());
    setGratitudeText("");
  };

  return (
    <div className="mx-4 p-5 bg-white rounded-2xl shadow-sm border border-[#F5E6D3]">
      <p className="text-lg font-medium text-[#3D3028] mb-3">☀️ 今日妈妈一句话</p>
      
      <div className="bg-[#FFF8F0] rounded-xl p-4 mb-4">
        <p className="text-[#5D4E37] text-base leading-relaxed italic">
          "{todayQuote}"
        </p>
      </div>

      <p className="text-sm text-[#8B7355] mb-2">📝 记录今天的一件小感恩</p>
      <Textarea
        value={gratitudeText}
        onChange={(e) => setGratitudeText(e.target.value)}
        placeholder="今天孩子让我感动的一件事..."
        className="border-[#F5E6D3] bg-[#FFFCF8] text-[#3D3028] placeholder:text-[#C4B49A] min-h-[60px] rounded-xl resize-none"
        rows={2}
      />
      {gratitudeText.trim() && (
        <Button
          onClick={handleSubmit}
          className="mt-3 w-full bg-[#F4845F] hover:bg-[#E5734E] text-white rounded-xl"
        >
          记录感恩 💛
        </Button>
      )}
    </div>
  );
};

export default MamaDailyEnergy;
