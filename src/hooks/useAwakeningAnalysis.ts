import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AwakeningType, LifeCard } from '@/config/awakeningConfig';

interface AnalyzeParams {
  type: AwakeningType;
  input: string;
  userId?: string;
}

export const useAwakeningAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async ({ type, input, userId }: AnalyzeParams): Promise<LifeCard | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('awakening-analysis', {
        body: {
          type,
          input,
          userId
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.lifeCard as LifeCard;
    } catch (err) {
      const message = err instanceof Error ? err.message : '分析失败';
      setError(message);
      console.error('Awakening analysis error:', err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyze,
    isAnalyzing,
    error
  };
};
