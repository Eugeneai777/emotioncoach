import { Heart } from "lucide-react";

const concerns = [
  { label: "孩子不听话", emoji: "😤", context: "我的孩子不听话，我不知道该怎么办" },
  { label: "孩子不爱学习", emoji: "📚", context: "我的孩子不爱学习，我很着急" },
  { label: "我今天很累", emoji: "😩", context: "我今天当妈妈当得很累，感觉身心俱疲" },
  { label: "和老公沟通不好", emoji: "💬", context: "我和老公沟通不好，经常吵架或者冷战" },
  { label: "我有点迷茫", emoji: "🌫️", context: "作为妈妈，我对未来感到迷茫，不知道自己的方向在哪里" },
];

interface MamaHeroProps {
  onConcernClick: (context: string) => void;
}

const MamaHero = ({ onConcernClick }: MamaHeroProps) => {
  return (
    <div className="text-center px-4 pt-8 pb-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Heart className="w-6 h-6 text-[#F4845F] fill-[#F4845F]" />
        <h1 className="text-2xl font-bold text-[#3D3028]">宝妈AI生活助手</h1>
      </div>
      <p className="text-[#8B7355] text-base mb-1">懂妈妈的AI助手</p>
      <p className="text-[#A89580] text-sm mb-8">情绪 · 亲子 · 关系 · 成长</p>

      <p className="text-lg font-medium text-[#3D3028] mb-4">今天妈妈最困扰的是什么？</p>

      <div className="flex flex-wrap justify-center gap-3">
        {concerns.map((c) => (
          <button
            key={c.label}
            onClick={() => onConcernClick(c.context)}
            className="px-4 py-3 bg-white rounded-2xl shadow-sm border border-[#F5E6D3] text-[#3D3028] text-sm font-medium hover:shadow-md hover:border-[#F4845F]/40 active:scale-95 transition-all"
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MamaHero;
