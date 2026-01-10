-- Fix existing baseline_awakening values that were calculated incorrectly
-- The original formula used /300 (wrong), should be /150 (correct for max 50 per layer)
-- This recalculates all baseline_awakening values using the correct formula

UPDATE user_awakening_progress
SET baseline_awakening = 100 - ROUND(
  (COALESCE(baseline_behavior, 0) + COALESCE(baseline_emotion, 0) + COALESCE(baseline_belief, 0)) 
  / 150.0 * 100
)
WHERE baseline_awakening IS NOT NULL;