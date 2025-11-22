-- 添加企业微信应用消息 API 相关字段
ALTER TABLE public.profiles
ADD COLUMN wecom_corp_id text,
ADD COLUMN wecom_corp_secret text,
ADD COLUMN wecom_agent_id text;