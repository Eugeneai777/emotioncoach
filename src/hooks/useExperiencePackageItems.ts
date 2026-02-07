import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { experiencePackageItems as fallbackItems } from "@/config/youjinPartnerProducts";

export interface ExperienceItem {
  item_key: string;
  package_key: string;
  name: string;
  value: string;
  icon: string;
  description: string;
  features: string[];
  color_theme: string;
}

const FALLBACK_PACKAGE_KEY_MAP: Record<string, string> = {
  'ai_points': 'basic',
  'emotion_health': 'emotion_health_assessment',
  'scl90': 'scl90_report',
  'wealth_block': 'wealth_block_assessment',
};

const FALLBACK_COLOR_MAP: Record<string, string> = {
  'ai_points': 'blue',
  'emotion_health': 'green',
  'scl90': 'amber',
  'wealth_block': 'purple',
};

export function useExperiencePackageItems() {
  const { data, isLoading } = useQuery({
    queryKey: ['experience-package-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_experience_items' as any)
        .select('item_key, package_key, name, value, icon, description, features, color_theme')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return (data || []) as unknown as ExperienceItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items: ExperienceItem[] = data && data.length > 0
    ? data
    : fallbackItems.map(item => ({
        item_key: item.key,
        package_key: FALLBACK_PACKAGE_KEY_MAP[item.key] || item.key,
        name: item.name,
        value: item.value,
        icon: item.icon,
        description: item.description,
        features: item.features,
        color_theme: FALLBACK_COLOR_MAP[item.key] || 'blue',
      }));

  // Derived: all package_keys for backend use
  const allPackageKeys = items.map(i => i.package_key);

  return { items, isLoading, allPackageKeys };
}
