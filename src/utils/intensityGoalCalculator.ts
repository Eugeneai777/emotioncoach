import { supabase } from "@/integrations/supabase/client";

export interface IntensityGoalProgress {
  current: number;
  target: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'exceeded';
  details: string;
  dailyData?: Array<{
    date: string;
    avgIntensity: number;
    logCount: number;
  }>;
}

// 计算平均强度目标进度
export const calculateAverageIntensityProgress = async (
  userId: string,
  startDate: string,
  endDate: string,
  minTarget: number,
  maxTarget: number
): Promise<IntensityGoalProgress> => {
  const { data, error } = await supabase
    .from("emotion_quick_logs")
    .select("emotion_intensity, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (error || !data || data.length === 0) {
    return {
      current: 0,
      target: (minTarget + maxTarget) / 2,
      percentage: 0,
      status: 'warning',
      details: '暂无数据',
    };
  }

  // 检查记录天数是否充足
  const uniqueDays = new Set(
    data.map(log => log.created_at.split('T')[0])
  ).size;
  
  // 根据日期范围判断是周目标还是月目标
  const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const MIN_TRACKING_DAYS = daysDiff <= 10 ? 3 : 10; // 周目标3天，月目标10天
  
  if (uniqueDays < MIN_TRACKING_DAYS) {
    return {
      current: 0,
      target: (minTarget + maxTarget) / 2,
      percentage: Math.min(50, (uniqueDays / MIN_TRACKING_DAYS) * 50),
      status: 'warning',
      details: `数据积累中：已记录 ${uniqueDays}/${MIN_TRACKING_DAYS} 天`,
    };
  }

  const avgIntensity = data.reduce((sum, log) => sum + log.emotion_intensity, 0) / data.length;
  const targetCenter = (minTarget + maxTarget) / 2;

  let status: 'on_track' | 'warning' | 'exceeded';
  let percentage: number;

  if (avgIntensity >= minTarget && avgIntensity <= maxTarget) {
    status = 'on_track';
    percentage = 100;
  } else {
    status = avgIntensity < minTarget ? 'warning' : 'exceeded';
    const distance = Math.abs(avgIntensity - targetCenter);
    const maxDistance = Math.max(Math.abs(minTarget - targetCenter), Math.abs(maxTarget - targetCenter));
    percentage = Math.max(0, 100 - (distance / maxDistance) * 100);
  }

  return {
    current: Math.round(avgIntensity * 10) / 10,
    target: targetCenter,
    percentage: Math.round(percentage),
    status,
    details: `当前平均强度 ${avgIntensity.toFixed(1)} 分`,
  };
};

// 计算区间天数目标进度
export const calculateRangeDaysProgress = async (
  userId: string,
  startDate: string,
  endDate: string,
  minIntensity: number,
  maxIntensity: number,
  targetDays: number
): Promise<IntensityGoalProgress> => {
  const { data, error } = await supabase
    .from("emotion_quick_logs")
    .select("emotion_intensity, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at");

  if (error || !data) {
    return {
      current: 0,
      target: targetDays,
      percentage: 0,
      status: 'warning',
      details: '暂无数据',
    };
  }

  // 检查记录天数是否充足
  const uniqueDays = new Set(
    data.map(log => log.created_at.split('T')[0])
  ).size;
  
  const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const MIN_TRACKING_DAYS = daysDiff <= 10 ? 3 : 10;
  
  if (uniqueDays < MIN_TRACKING_DAYS) {
    return {
      current: 0,
      target: targetDays,
      percentage: Math.min(50, (uniqueDays / MIN_TRACKING_DAYS) * 50),
      status: 'warning',
      details: `数据积累中：已记录 ${uniqueDays}/${MIN_TRACKING_DAYS} 天`,
    };
  }

  // 按天分组，计算每天的平均强度
  const dayMap = new Map<string, number[]>();
  data.forEach(log => {
    const day = log.created_at.split('T')[0];
    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }
    dayMap.get(day)!.push(log.emotion_intensity);
  });

  // 统计符合区间的天数
  let daysInRange = 0;
  const dailyData: Array<{ date: string; avgIntensity: number; logCount: number }> = [];

  dayMap.forEach((intensities, date) => {
    const avgIntensity = intensities.reduce((sum, val) => sum + val, 0) / intensities.length;
    dailyData.push({ date, avgIntensity, logCount: intensities.length });

    if (avgIntensity >= minIntensity && avgIntensity <= maxIntensity) {
      daysInRange++;
    }
  });

  const percentage = Math.min(100, (daysInRange / targetDays) * 100);
  const status: 'on_track' | 'warning' | 'exceeded' = 
    daysInRange >= targetDays ? 'on_track' : 
    daysInRange >= targetDays * 0.7 ? 'warning' : 'exceeded';

  return {
    current: daysInRange,
    target: targetDays,
    percentage: Math.round(percentage),
    status,
    details: `${daysInRange}/${targetDays} 天在理想区间`,
    dailyData,
  };
};

// 计算峰值控制目标进度
export const calculatePeakControlProgress = async (
  userId: string,
  startDate: string,
  endDate: string,
  peakThreshold: number,
  maxPeakDays: number
): Promise<IntensityGoalProgress> => {
  const { data, error } = await supabase
    .from("emotion_quick_logs")
    .select("emotion_intensity, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at");

  if (error || !data) {
    return {
      current: 0,
      target: maxPeakDays,
      percentage: 100,
      status: 'on_track',
      details: '暂无数据',
    };
  }

  // 检查记录天数是否充足
  const uniqueDays = new Set(
    data.map(log => log.created_at.split('T')[0])
  ).size;
  
  const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
  const MIN_TRACKING_DAYS = daysDiff <= 10 ? 3 : 10;
  
  if (uniqueDays < MIN_TRACKING_DAYS) {
    return {
      current: 0,
      target: maxPeakDays,
      percentage: Math.min(50, (uniqueDays / MIN_TRACKING_DAYS) * 50),
      status: 'warning',
      details: `数据积累中：已记录 ${uniqueDays}/${MIN_TRACKING_DAYS} 天`,
    };
  }

  // 按天分组
  const dayMap = new Map<string, number[]>();
  data.forEach(log => {
    const day = log.created_at.split('T')[0];
    if (!dayMap.has(day)) {
      dayMap.set(day, []);
    }
    dayMap.get(day)!.push(log.emotion_intensity);
  });

  // 统计超过阈值的天数
  let peakDays = 0;
  dayMap.forEach((intensities) => {
    const maxIntensity = Math.max(...intensities);
    if (maxIntensity > peakThreshold) {
      peakDays++;
    }
  });

  const percentage = peakDays <= maxPeakDays ? 100 : Math.max(0, 100 - ((peakDays - maxPeakDays) / maxPeakDays) * 100);
  const status: 'on_track' | 'warning' | 'exceeded' = 
    peakDays <= maxPeakDays ? 'on_track' : 
    peakDays <= maxPeakDays * 1.5 ? 'warning' : 'exceeded';

  return {
    current: peakDays,
    target: maxPeakDays,
    percentage: Math.round(percentage),
    status,
    details: peakDays <= maxPeakDays 
      ? `很好！高强度天数 ${peakDays}/${maxPeakDays}` 
      : `高强度天数 ${peakDays} 超过目标`,
  };
};