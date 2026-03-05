

## Problem

Clicking the "AI教练解说" button on the wealth assessment result page (`/wealth-block`) opens a `CoachVoiceChat` overlay within the same page. On mobile/WeChat, this overlay renders incorrectly (partially hidden, z-index issues with the scrollable container). The user expects navigation to a dedicated voice coach page.

## Root Cause

`AssessmentVoiceCoach` renders `CoachVoiceChat` as an inline child component (overlay). The `/wealth-block` page has `h-screen overflow-y-auto` containers and fixed bottom bars that interfere with the full-screen overlay on mobile WebView.

## Solution

Change the "AI教练解说" button behavior: instead of rendering `CoachVoiceChat` inline, **navigate to the wealth coach page** (`/coach/wealth_coach_4_questions`) and pass the assessment context via route state. The wealth coach page already supports voice calling.

### Changes

**1. `src/components/wealth-block/AssessmentVoiceCoach.tsx`**
- Replace inline `CoachVoiceChat` rendering with `useNavigate()` navigation
- On click, navigate to `/coach/wealth_coach_4_questions` with route state containing:
  - `fromAssessment: true`
  - `assessmentData` (the existing context object)
  - `autoStartVoice: true` (signal to auto-open voice chat)
- Remove the `showVoiceChat` state and inline `CoachVoiceChat` component
- Keep the `PostCallAdvisorDialog` logic (move it to trigger on return, or remove since the coach page handles post-call flow)

**2. `src/pages/DynamicCoach.tsx` or `src/pages/WealthCoachChat.tsx`**
- Read route state for `autoStartVoice` and `assessmentData`
- If `autoStartVoice` is true, automatically trigger the voice coach with the assessment context passed as `extraBody`
- Use the same `tokenEndpoint="wealth-assessment-realtime-token"` and `skipBilling={true}` when launched from assessment context

This approach:
- Navigates to a proper full-page coach experience (no overlay z-index issues)
- Preserves the assessment data context for personalized coaching
- Works reliably in WeChat/mobile environments
- Leverages existing coach page infrastructure

