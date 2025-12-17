-- 创建微信登录场景表，用于扫码登录
CREATE TABLE public.wechat_login_scenes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scene_str TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL DEFAULT 'login',
  status TEXT NOT NULL DEFAULT 'pending',
  openid TEXT,
  user_id UUID,
  user_email TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scanned_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_wechat_login_scenes_scene_str ON public.wechat_login_scenes(scene_str);
CREATE INDEX idx_wechat_login_scenes_status ON public.wechat_login_scenes(status);
CREATE INDEX idx_wechat_login_scenes_expires_at ON public.wechat_login_scenes(expires_at);

-- 启用RLS
ALTER TABLE public.wechat_login_scenes ENABLE ROW LEVEL SECURITY;

-- 创建策略 - 系统可以管理所有记录
CREATE POLICY "System can manage login scenes" 
ON public.wechat_login_scenes 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 创建自动清理过期记录的函数
CREATE OR REPLACE FUNCTION public.cleanup_expired_wechat_login_scenes()
RETURNS void AS $$
BEGIN
  DELETE FROM public.wechat_login_scenes 
  WHERE expires_at < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE public.wechat_login_scenes IS '微信扫码登录场景表，用于网页端扫码登录';
COMMENT ON COLUMN public.wechat_login_scenes.scene_str IS '唯一场景字符串';
COMMENT ON COLUMN public.wechat_login_scenes.mode IS '登录模式: login/register';
COMMENT ON COLUMN public.wechat_login_scenes.status IS '状态: pending/scanned/confirmed/expired';