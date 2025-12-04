import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Volume2, Music2, Clock, Sparkles } from 'lucide-react';
import { useFrequencyTone } from '@/hooks/useFrequencyTone';
import { FrequencyWaveVisualizer } from './FrequencyWaveVisualizer';
import { 
  getRecommendedFrequencies, 
  ALL_FREQUENCIES,
  FrequencyConfig 
} from '@/config/frequencyHealingConfig';

interface FrequencyMusicPlayerProps {
  emotionTheme: string;
  className?: string;
  compact?: boolean;
}

export const FrequencyMusicPlayer: React.FC<FrequencyMusicPlayerProps> = ({
  emotionTheme,
  className = '',
  compact = false,
}) => {
  const recommendedFrequencies = useMemo(() => 
    getRecommendedFrequencies(emotionTheme), 
    [emotionTheme]
  );
  
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyConfig>(
    recommendedFrequencies[0] || ALL_FREQUENCIES[0]
  );

  const {
    isPlaying,
    toggle,
    setVolume,
    setFrequency,
    analyserNode,
    currentVolume,
  } = useFrequencyTone({
    frequency: selectedFrequency.frequency,
    volume: 0.3,
  });

  const handleFrequencyChange = (freq: FrequencyConfig) => {
    setSelectedFrequency(freq);
    setFrequency(freq.frequency);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
  };

  if (compact) {
    return (
      <Card className={`bg-white/60 backdrop-blur border-white/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className={`h-12 w-12 rounded-full bg-gradient-to-r ${selectedFrequency.gradient} text-white hover:opacity-90`}
              onClick={toggle}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </Button>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{selectedFrequency.frequency}Hz</span>
                <span className="text-xs text-muted-foreground">{selectedFrequency.chineseName}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{selectedFrequency.effect}</p>
            </div>

            <div className="flex items-center gap-2 w-24">
              <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Slider
                value={[currentVolume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-white/60 backdrop-blur border-white/20 overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Music2 className="h-5 w-5 text-teal-500" />
          频率疗愈推荐
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          根据你的情绪「{emotionTheme}」，推荐以下疗愈频率
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 主播放区域 */}
        <div className={`p-4 rounded-xl bg-gradient-to-br ${selectedFrequency.gradient} bg-opacity-10`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-white/80" />
                <span className="text-xl font-bold text-white">{selectedFrequency.frequency}Hz</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  {selectedFrequency.chineseName}
                </Badge>
              </div>
              <p className="text-sm text-white/80 mt-1">{selectedFrequency.effect}</p>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-14 w-14 rounded-full bg-white/20 hover:bg-white/30 text-white"
              onClick={toggle}
            >
              {isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 ml-1" />
              )}
            </Button>
          </div>

          {/* 波形可视化 */}
          <div className="bg-white/10 rounded-lg overflow-hidden">
            <FrequencyWaveVisualizer
              analyserNode={analyserNode}
              isPlaying={isPlaying}
              frequency={selectedFrequency.frequency}
              gradient={selectedFrequency.gradient}
            />
          </div>

          {/* 音量控制 */}
          <div className="flex items-center gap-3 mt-3">
            <Volume2 className="h-4 w-4 text-white/70" />
            <Slider
              value={[currentVolume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-white/70 w-8">{Math.round(currentVolume * 100)}%</span>
          </div>

          {/* 建议时长 */}
          <div className="flex items-center gap-2 mt-3 text-white/70">
            <Clock className="h-4 w-4" />
            <span className="text-xs">建议聆听 5-15 分钟，配合深呼吸效果更佳</span>
          </div>
        </div>

        {/* 推荐频率选择 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">推荐频率</p>
          <div className="flex flex-wrap gap-2">
            {recommendedFrequencies.map((freq) => (
              <Button
                key={freq.frequency}
                variant={selectedFrequency.frequency === freq.frequency ? 'default' : 'outline'}
                size="sm"
                className={selectedFrequency.frequency === freq.frequency 
                  ? `bg-gradient-to-r ${freq.gradient} border-0 text-white`
                  : ''
                }
                onClick={() => handleFrequencyChange(freq)}
              >
                {freq.frequency}Hz
              </Button>
            ))}
          </div>
        </div>

        {/* 其他频率 */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">全部频率</p>
          <div className="flex flex-wrap gap-2">
            {ALL_FREQUENCIES.filter(f => !recommendedFrequencies.includes(f)).map((freq) => (
              <Button
                key={freq.frequency}
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => handleFrequencyChange(freq)}
              >
                {freq.frequency}Hz · {freq.chineseName}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
