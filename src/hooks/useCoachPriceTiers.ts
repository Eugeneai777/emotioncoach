import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CoachPriceTier {
  id: string;
  tier_name: string;
  tier_level: number;
  price: number;
  description: string | null;
  duration_minutes: number;
  is_active: boolean;
  display_order: number;
}

export function useCoachPriceTiers() {
  return useQuery({
    queryKey: ["coach-price-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_price_tiers")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      return data as CoachPriceTier[];
    }
  });
}

export function useUpdateCoachPriceTier(coachId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ priceTierId }: { priceTierId: string }) => {
      // Get the tier price
      const { data: tier, error: tierError } = await supabase
        .from("coach_price_tiers")
        .select("price")
        .eq("id", priceTierId)
        .single();
      
      if (tierError) throw tierError;

      // Update coach with new tier
      const { error: coachError } = await supabase
        .from("human_coaches")
        .update({
          price_tier_id: priceTierId,
          price_tier_set_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", coachId);
      
      if (coachError) throw coachError;

      // Sync all service prices
      const { error: servicesError } = await supabase
        .from("coach_services")
        .update({ price: tier.price })
        .eq("coach_id", coachId);
      
      if (servicesError) throw servicesError;

      return { price: tier.price };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["human-coaches"] });
      queryClient.invalidateQueries({ queryKey: ["human-coach-detail", coachId] });
      queryClient.invalidateQueries({ queryKey: ["human-coach-edit", coachId] });
      toast.success("收费档次已更新");
    },
    onError: (error: Error) => {
      toast.error("更新失败: " + error.message);
    }
  });
}

export function useAdminUpdatePriceTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      tierId, 
      updates 
    }: { 
      tierId: string; 
      updates: Partial<CoachPriceTier>;
    }) => {
      const { error } = await supabase
        .from("coach_price_tiers")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", tierId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach-price-tiers"] });
      toast.success("档次信息已更新");
    },
    onError: (error: Error) => {
      toast.error("更新失败: " + error.message);
    }
  });
}
