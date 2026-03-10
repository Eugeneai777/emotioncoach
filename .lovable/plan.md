

# Plan: Replace "对比分析" Tab with "冥想专区" Meditation Library

## Overview
In the History page (`src/pages/History.tsx`), replace the "对比分析" (Compare) tab with a new "冥想专区" (Meditation Zone) tab that displays all 7 stress meditation audios in a browsable, playable list.

## Changes

### 1. Create `MeditationZone` component
New file: `src/components/MeditationZone.tsx`
- Fetch all rows from `stress_meditations` table ordered by `day_number`
- Display cards for each day with title, duration, and play button
- Inline audio player: clicking a card loads and plays that meditation
- Show playback controls (play/pause, progress bar, time display)
- Use existing `useAudioCache` hook for offline support
- Reuse the amber/gold styling from `MeditationLibraryCard`

### 2. Update `src/pages/History.tsx`
- Replace `EmotionComparison` import with `MeditationZone`
- Change tab label from "对比分析"/"对比" to "冥想专区"/"冥想"
- Replace the `compare` TabsContent to render `<MeditationZone />`
- Remove the `EmotionComparison` import (no longer used)

