

# Plan: Add Day 2-7 Meditation Scripts and Generate Audio

## Overview
Insert meditation scripts for days 2-7 into the `stress_meditations` table, then trigger the existing `generate-stress-meditation` edge function to generate audio for each day using ElevenLabs TTS (Sarah voice, speed 0.85).

## Steps

### Step 1: Insert Day 2-7 Scripts via Database Migration
Insert 6 rows into `stress_meditations` with:
- `camp_type`: `emotion_stress_7`
- `title`: Day themes (回到呼吸, 允许情绪, 放下思绪, 接纳自己, 找回力量, 回到安定)
- `script`: Full meditation text as provided
- `duration_seconds`: Estimated ~480-600 seconds each (8-10 min)
- `audio_url`: NULL (will be filled by edge function)

### Step 2: Generate Audio for Each Day
Call the `generate-stress-meditation` edge function 6 times (days 2-7). The function already:
- Reads the script from DB
- Cleans pause markers (（停顿）→ `...`)
- Calls ElevenLabs TTS with Sarah voice (`EXAVITQu4vr4xnSDxMaL`), speed 0.85
- Uploads MP3 to `stress-meditations` storage bucket
- Updates the `audio_url` in the database

No code changes needed — the existing edge function handles everything.

