-- 创建缓存存储表（用于存储 access_token、jsapi_ticket 等临时数据）
CREATE TABLE public.cache_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加表注释
COMMENT ON TABLE public.cache_store IS '通用缓存存储表，用于存储微信 access_token、jsapi_ticket 等需要缓存的临时数据';
COMMENT ON COLUMN public.cache_store.key IS '缓存键名';
COMMENT ON COLUMN public.cache_store.value IS '缓存值';
COMMENT ON COLUMN public.cache_store.expires_at IS '过期时间';

-- 创建过期时间索引（用于清理过期数据）
CREATE INDEX idx_cache_store_expires_at ON public.cache_store(expires_at);

-- 禁用 RLS（此表仅由 Edge Functions 使用 service role 访问）
ALTER TABLE public.cache_store ENABLE ROW LEVEL SECURITY;

-- 不创建任何 RLS 策略，确保只有 service_role 可以访问