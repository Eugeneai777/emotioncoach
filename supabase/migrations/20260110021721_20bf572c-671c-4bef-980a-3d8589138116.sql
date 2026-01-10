-- Batch initialize awakening progress for all users who have completed assessments but don't have progress
INSERT INTO user_awakening_progress (
  user_id,
  baseline_awakening,
  baseline_behavior,
  baseline_emotion,
  baseline_belief,
  baseline_dominant_type,
  baseline_reaction_pattern,
  current_awakening,
  current_level,
  total_points,
  baseline_created_at
)
SELECT 
  a.user_id,
  -- Calculate baseline awakening (inverted health score, 0-100)
  100 - ROUND((COALESCE(a.behavior_score, 0) + COALESCE(a.emotion_score, 0) + COALESCE(a.belief_score, 0))::numeric / 300 * 100) as baseline_awakening,
  COALESCE(a.behavior_score, 50) as baseline_behavior,
  COALESCE(a.emotion_score, 50) as baseline_emotion,
  COALESCE(a.belief_score, 50) as baseline_belief,
  a.dominant_poor as baseline_dominant_type,
  a.reaction_pattern as baseline_reaction_pattern,
  -- Current awakening starts as baseline, will be updated by daily entries
  100 - ROUND((COALESCE(a.behavior_score, 0) + COALESCE(a.emotion_score, 0) + COALESCE(a.belief_score, 0))::numeric / 300 * 100) as current_awakening,
  -- Start at level 1
  1 as current_level,
  -- Initial points for completing assessment
  10 as total_points,
  a.created_at as baseline_created_at
FROM wealth_block_assessments a
WHERE NOT EXISTS (
  SELECT 1 FROM user_awakening_progress p WHERE p.user_id = a.user_id
)
-- Get the latest assessment per user
AND a.id = (
  SELECT id FROM wealth_block_assessments 
  WHERE user_id = a.user_id 
  ORDER BY created_at DESC 
  LIMIT 1
);

-- Update points for users who have journal entries
UPDATE user_awakening_progress p
SET 
  total_points = 10 + (
    SELECT COUNT(*) * 55 
    FROM wealth_journal_entries j 
    WHERE j.user_id = p.user_id
  ),
  current_level = CASE 
    WHEN 10 + (SELECT COUNT(*) * 55 FROM wealth_journal_entries j WHERE j.user_id = p.user_id) >= 800 THEN 6
    WHEN 10 + (SELECT COUNT(*) * 55 FROM wealth_journal_entries j WHERE j.user_id = p.user_id) >= 500 THEN 5
    WHEN 10 + (SELECT COUNT(*) * 55 FROM wealth_journal_entries j WHERE j.user_id = p.user_id) >= 300 THEN 4
    WHEN 10 + (SELECT COUNT(*) * 55 FROM wealth_journal_entries j WHERE j.user_id = p.user_id) >= 150 THEN 3
    WHEN 10 + (SELECT COUNT(*) * 55 FROM wealth_journal_entries j WHERE j.user_id = p.user_id) >= 50 THEN 2
    ELSE 1
  END,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM wealth_journal_entries j WHERE j.user_id = p.user_id
);