import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * 获取用户的时区设置
 * @returns 用户时区字符串，默认为 'Asia/Shanghai'
 */
export const useUserTimezone = () => {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string>("Asia/Shanghai");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTimezone = async () => {
      if (!user) {
        setTimezone("Asia/Shanghai");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("timezone")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error("Error fetching user timezone:", error);
        // 默认使用中国标准时间
        setTimezone("Asia/Shanghai");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTimezone();
  }, [user]);

  return { timezone, loading };
};
