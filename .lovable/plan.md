

## Problem

The "AI教练解说" button currently navigates to `/wealth-coach-chat`, but it should navigate to `/coach/wealth_coach_4_questions` (the 财富觉醒教练 DynamicCoach page). The second screenshot shows the correct destination page.

## Solution

### 1. Update `AssessmentVoiceCoach.tsx` — Change navigation target

Change line 99 from:
```
navigate('/wealth-coach-chat', { state: { ... } })
```
to:
```
navigate('/coach/wealth_coach_4_questions', { state: { ... } })
```

### 2. Update `DynamicCoach.tsx` — Handle assessment auto-start

Add `fromAssessment`, `autoStartVoice`, `assessmentData`, `reactionPattern`, `dominantPoor` to the `LocationState` interface, then add a `useEffect` to auto-open `CoachVoiceChat` when `autoStartVoice` is true. Pass the assessment context (`tokenEndpoint`, `extraBody`, `skipBilling`) to `CoachVoiceChat` when `isFromAssessment` is detected, mirroring the existing logic in `WealthCoachChat.tsx`.

### 3. Post-call dialog

Import and render `PostCallWecomDialog` in DynamicCoach when `isFromAssessment` is true and voice chat closes, same as the current WealthCoachChat behavior.

