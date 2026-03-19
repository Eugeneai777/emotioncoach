

## Plan: Adjust "测一测" Badge Position & Update "想要成长时" Copy

### 1. Move "🔍 测一测" badge to top-right corner (Meituan style)

**Current**: Badge sits inside the card at bottom-right (`absolute bottom-1.5 right-1.5`), overlapping the card illustration area.

**Change**: Reposition to top-right corner, partially outside the card boundary, like Meituan's "超省价" tag style. This requires:
- Change the card container from `overflow-hidden` to `overflow-visible`
- Move badge position to `-top-2 -right-2` so it "pops out" of the card
- Adjust z-index to ensure visibility above neighboring cards
- Remove `animate-pulse` (Meituan style badges are static, pulse on a corner badge feels cheap)
- Use a slightly more prominent style: solid background with small shadow

**File**: `src/pages/MiniAppEntry.tsx` (line ~431-442)

### 2. Rename "想要成长时" to "财富渴望时"

**Evaluation**: From a commercial architecture perspective, "想要成长时" is too generic and lacks pain-point specificity. The other three items (深夜焦虑时、职场迷茫时、关系困扰时) all target concrete emotional pain points. "财富渴望时" better aligns with the product's wealth coaching monetization funnel (财富卡点测评 → AI教练 → 训练营), directly connecting to the user's desire-driven psychology. Update description to match the wealth/financial growth theme.

**Change**:
- Title: "想要成长时" → "财富渴望时"
- Description: Update to something like "总觉得赚得不少却存不下来？AI帮你找到财富卡点，打通金钱信念。"
- Also update the same copy in `src/components/living-lab/UseCasesSection.tsx`

**Files**: `src/pages/MiniAppEntry.tsx` (line 131-140), `src/components/living-lab/UseCasesSection.tsx` (line 26-30)

### Summary

Two focused changes, no business logic alterations — purely visual positioning and copywriting optimization aligned with the product's monetization strategy.

