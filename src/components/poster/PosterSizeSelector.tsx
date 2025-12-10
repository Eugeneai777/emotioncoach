import { cn } from '@/lib/utils';

export interface PosterSize {
  key: string;
  name: string;
  width: number;
  height: number;
  ratio: string;
  platform: string;
}

export const POSTER_SIZES: PosterSize[] = [
  { key: 'default', name: '标准', width: 300, height: 533, ratio: '9:16', platform: '通用' },
  { key: 'moments', name: '朋友圈', width: 400, height: 400, ratio: '1:1', platform: '微信朋友圈' },
  { key: 'xiaohongshu', name: '小红书', width: 360, height: 480, ratio: '3:4', platform: '小红书' },
  { key: 'wechat_group', name: '微信群', width: 400, height: 300, ratio: '4:3', platform: '微信群分享' },
];

interface PosterSizeSelectorProps {
  selectedSize: string;
  onSizeSelect: (size: PosterSize) => void;
}

export function PosterSizeSelector({ selectedSize, onSizeSelect }: PosterSizeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <span>📐</span>
        <span>海报尺寸</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {POSTER_SIZES.map((size) => (
          <button
            key={size.key}
            onClick={() => onSizeSelect(size)}
            className={cn(
              "flex flex-col items-center p-3 rounded-xl border-2 transition-all",
              selectedSize === size.key
                ? "border-amber-500 bg-amber-50 shadow-sm"
                : "border-border bg-white/60 hover:border-amber-300"
            )}
          >
            <span className="text-xs font-medium text-foreground">{size.ratio}</span>
            <span className="text-[10px] text-muted-foreground mt-1">{size.name}</span>
            <span className="text-[9px] text-muted-foreground">{size.width}×{size.height}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
