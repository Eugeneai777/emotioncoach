import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
const DEFAULT_GREETING = "嗨，今天感觉怎么样？";

const fetchPersonalizedGreeting = async (): Promise<string> => {
  try {
    const localHour = new Date().getHours();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { data, error } = await supabase.functions.invoke('generate-greeting', {
      body: { localHour, timezone },
    });
    
    if (error) {
      console.error("Error fetching greeting:", error);
      return DEFAULT_GREETING;
    }

    return data?.greeting || DEFAULT_GREETING;
  } catch (error) {
    console.error("Error in fetchPersonalizedGreeting:", error);
    return DEFAULT_GREETING;
  }
};

export const usePersonalizedGreeting = () => {
  const { user } = useAuth();

  const { data: greeting, isLoading } = useQuery({
    queryKey: ['personalizedGreeting', user?.id ?? 'anonymous'],
    queryFn: fetchPersonalizedGreeting,
    enabled: true,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  return {
    greeting: greeting || DEFAULT_GREETING,
    isLoading,
    DEFAULT_GREETING,
  };
};
