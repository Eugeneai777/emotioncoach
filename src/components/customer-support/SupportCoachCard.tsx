import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SupportCoachCardProps {
  coach_key: string;
  reason: string;
}

interface CoachInfo {
  emoji: string;
  title: string;
  subtitle: string;
  page_route: string;
  gradient: string;
}

export const SupportCoachCard = ({ coach_key, reason }: SupportCoachCardProps) => {
  const navigate = useNavigate();
  const [coach, setCoach] = useState<CoachInfo | null>(null);

  useEffect(() => {
    const fetchCoach = async () => {
      const { data } = await supabase
        .from('coach_templates')
        .select('emoji, title, subtitle, page_route, gradient')
        .eq('coach_key', coach_key)
        .single();
      
      if (data) {
        setCoach(data);
      }
    };
    fetchCoach();
  }, [coach_key]);

  if (!coach) return null;

  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(coach.page_route)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{coach.emoji}</span>
            <span className="font-medium text-foreground">{coach.title}</span>
          </div>
          {coach.subtitle && (
            <p className="text-sm text-muted-foreground mb-2">{coach.subtitle}</p>
          )}
          <p className="text-sm text-primary/80">「{reason}」</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
