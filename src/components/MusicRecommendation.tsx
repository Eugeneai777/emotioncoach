import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Music, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface MusicRecommendation {
  song_name: string;
  artist: string;
  genre: string;
  reason: string;
  mood_tag: string;
}

interface MusicRecommendationProps {
  emotionTheme: string;
  insight?: string;
  briefingContent?: string;
}

export const MusicRecommendation = ({ emotionTheme, insight, briefingContent }: MusicRecommendationProps) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MusicRecommendation[]>([]);
  const [overallSuggestion, setOverallSuggestion] = useState("");
  const { toast } = useToast();

  const getMusicRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('recommend-music', {
        body: {
          emotion_theme: emotionTheme,
          insight,
          briefing_content: briefingContent
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast({
          title: "提示",
          description: data.error,
          variant: "default",
        });
        return;
      }

      setRecommendations(data.recommendations || []);
      setOverallSuggestion(data.overall_suggestion || "");
      
      toast({
        title: "推荐完成 🎵",
        description: "已为你推荐情绪音乐",
      });
    } catch (error) {
      console.error('推荐失败:', error);
      toast({
        title: "推荐失败",
        description: "请稍后再试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodTagColor = (tag: string) => {
    if (tag.includes('舒缓') || tag.includes('平静') || tag.includes('放松')) return 'bg-blue-100 text-blue-700';
    if (tag.includes('治愈') || tag.includes('温暖') || tag.includes('安慰')) return 'bg-green-100 text-green-700';
    if (tag.includes('激励') || tag.includes('振奋') || tag.includes('能量')) return 'bg-orange-100 text-orange-700';
    if (tag.includes('思考') || tag.includes('沉静') || tag.includes('深度')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const searchMusic = (songName: string, artist: string) => {
    const query = encodeURIComponent(`${songName} ${artist}`);
    window.open(`https://music.youtube.com/search?q=${query}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {!recommendations.length && (
        <Button 
          onClick={getMusicRecommendations}
          disabled={loading}
          className="w-full gap-2"
          variant="outline"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              推荐中...
            </>
          ) : (
            <>
              <Music className="w-4 h-4" />
              为我推荐情绪音乐 🎵
            </>
          )}
        </Button>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {overallSuggestion && (
            <Card className="p-4 bg-gradient-to-br from-primary/5 to-background border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Music className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">劲老师的音乐建议</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {overallSuggestion}
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <Card 
                key={idx}
                className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => searchMusic(rec.song_name, rec.artist)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-sm font-semibold text-primary">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {rec.song_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {rec.artist} · {rec.genre}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed ml-10 mb-2">
                      {rec.reason}
                    </p>
                    <div className="ml-10">
                      <Badge className={`${getMoodTagColor(rec.mood_tag)} border-0`}>
                        {rec.mood_tag}
                      </Badge>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            点击歌曲卡片在 YouTube Music 中搜索 🎵
          </div>
        </div>
      )}
    </div>
  );
};
