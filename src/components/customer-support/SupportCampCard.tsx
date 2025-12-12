import { ArrowRight, Tent } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SupportCampCardProps {
  camp_type: string;
  reason: string;
}

interface CampInfo {
  id: string;
  camp_name: string;
  camp_subtitle: string | null;
  duration_days: number;
  price: number;
  icon: string | null;
  camp_type: string;
}

export const SupportCampCard = ({ camp_type, reason }: SupportCampCardProps) => {
  const navigate = useNavigate();
  const [camp, setCamp] = useState<CampInfo | null>(null);

  useEffect(() => {
    const fetchCamp = async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('id, camp_name, camp_subtitle, duration_days, price, icon, camp_type')
        .eq('camp_type', camp_type)
        .eq('is_active', true)
        .single();
      
      if (data) {
        setCamp(data);
      }
    };
    fetchCamp();
  }, [camp_type]);

  if (!camp) return null;

  return (
    <div 
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate('/training-camps')}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{camp.icon || '🏕️'}</span>
            <span className="font-medium text-foreground">{camp.camp_name}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {camp.duration_days}天系统训练 · {camp.price === 0 ? '免费参加' : `¥${camp.price}`}
          </p>
          <p className="text-sm text-primary/80">「{reason}」</p>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
