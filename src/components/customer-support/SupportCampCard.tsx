import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StartCampDialog } from "@/components/camp/StartCampDialog";

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
  original_price: number | null;
  price_note: string | null;
  icon: string | null;
  camp_type: string;
}

export const SupportCampCard = ({ camp_type, reason }: SupportCampCardProps) => {
  const navigate = useNavigate();
  const [camp, setCamp] = useState<CampInfo | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCamp = async () => {
      const { data } = await supabase
        .from('camp_templates')
        .select('id, camp_name, camp_subtitle, duration_days, price, original_price, price_note, icon, camp_type')
        .eq('camp_type', camp_type)
        .eq('is_active', true)
        .single();
      
      if (data) {
        setCamp(data as CampInfo);
      }
    };
    fetchCamp();
  }, [camp_type]);

  if (!camp) return null;

  const handleClick = () => {
    // 直达 StartCampDialog（StartCampDialog 内部会自动判断购买/免费/激活）
    setDialogOpen(true);
  };

  return (
    <>
      <div 
        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:shadow-md transition-all cursor-pointer"
        onClick={handleClick}
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

      <StartCampDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campTemplate={{
          camp_type: camp.camp_type,
          camp_name: camp.camp_name,
          duration_days: camp.duration_days,
          icon: camp.icon || undefined,
          price: camp.price,
          original_price: camp.original_price || undefined,
          price_note: camp.price_note || undefined,
        }}
        onSuccess={() => {
          setDialogOpen(false);
          navigate('/camps');
        }}
      />
    </>
  );
};
