

# Plan: Add Human Coach Connections on Day 3 and Day 7 of emotion_stress_7 Camp

## Overview
In the 7-day emotion stress relief camp (`emotion_stress_7`), add special task cards on **Day 3** (team Havruta session) and **Day 7** (1-on-1 coaching session) that guide users to connect with real human coaches.

## Current Architecture
- `CampCheckIn.tsx` renders task cards (冥想, 情绪教练对话, 分享, 课程) for each day
- Team coaching (海沃塔) already exists at `/team-coaching` with session listing and detail pages
- 1-on-1 human coach booking exists at `/human-coach/:id` with `BookingDialog`
- `camp_daily_progress` table tracks task completion per day

## Changes

### 1. Add DB field for human coach task tracking
Add a migration to support tracking human coach engagement on special days:

```sql
ALTER TABLE camp_daily_progress 
ADD COLUMN IF NOT EXISTS human_coach_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS human_coach_completed_at timestamptz;
```

### 2. Modify `CampCheckIn.tsx` — Add conditional task cards

In the `emotion_stress_7` task list section (lines ~626-694), insert conditional task cards:

- **Day 3**: Insert a "团队海沃塔" task card after the 情绪教练对话 card
  - Icon: 👥 or Users icon
  - Badge: "特别活动"
  - Action: Navigate to `/team-coaching` (filtered for camp-related sessions)
  - Trackable via `human_coach_completed` field with checkbox toggle
  - Marked as optional but highlighted with a special visual treatment

- **Day 7**: Insert a "一对一教练" task card after the 情绪教练对话 card
  - Icon: 🎯 or Phone icon  
  - Badge: "毕业福利"
  - Action: Navigate to `/human-coach` (coach listing page) or a specific coach
  - Same tracking field `human_coach_completed`
  - Also optional but with premium visual styling

### 3. Task card rendering logic

```typescript
const isDay3 = displayCurrentDay === 3;
const isDay7 = displayCurrentDay === 7;

// After emotion coach dialog task card:
{hasMeditation && isDay3 && (
  <TaskCard
    step={3}
    title="团队海沃塔"
    description="加入团队教练对话，与同伴一起成长"
    completed={!!todayProgress?.human_coach_completed}
    icon={<Users />}
    badgeText="特别活动" badgeColor="emerald"
    actionLabel="查看活动"
    isPrimary
    onAction={() => navigate('/team-coaching')}
    onToggle={(checked) => handleToggleTask('human_coach_completed', checked)}
  />
)}

{hasMeditation && isDay7 && (
  <TaskCard
    step={3}
    title="一对一教练"
    description="与真人教练深度对话，巩固7天成果"
    completed={!!todayProgress?.human_coach_completed}
    icon={<Phone />}
    badgeText="毕业福利" badgeColor="emerald"
    actionLabel="预约教练"
    isPrimary
    onAction={() => navigate('/human-coach')}
    onToggle={(checked) => handleToggleTask('human_coach_completed', checked)}
  />
)}
```

### 4. Adjust step numbering
When Day 3 or Day 7 has the extra card, shift subsequent task step numbers by +1 (分享 becomes step 4, 课程 becomes step 5).

## Summary
- 1 database migration (add `human_coach_completed` column)
- 1 file edit (`CampCheckIn.tsx`) — add 2 conditional TaskCard blocks with day-based logic
- No new pages or components needed — leverages existing TeamCoaching and HumanCoach pages

