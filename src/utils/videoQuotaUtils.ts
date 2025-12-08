import { supabase } from "@/integrations/supabase/client";

interface DeductVideoQuotaResult {
  success: boolean;
  error?: string;
  isFirstWatch: boolean;
}

/**
 * 统一的视频扣费工具函数
 * 每部视频只在用户首次观看时扣费，重复观看不再扣费
 */
export const deductVideoQuota = async (
  userId: string,
  videoId: string,
  videoTitle: string,
  source: string
): Promise<DeductVideoQuotaResult> => {
  try {
    // 1. 检查是否已经看过这个视频（已扣费）
    const { data: existingWatch, error: checkError } = await supabase
      .from('video_watch_history')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .limit(1);

    if (checkError) {
      console.error('检查观看历史失败:', checkError);
      // 检查失败时，为安全起见不阻止观看，但不扣费
      return { success: true, isFirstWatch: false };
    }

    // 已看过，不需要扣费
    if (existingWatch && existingWatch.length > 0) {
      return { success: true, isFirstWatch: false };
    }

    // 2. 首次观看，需要扣费
    const { data, error: deductError } = await supabase.functions.invoke('deduct-quota', {
      body: {
        feature_key: 'video_courses',
        source: source,
        metadata: { 
          video_id: videoId, 
          video_title: videoTitle 
        }
      }
    });

    if (deductError) {
      console.error('扣费失败:', deductError);
      return { 
        success: false, 
        error: '额度不足，请充值后观看', 
        isFirstWatch: true 
      };
    }

    // 检查返回数据中是否有错误信息
    if (data?.error) {
      console.error('扣费返回错误:', data.error);
      return { 
        success: false, 
        error: data.message || '额度不足，请充值后观看', 
        isFirstWatch: true 
      };
    }

    return { success: true, isFirstWatch: true };
  } catch (error) {
    console.error('视频扣费异常:', error);
    return { 
      success: false, 
      error: '操作失败，请稍后重试', 
      isFirstWatch: true 
    };
  }
};
