import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type PosterLayout = 'default' | 'moments' | 'xiaohongshu' | 'wechat_group' | 'minimal' | 'card';

interface LayoutOption {
  id: PosterLayout;
  name: string;
  description: string;
  preview: React.ReactNode;
}

interface PosterLayoutSelectorProps {
  selectedLayout: PosterLayout;
  onLayoutSelect: (layout: PosterLayout) => void;
}

const layoutOptions: LayoutOption[] = [
  {
    id: 'default',
    name: '经典版',
    description: '均衡布局，适合大多数场景',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 rounded flex flex-col p-2">
        <div className="text-[6px] text-white/80 text-center mb-1">💚</div>
        <div className="h-1.5 bg-white/30 rounded mx-2 mb-1" />
        <div className="flex-1 space-y-0.5 px-1">
          <div className="h-1 bg-white/20 rounded" />
          <div className="h-1 bg-white/20 rounded" />
          <div className="h-1 bg-white/20 rounded" />
        </div>
        <div className="h-3 bg-white/90 rounded mx-1 mt-1" />
      </div>
    ),
  },
  {
    id: 'moments',
    name: '朋友圈版',
    description: '故事感强，情感共鸣',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 rounded flex flex-col p-2">
        <div className="text-[6px] text-white text-center font-bold mb-1">「故事」</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[5px] text-white/80 italic text-center px-1">情感语录...</div>
        </div>
        <div className="space-y-0.5 px-1">
          <div className="h-0.5 bg-white/30 rounded" />
          <div className="h-0.5 bg-white/30 rounded w-3/4" />
        </div>
        <div className="h-2.5 bg-white/90 rounded mx-1 mt-1" />
      </div>
    ),
  },
  {
    id: 'xiaohongshu',
    name: '小红书版',
    description: '标签风格，数据背书',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-red-400 to-rose-500 rounded flex flex-col p-2">
        <div className="flex gap-0.5 mb-1 flex-wrap">
          <span className="text-[4px] bg-white/30 rounded px-0.5 text-white">#标签</span>
          <span className="text-[4px] bg-white/30 rounded px-0.5 text-white">#数据</span>
        </div>
        <div className="h-2 bg-white/20 rounded mb-1" />
        <div className="flex-1 grid grid-cols-2 gap-0.5 px-0.5">
          <div className="bg-white/20 rounded" />
          <div className="bg-white/20 rounded" />
        </div>
        <div className="h-2.5 bg-white/90 rounded mx-1 mt-1" />
      </div>
    ),
  },
  {
    id: 'wechat_group',
    name: '微信群版',
    description: '社群信任，群友背书',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded flex flex-col p-2">
        <div className="flex justify-center gap-0.5 mb-1">
          <div className="w-2 h-2 bg-white/40 rounded-full" />
          <div className="w-2 h-2 bg-white/40 rounded-full" />
          <div className="w-2 h-2 bg-white/40 rounded-full" />
        </div>
        <div className="h-1.5 bg-white/30 rounded mx-2 mb-1" />
        <div className="flex-1 space-y-0.5 px-1">
          <div className="h-1.5 bg-white/20 rounded-lg ml-2" />
          <div className="h-1.5 bg-white/20 rounded-lg mr-2" />
        </div>
        <div className="h-2.5 bg-white/90 rounded mx-1 mt-1" />
      </div>
    ),
  },
  {
    id: 'minimal',
    name: '极简版',
    description: '大量留白，重点突出',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 rounded flex flex-col items-center justify-center p-2">
        <div className="h-2 w-3/4 bg-white/40 rounded mb-1" />
        <div className="h-1 w-1/2 bg-white/20 rounded mb-2" />
        <div className="h-2.5 w-2/3 bg-white/90 rounded" />
      </div>
    ),
  },
  {
    id: 'card',
    name: '卡片版',
    description: '层次丰富，信息清晰',
    preview: (
      <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 rounded flex flex-col p-1.5">
        <div className="bg-white/95 rounded flex-1 p-1 flex flex-col">
          <div className="h-1 bg-indigo-200 rounded mb-0.5" />
          <div className="flex-1 space-y-0.5">
            <div className="h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="h-2 bg-indigo-500 rounded mt-0.5" />
        </div>
      </div>
    ),
  },
];

export const PosterLayoutSelector = ({ selectedLayout, onLayoutSelect }: PosterLayoutSelectorProps) => {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-center text-foreground">选择海报风格</h3>
      <div className="grid grid-cols-3 gap-2">
        {layoutOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onLayoutSelect(option.id)}
            className={cn(
              "relative aspect-[9/16] rounded-lg overflow-hidden transition-all",
              selectedLayout === option.id
                ? "ring-2 ring-primary ring-offset-2"
                : "ring-1 ring-border hover:ring-2 hover:ring-muted-foreground/50"
            )}
          >
            {option.preview}
            {selectedLayout === option.id && (
              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1">
              <p className="text-[8px] text-white font-medium text-center">{option.name}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {layoutOptions.find(o => o.id === selectedLayout)?.description}
      </p>
    </div>
  );
};
