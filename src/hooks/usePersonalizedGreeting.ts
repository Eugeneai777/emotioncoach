import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
const DEFAULT_GREETING = "嗨，今天感觉怎么样？";

const fetchPersonalizedGreeting = async (): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-greeting');
    
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
    queryKey: ['personalizedGreeting', user?.id],
    queryFn: fetchPersonalizedGreeting,
    enabled: !!user,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
  });

  return {
    greeting: user ? (greeting || DEFAULT_GREETING) : DEFAULT_GREETING,
    isLoading: user ? isLoading : false,
    DEFAULT_GREETING,
  };
};
