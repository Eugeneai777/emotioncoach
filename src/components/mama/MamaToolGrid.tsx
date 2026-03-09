const tools = [
  {
    title: "亲子沟通教练",
    emoji: "👩‍👧",
    desc: "孩子不听话 · 情绪 · 教育",
    color: "bg-[#FFF3EB]",
    context: "我想咨询亲子沟通方面的问题，请帮我分析并给出建议",
  },
  {
    title: "情绪支持教练",
    emoji: "🫂",
    desc: "妈妈情绪 · 压力 · 焦虑",
    color: "bg-[#FFF0F5]",
    context: "我作为妈妈感到情绪上需要支持，请帮助我",
  },
  {
    title: "关系沟通教练",
    emoji: "💑",
    desc: "夫妻沟通 · 家庭关系",
    color: "bg-[#F0FFF4]",
    context: "我想改善家庭关系和夫妻沟通，请给我建议",
  },
  {
    title: "妈妈成长教练",
    emoji: "🌱",
    desc: "人生方向 · 自我成长",
    color: "bg-[#F0F4FF]",
    context: "作为妈妈，我想在个人成长方面获得指导",
  },
];

interface MamaToolGridProps {
  onToolClick: (context: string) => void;
}

const MamaToolGrid = ({ onToolClick }: MamaToolGridProps) => {
  return (
    <div className="mx-4">
      <p className="text-lg font-medium text-[#3D3028] mb-3">🛠️ 妈妈AI工具区</p>
      <div className="grid grid-cols-2 gap-3">
        {tools.map((t) => (
          <button
            key={t.title}
            onClick={() => onToolClick(t.context)}
            className={`${t.color} p-4 rounded-2xl text-left hover:shadow-md active:scale-[0.97] transition-all border border-transparent hover:border-[#F5E6D3]`}
          >
            <span className="text-2xl">{t.emoji}</span>
            <p className="text-sm font-medium text-[#3D3028] mt-2">{t.title}</p>
            <p className="text-xs text-[#A89580] mt-1">{t.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MamaToolGrid;
