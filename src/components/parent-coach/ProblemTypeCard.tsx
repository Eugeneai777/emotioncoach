import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Target, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProblemTypeCardProps {
  primaryType: string;
  secondaryTypes?: string[];
  onReassess?: () => void;
}

export const ProblemTypeCard = ({ primaryType, secondaryTypes, onReassess }: ProblemTypeCardProps) => {
  const navigate = useNavigate();

  // Fetch problem type details
  const { data: problemTypes } = useQuery({
    queryKey: ["parent-problem-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parent_problem_types")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const primaryTypeInfo = problemTypes?.find((t: any) => t.type_key === primaryType);
  const secondaryTypeInfos = secondaryTypes
    ?.map((key) => problemTypes?.find((t: any) => t.type_key === key))
    .filter(Boolean);

  if (!primaryTypeInfo) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-foreground">专属教练方向</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (onReassess) {
                onReassess();
              } else {
                navigate("/parent/intake");
              }
            }}
            className="h-7 text-xs text-muted-foreground hover:text-purple-600"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            重新评估
          </Button>
        </div>

        {/* Primary Type */}
        <div className="space-y-2">
          <Badge className="bg-purple-500 hover:bg-purple-600">
            {primaryTypeInfo.type_name}
          </Badge>
          <p className="text-sm text-muted-foreground">
            {primaryTypeInfo.description}
          </p>
        </div>

        {/* Secondary Types */}
        {secondaryTypeInfos && secondaryTypeInfos.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {secondaryTypeInfos.map((info: any) => (
              <Badge key={info.type_key} variant="outline" className="border-purple-300 text-purple-600">
                {info.type_name}
              </Badge>
            ))}
          </div>
        )}

        {/* Coaching Direction */}
        {primaryTypeInfo.coaching_direction && typeof primaryTypeInfo.coaching_direction === 'string' && (
          <div className="bg-white/60 rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-purple-600 mb-1">
              <Lightbulb className="w-3 h-3" />
              <span className="font-medium">教练关注点</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {primaryTypeInfo.coaching_direction}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
