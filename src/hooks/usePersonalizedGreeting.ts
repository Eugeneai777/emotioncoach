import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** 根据当前时段生成兜底问候语 */
const getTimeAwareGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了，记得早点休息哦';
  if (hour < 11) return '早上好，新的一天开始了';
  if (hour < 14) return '中午好，记得好好吃饭哦';
  if (hour < 18) return '下午好，今天辛苦了';
  return '晚上好，放松一下吧';
};

const fetchPersonalizedGreeting = async (): Promise<string> => {
  try {
    const localHour = new Date().getHours();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { data, error } = await supabase.functions.invoke('generate-greeting', {
      body: { localHour, timezone },
    });
    
    if (error) {
      console.error("Error fetching greeting:", error);
      return getTimeAwareGreeting();
    }

    return data?.greeting || getTimeAwareGreeting();
  } catch (error) {
    console.error("Error in fetchPersonalizedGreeting:", error);
    return getTimeAwareGreeting();
  }
};

export const usePersonalizedGreeting = () => {
  const { user } = useAuth();

  const { data: greeting, isLoading } = useQuery({
    queryKey: ['personalizedGreeting', user?.id ?? 'anonymous'],
    queryFn: fetchPersonalizedGreeting,
    enabled: true,
    staleTime: 300000,        // 5 分钟内所有组件共享同一条问候
    gcTime: 600000,           // 缓存保留 10 分钟
    refetchOnWindowFocus: false,
    refetchOnMount: false,    // 已有缓存时不重新请求
  });

  return {
    greeting: greeting || getTimeAwareGreeting(),
    isLoading,
    DEFAULT_GREETING: getTimeAwareGreeting(),
  };
};
