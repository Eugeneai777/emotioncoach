

## Fix: Share Card Score Still Showing Default Value (68)

### Root Cause

The share dialog (`WealthInviteCardDialog`) independently fetches assessment data from the database, but the callers (`WealthBlockResult` and `WealthBlockAssessment`) already have the data in memory and don't pass it down.

This causes two problems:
1. **Timing**: The assessment auto-save is asynchronous. If the user opens the share dialog before the save completes, the DB query returns the *previous* assessment (or nothing), so the default value (68) is used.
2. **Redundancy**: Even when the save has completed, the dialog makes an unnecessary database round-trip for data the parent already has.

```text
Current (broken):
  Assessment complete --> Auto-save starts (async) --> Show result (55)
                                                   --> User clicks share
                                                   --> Dialog queries DB
                                                   --> DB hasn't saved yet
                                                   --> Returns null, uses default 68

Fixed:
  Assessment complete --> Auto-save starts (async) --> Show result (55)
                                                   --> User clicks share
                                                   --> Dialog receives data via props
                                                   --> Shows correct score 45
```

### Fix

#### 1. Add optional assessment props to WealthInviteCardDialog

**File:** `src/components/wealth-camp/WealthInviteCardDialog.tsx`

Add two new optional props:

```typescript
interface WealthInviteCardDialogProps {
  // ... existing props
  assessmentScore?: number;      // Awakening index (0-100, higher = better)
  reactionPattern?: string;      // e.g. "chase", "avoid"
}
```

When these props are provided, use them directly instead of fetching from the database. The DB fetch remains as fallback for callers that don't have the data (e.g., WealthCampCheckIn, ShareInvite).

#### 2. Pass data from WealthBlockResult

**File:** `src/components/wealth-block/WealthBlockResult.tsx`

The component already has the result data in the `result` prop and calculates `healthScore`. Pass the awakening score and reaction pattern to the dialog:

```typescript
const awakeningScore = 100 - healthScore;

<WealthInviteCardDialog
  defaultTab="value"
  assessmentScore={awakeningScore}
  reactionPattern={result.reactionPattern}
  trigger={...}
/>
```

#### 3. Pass data from WealthBlockAssessment page header

**File:** `src/pages/WealthBlockAssessment.tsx`

The page has `currentResult` in state. When the result is available, calculate and pass the score:

```typescript
<WealthInviteCardDialog
  defaultTab="value"
  assessmentScore={currentResult ? 100 - calculateHealthScore(
    currentResult.behaviorScore + currentResult.emotionScore + currentResult.beliefScore
  ) : undefined}
  reactionPattern={currentResult?.reactionPattern}
  trigger={...}
/>
```

### File Changes

| File | Change |
|------|--------|
| `src/components/wealth-camp/WealthInviteCardDialog.tsx` | Add `assessmentScore` and `reactionPattern` props; use them when available, fall back to DB fetch |
| `src/components/wealth-block/WealthBlockResult.tsx` | Pass calculated awakening score and reaction pattern to dialog |
| `src/pages/WealthBlockAssessment.tsx` | Pass score and pattern from `currentResult` state to the header share dialog |

