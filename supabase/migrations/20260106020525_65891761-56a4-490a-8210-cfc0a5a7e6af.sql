-- Fix security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS assessment_changes;

CREATE VIEW assessment_changes 
WITH (security_invoker = true) AS
SELECT 
  curr.id,
  curr.user_id,
  curr.version,
  curr.created_at,
  curr.previous_assessment_id,
  curr.behavior_score,
  curr.emotion_score,
  curr.belief_score,
  prev.behavior_score as prev_behavior_score,
  prev.emotion_score as prev_emotion_score,
  prev.belief_score as prev_belief_score,
  CASE WHEN prev.behavior_score > 0 THEN 
    ROUND(((curr.behavior_score - prev.behavior_score)::NUMERIC / prev.behavior_score * 100)::NUMERIC, 1)
  ELSE 0 END as behavior_change_pct,
  CASE WHEN prev.emotion_score > 0 THEN 
    ROUND(((curr.emotion_score - prev.emotion_score)::NUMERIC / prev.emotion_score * 100)::NUMERIC, 1)
  ELSE 0 END as emotion_change_pct,
  CASE WHEN prev.belief_score > 0 THEN 
    ROUND(((curr.belief_score - prev.belief_score)::NUMERIC / prev.belief_score * 100)::NUMERIC, 1)
  ELSE 0 END as belief_change_pct
FROM wealth_block_assessments curr
LEFT JOIN wealth_block_assessments prev ON curr.previous_assessment_id = prev.id;