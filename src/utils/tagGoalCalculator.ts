import { supabase } from "@/integrations/supabase/client";
import type { TagGoalProgress, WeeklyTagData } from "@/types/tagGoals";

export type { TagGoalProgress, WeeklyTagData };

export async function calculateTagReductionProgress(
  userId: string,
  targetTagId: string,
  targetWeeklyCount: number,
  startDate: string,
  endDate: string
): Promise<TagGoalProgress> {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // 计算本周范围
  const currentWeekStart = new Date(now);
  currentWeekStart.setDate(currentWeekStart.getDate() - now.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);

  // 获取本周该标签的使用次数
  const { data: currentWeekBriefings, error: currentError } = await supabase
    .from('briefing_tags')
    .select(`
      briefing_id,
      briefings!inner(
        created_at,
        conversation_id,
        conversations!inner(user_id)
      )
    `)
    .eq('tag_id', targetTagId)
    .gte('briefings.created_at', currentWeekStart.toISOString())
    .eq('briefings.conversations.user_id', userId);

  if (currentError) throw currentError;

  const currentWeeklyCount = currentWeekBriefings?.length || 0;

  // 验证数据充足性 - 检查本周记录天数
  const MIN_CHECK_IN_DAYS = 3;
  const uniqueDays = new Set(
    currentWeekBriefings?.map((bt: any) => 
      new Date(bt.briefings.created_at).toLocaleDateString()
    )
  ).size;
  
  const hasEnoughData = uniqueDays >= MIN_CHECK_IN_DAYS;

  // 获取过去4周的数据
  const weeklyData: WeeklyTagData[] = [];
  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (weekOffset * 7));
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const { data: weekBriefings, error: weekError } = await supabase
      .from('briefing_tags')
      .select(`
        briefing_id,
        briefings!inner(
          created_at,
          conversation_id,
          conversations!inner(user_id)
        )
      `)
      .eq('tag_id', targetTagId)
      .gte('briefings.created_at', weekStart.toISOString())
      .lte('briefings.created_at', weekEnd.toISOString())
      .eq('briefings.conversations.user_id', userId);

    if (weekError) {
      console.error(`Error fetching week ${weekOffset} data:`, weekError);
      continue;
    }

    const count = weekBriefings?.length || 0;
    const previousCount = weeklyData[weeklyData.length - 1]?.count || count;
    const changePercent = previousCount > 0 
      ? ((count - previousCount) / previousCount) * 100 
      : 0;

    let status: 'success' | 'warning' | 'exceeded';
    if (count <= targetWeeklyCount) {
      status = 'success';
    } else if (count <= targetWeeklyCount * 1.2) {
      status = 'warning';
    } else {
      status = 'exceeded';
    }

    const dates = weekBriefings?.map((bt: any) => 
      new Date(bt.briefings.created_at).toLocaleDateString('zh-CN', { weekday: 'short' })
    ) || [];

    weeklyData.unshift({
      weekNumber: 4 - weekOffset,
      weekLabel: weekOffset === 0 ? '本周' : `${weekOffset}周前`,
      count,
      targetCount: targetWeeklyCount,
      status,
      changePercent: Math.round(changePercent * 10) / 10,
      dates,
    });
  }

  // 计算整体变化百分比
  const firstWeekCount = weeklyData[0]?.count || 0;
  const changePercent = firstWeekCount > 0
    ? ((currentWeeklyCount - firstWeekCount) / firstWeekCount) * 100
    : 0;

  // 如果数据不足，返回数据积累中状态
  if (!hasEnoughData) {
    return {
      currentWeeklyCount,
      targetWeeklyCount,
      percentage: Math.min(50, (uniqueDays / MIN_CHECK_IN_DAYS) * 50),
      status: 'in_progress',
      weeklyData,
      changePercent: 0,
      insights: [
        `📊 数据积累中：本周已记录 ${uniqueDays}/${MIN_CHECK_IN_DAYS} 天`,
        `还需记录 ${MIN_CHECK_IN_DAYS - uniqueDays} 天即可评估目标完成情况`,
        '继续坚持记录，让我们看到真实的进展！'
      ],
    };
  }

  // 计算完成百分比
  let percentage = 0;
  if (currentWeeklyCount <= targetWeeklyCount) {
    percentage = 100;
  } else {
    const excess = currentWeeklyCount - targetWeeklyCount;
    const baseline = weeklyData[0]?.count || currentWeeklyCount;
    const improvement = baseline - currentWeeklyCount;
    percentage = Math.max(0, (improvement / baseline) * 100);
  }

  // 确定状态
  let status: 'success' | 'warning' | 'exceeded' | 'in_progress';
  if (currentWeeklyCount <= targetWeeklyCount) {
    status = 'success';
  } else if (currentWeeklyCount <= targetWeeklyCount * 1.2) {
    status = 'warning';
  } else {
    status = 'exceeded';
  }

  // 生成洞察
  const insights = generateInsights(weeklyData, currentWeeklyCount, targetWeeklyCount);

  return {
    currentWeeklyCount,
    targetWeeklyCount,
    percentage: Math.round(percentage),
    status,
    weeklyData,
    changePercent: Math.round(changePercent * 10) / 10,
    insights,
  };
}

