-- Add WeChat proxy configuration fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS wechat_proxy_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS wechat_proxy_url text,
ADD COLUMN IF NOT EXISTS wechat_proxy_auth_token text;

COMMENT ON COLUMN public.profiles.wechat_proxy_enabled IS 'Whether to use proxy server for WeChat API calls';
COMMENT ON COLUMN public.profiles.wechat_proxy_url IS 'Proxy server URL for WeChat API calls';
COMMENT ON COLUMN public.profiles.wechat_proxy_auth_token IS 'Authentication token for proxy server';