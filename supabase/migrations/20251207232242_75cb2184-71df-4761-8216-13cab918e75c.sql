-- Pre-populate default package feature settings for existing packages
-- First, get the package IDs and feature IDs, then insert settings

-- Insert settings for all packages and features combinations with sensible defaults
INSERT INTO public.package_feature_settings (package_id, feature_id, is_enabled, cost_per_use, free_quota, free_quota_period)
SELECT 
  p.id as package_id,
  f.id as feature_id,
  CASE 
    -- 尝鲜会员: only basic features
    WHEN p.package_key = 'trial' AND f.item_key IN ('identity_bloom', 'emotion_bloom') THEN false
    ELSE true
  END as is_enabled,
  CASE 
    -- Coaches cost 1 point per use
    WHEN f.category = 'coach' AND f.item_key NOT IN ('story_coach', 'vibrant_life_coach') THEN 1
    -- Courses cost for trial members
    WHEN f.category = 'course' AND p.package_key = 'trial' THEN 1
    ELSE 0
  END as cost_per_use,
  CASE 
    -- Trial members get limited free quota for courses
    WHEN f.category = 'course' AND p.package_key = 'trial' THEN 5
    ELSE 0
  END as free_quota,
  'monthly' as free_quota_period
FROM public.packages p
CROSS JOIN public.feature_items f
WHERE p.is_active = true
  AND f.is_active = true
ON CONFLICT (package_id, feature_id) DO NOTHING;