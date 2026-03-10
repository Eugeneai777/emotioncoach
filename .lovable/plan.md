

# Plan: Switch to OpenAI TTS and Regenerate All 7 Meditation Audios at Half Speed

## Overview
Update the `generate-stress-meditation` edge function to use OpenAI TTS (`tts-1`) instead of ElevenLabs, with speed set to **0.5** (half speed). Then regenerate all 7 days of audio.

## Changes

### Step 1: Update Edge Function
Modify `supabase/functions/generate-stress-meditation/index.ts`:
- Replace ElevenLabs API call with OpenAI TTS API (`https://api.openai.com/v1/audio/speech`)
- Use model `tts-1`, voice `shimmer` (soft female, good for meditation)
- Set speed to `0.5`
- Remove ElevenLabs-specific imports and logic
- Keep existing script cleaning, storage upload, and DB update logic unchanged
- `OPENAI_API_KEY` is already configured in secrets

### Step 2: Clear Existing Audio URLs
Run a database migration to set `audio_url = NULL` for all 7 days so the function will regenerate them (it skips rows where `audio_url` is not null).

```sql
UPDATE stress_meditations 
SET audio_url = NULL, updated_at = NOW() 
WHERE camp_type = 'emotion_stress_7';
```

### Step 3: Regenerate All 7 Days
Call the edge function sequentially for days 1-7. Each call will:
1. Read script from DB
2. Call OpenAI TTS at speed 0.5
3. Upload MP3 to `stress-meditations` bucket (overwriting existing files)
4. Update `audio_url` in database

## Technical Details
- OpenAI TTS speed range: 0.25–4.0 (vs ElevenLabs 0.7–1.2)
- Voice `shimmer`: warm, calm female voice suitable for meditation
- No new secrets needed — `OPENAI_API_KEY` already exists

