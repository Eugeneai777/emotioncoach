
# Fix: Invisible Text in Three Dominant Block Cards

## Root Cause (Confirmed)

In `src/components/wealth-block/wealthBlockData.ts`, the `.color` property for all dominant block types stores Tailwind gradient stop classes:

- `fourPoorInfo.eye.color = "from-blue-500 to-cyan-500"`
- `emotionBlockInfo.anxiety.color = "from-orange-500 to-amber-500"`
- etc.

In `CombinedPersonalityCard.tsx`, these are applied as:
```tsx
<div className={cn("p-3 text-white rounded-lg", dominantPoor.color)}>
```

**Missing `bg-gradient-to-br`** → gradient never renders → transparent/white background → white text invisible.

The screenshots show only the emoji (not text) because emojis are rendered as images by the OS, not as CSS text color.

---

## Fix Strategy: Light-Themed Cards with Left Accent Border

Replace all three broken dominant-block cards (lines 445, 630, 812) with a "light background + color left border + dark text" pattern — consistent with the rest of the app design system.

### Layer Color Mapping (fixed, not dynamic)

Since each layer has a semantic meaning, we use fixed, safe colors per layer:

| Layer | Background | Border | Text |
|-------|-----------|--------|------|
| Behavior (四穷) | `bg-amber-50` | `border-l-4 border-amber-400` | `text-amber-900` |
| Emotion (情绪) | `bg-pink-50` | `border-l-4 border-pink-400` | `text-pink-900` |
| Belief (信念) | `bg-violet-50` | `border-l-4 border-violet-400` | `text-violet-900` |

---

## Specific Changes in `CombinedPersonalityCard.tsx`

### Change 1: Behavior Layer Card (Line 445-457)

**Before:**
```tsx
<div className={cn("p-3 text-white rounded-lg", dominantPoor.color)}>
  <h4 className="font-bold text-sm">{dominantPoor.name}</h4>
  <p className="text-white/80 text-[10px]">{dominantPoor.description}</p>
  <p className="text-white/90 text-xs leading-relaxed mb-2">{dominantPoor.detail}</p>
  <div className="p-2 bg-white/20 rounded-lg">
    <p className="text-xs">💡 突破方案：{dominantPoor.solution}</p>
  </div>
</div>
```

**After:**
```tsx
<div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400">
  <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">{dominantPoor.name}</h4>
  <p className="text-amber-700/80 dark:text-amber-300/80 text-[10px]">{dominantPoor.description}</p>
  <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed mb-2">{dominantPoor.detail}</p>
  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200/60">
    <p className="text-xs text-amber-800 dark:text-amber-200">💡 突破方案：{dominantPoor.solution}</p>
  </div>
</div>
```

### Change 2: Emotion Layer Card (Line 630-642)

Same pattern with pink colors:
```tsx
<div className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/30 border-l-4 border-pink-400">
  text-pink-900 / text-pink-700/80 / text-pink-800
  inner box: bg-pink-100 border-pink-200/60
```

### Change 3: Belief Layer Card (Line 812-837)

Same pattern with violet colors, plus the `coreBeliefs` tags inside also need color updates:
```tsx
<div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border-l-4 border-violet-400">
  text-violet-900 / text-violet-700/80 / text-violet-800
  belief tags: bg-violet-100 border border-violet-200/50 text-violet-700
  inner box: bg-violet-100 border-violet-200/60
```

### Change 4: Radar Chart Scaling (Lines 463, 648, 843)

Increase `outerRadius` from `60%` to `75%` and use dynamic domain calculations so the chart fills more of the available space:

```tsx
// Add before return statement (computed values):
const fourPoorMax = Math.max(
  baseline.mouth_score || 0, baseline.hand_score || 0,
  baseline.eye_score || 0, baseline.heart_score || 0, 5
);
const emotionMax = Math.max(...emotionRadarData.map(d => d.baseline), 3);
const beliefMax = Math.max(...beliefRadarData.map(d => d.baseline), 3);

// Then update all 3 RadarCharts:
<RadarChart cx="50%" cy="50%" outerRadius="75%" ...>
  <PolarRadiusAxis angle={90} domain={[0, fourPoorMax]} tick={false} axisLine={false} />
```

---

## Files Modified

| File | Lines Changed | Description |
|------|-------------|-------------|
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | ~445-457 | Behavior layer card: amber light theme |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | ~630-642 | Emotion layer card: pink light theme |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | ~812-837 | Belief layer card: violet light theme (incl. tags) |
| `src/components/wealth-camp/CombinedPersonalityCard.tsx` | ~463, 648, 843 | All 3 RadarCharts: outerRadius 60%→75%, dynamic domain |

**Total: ~40 lines changed. No data logic, no other files.**
