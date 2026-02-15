
-- Register wealth assessment voice coach feature
INSERT INTO public.feature_definitions (feature_key, feature_name, category, description, is_active)
VALUES (
  'realtime_voice_wealth_assessment',
  '财富测评语音解说',
  'voice',
  '财富卡点测评完成后与AI财富教练的实时语音对话，解说测评结果并引领觉醒',
  true
)
ON CONFLICT (feature_key) DO NOTHING;
