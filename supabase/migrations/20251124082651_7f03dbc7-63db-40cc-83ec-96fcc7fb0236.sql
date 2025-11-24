-- 添加微信公众号服务器配置字段
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS wechat_token TEXT,
ADD COLUMN IF NOT EXISTS wechat_encoding_aes_key TEXT;

COMMENT ON COLUMN public.profiles.wechat_token IS '微信公众号服务器配置Token（3-32位英文或数字）';
COMMENT ON COLUMN public.profiles.wechat_encoding_aes_key IS '微信公众号消息加解密密钥（43位Base64字符）';