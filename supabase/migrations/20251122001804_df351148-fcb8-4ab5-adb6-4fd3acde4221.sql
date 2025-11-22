-- Add WeChat Work (企业微信) integration fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS wecom_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS wecom_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wecom_mention_all BOOLEAN DEFAULT false;