import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.0';

const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface StreakMilestone {
  days: number;
  type: string;
  name: string;
  icon: string;
  description: string;
}

const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, type: 'streak_3_days', name: '三日之约', icon: '🔥', description: '连续3天完成情绪梳理' },
  { days: 7, type: 'streak_7_days', name: '一周坚持', icon: '✨', description: '连续7天完成情绪梳理' },
  { days: 30, type: 'streak_30_days', name: '月圆之旅', icon: '🌟', description: '连续30天完成情绪梳理' },
];

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users with profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id');

    if (profilesError) throw profilesError;

    console.log(`Checking streaks for ${profiles?.length || 0} users`);

    for (const profile of profiles || []) {
      const userId = profile.id;

      // Calculate current streak
      const streak = await calculateStreak(supabase, userId);
      console.log(`User ${userId} has a streak of ${streak} days`);

      // Check for milestone achievements
      for (const milestone of STREAK_MILESTONES) {
        if (streak >= milestone.days) {
          // Check if user already has this achievement
          const { data: existing } = await supabase
            .from('user_achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('achievement_type', milestone.type)
            .maybeSingle();

          if (!existing) {
            // Award new achievement
            const { error: insertError } = await supabase
              .from('user_achievements')
              .insert({
                user_id: userId,
                achievement_type: milestone.type,
                achievement_name: milestone.name,
                achievement_description: milestone.description,
                icon: milestone.icon,
              });

            if (insertError) {
              console.error(`Error awarding ${milestone.type} to user ${userId}:`, insertError);
            } else {
              console.log(`Awarded ${milestone.name} to user ${userId}`);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Checked ${profiles?.length || 0} users for streak achievements` 
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-streak-achievements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateStreak(supabase: any, userId: string): Promise<number> {
  // Get all briefings for the user, ordered by date
  const { data: briefings, error } = await supabase
    .from('briefings')
    .select('created_at, conversations!inner(user_id)')
    .eq('conversations.user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !briefings || briefings.length === 0) {
    return 0;
  }

  // Group briefings by date
  const briefingDates = new Set<string>();
  for (const briefing of briefings) {
    const date = new Date(briefing.created_at).toISOString().split('T')[0];
    briefingDates.add(date);
  }

  // Calculate streak from today backwards
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    if (briefingDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      // If today has no briefing yet, don't break the streak
      if (streak === 0 && dateStr === new Date().toISOString().split('T')[0]) {
        currentDate.setDate(currentDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return streak;
}
