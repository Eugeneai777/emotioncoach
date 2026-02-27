
# Fix PageHeader Not Showing on Communication Assessment

## Problem
The `PageHeader` component IS rendered in the page (line 101), but the child components (`CommAssessmentStartScreen` and `CommAssessmentQuestions`) both use `min-h-screen` with flex centering, causing them to fill the entire viewport and push the header out of view.

## Solution
Remove `min-h-screen` from both child components and adjust their layout to work within the parent container that already has `min-h-screen`.

### Changes

**1. `src/components/communication-assessment/CommAssessmentStartScreen.tsx` (line 21)**
- Change `min-h-screen` to `min-h-[calc(100vh-48px)]` (48px = header height) so content centers below the header
- Remove the `onBack` button rendering since PageHeader handles navigation

**2. `src/components/communication-assessment/CommAssessmentQuestions.tsx` (line 63)**
- Change `min-h-screen` to `min-h-[calc(100vh-48px)]` so the questions area sits below the header

**3. `src/components/communication-assessment/CommAssessmentResult.tsx`**
- Check and apply the same fix if it also uses `min-h-screen`

This ensures the sticky PageHeader (with logo + back arrow to `/communication-intro`) remains visible at the top across all phases: start, questions, and result.