export async function calculateTagIncreaseProgress(
  userId: string,
  targetTagId: string,
  targetWeeklyCount: number,
  startDate: string,
  endDate: string
): Promise<TagGoalProgress> {
  // 与reduction类似，但状态判断相反
  const progress = await calculateTagReductionProgress(
    userId,
    targetTagId,
    targetWeeklyCount,
    startDate,
    endDate
  );

  // 如果progress已经是in_progress（数据不足），直接返回
  if (progress.status === 'in_progress' && progress.percentage < 50) {
    return progress;
  }

  // 反转状态逻辑（增长目标）
  let status: 'success' | 'warning' | 'exceeded' | 'in_progress';
  if (progress.currentWeeklyCount >= targetWeeklyCount) {
    status = 'success';
  } else if (progress.currentWeeklyCount >= targetWeeklyCount * 0.8) {
    status = 'warning';
  } else {
    status = 'in_progress';
  }

  const percentage = Math.min(100, (progress.currentWeeklyCount / targetWeeklyCount) * 100);

  return {
    ...progress,
    status,
    percentage: Math.round(percentage),
    insights: generateIncreaseInsights(progress.weeklyData, progress.currentWeeklyCount, targetWeeklyCount),
  };
}

function generateInsights(
  weeklyData: WeeklyTagData[],
  current: number,
  target: number
): string[] {
  const insights: string[] = [];

  // 趋势分析
  const trend = weeklyData.map(w => w.count);
  const isDecreasing = trend[trend.length - 1] < trend[0];
  const isIncreasing = trend[trend.length - 1] > trend[0];

  if (isDecreasing) {
    const reduction = ((trend[0] - trend[trend.length - 1]) / trend[0]) * 100;
    insights.push(`你在过去4周持续改善，标签使用减少了${Math.round(reduction)}%`);
  } else if (isIncreasing) {
    insights.push('最近标签使用有所增加，可能需要关注一下触发因素');
  }

  // 高发日期分析
  const allDates = weeklyData.flatMap(w => w.dates);
  const dateCounts: Record<string, number> = {};
  allDates.forEach(date => {
    dateCounts[date] = (dateCounts[date] || 0) + 1;
  });
  const topDates = Object.entries(dateCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([date]) => date);

  if (topDates.length > 0) {
    insights.push(`${topDates.join('和')}是该标签的高发时段`);
  }

  // 目标达成建议
  if (current > target) {
    insights.push('建议：回顾本周的情绪记录，找出可能的触发因素');
  } else {
    insights.push('继续保持当前的情绪管理策略');
  }

  return insights;
}

function generateIncreaseInsights(
  weeklyData: WeeklyTagData[],
  current: number,
  target: number
): string[] {
  const insights: string[] = [];

  const trend = weeklyData.map(w => w.count);
  const isIncreasing = trend[trend.length - 1] > trend[0];

  if (isIncreasing) {
    const increase = ((trend[trend.length - 1] - trend[0]) / Math.max(trend[0], 1)) * 100;
    insights.push(`太棒了！你在这方面的正向体验增加了${Math.round(increase)}%`);
  } else {
    insights.push('让我们一起创造更多这样的积极时刻');
  }

  if (current >= target) {
    insights.push('你已经达成目标，保持这样的积极状态');
  } else {
    const remaining = target - current;
    insights.push(`距离目标还差${remaining}次，加油！`);
  }

  return insights;
}
