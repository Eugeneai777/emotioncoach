import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
const DEFAULT_GREETING = "嗨，今天感觉怎么样？";
const CACHE_KEY = "personalized_greeting";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedGreeting {
  greeting: string;
  timestamp: number;
}

const getCachedGreeting = (): string | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { greeting, timestamp }: CachedGreeting = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;
    
    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return greeting;
  } catch {
    return null;
  }
};

const setCachedGreeting = (greeting: string) => {
  try {
    const cached: CachedGreeting = {
      greeting,
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch {
    // Ignore storage errors
  }
};

const fetchPersonalizedGreeting = async (): Promise<string> => {
  // Check cache first
  const cached = getCachedGreeting();
  if (cached) {
    return cached;
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-greeting');
    
    if (error) {
      console.error("Error fetching greeting:", error);
      return DEFAULT_GREETING;
    }

    const greeting = data?.greeting || DEFAULT_GREETING;
    
    // Only cache personalized greetings
    if (data?.greeting) {
      setCachedGreeting(greeting);
    }
    
    return greeting;
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
    staleTime: CACHE_DURATION,
    gcTime: CACHE_DURATION,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    greeting: user ? (greeting || DEFAULT_GREETING) : DEFAULT_GREETING,
    isLoading: user ? isLoading : false,
    DEFAULT_GREETING,
  };
};
