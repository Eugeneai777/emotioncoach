-- 创建安全打卡设置表
CREATE TABLE public.alive_check_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT false,
  emergency_contact_name TEXT,
  emergency_contact_email TEXT,
  days_threshold INTEGER DEFAULT 3,
  last_notification_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 创建打卡记录表
CREATE TABLE public.alive_check_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checked_at DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, checked_at)
);

-- 启用 RLS
ALTER TABLE public.alive_check_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alive_check_logs ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能管理自己的设置
CREATE POLICY "用户可查看自己的设置" ON public.alive_check_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建自己的设置" ON public.alive_check_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的设置" ON public.alive_check_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS 策略：用户只能管理自己的打卡记录
CREATE POLICY "用户可查看自己的打卡记录" ON public.alive_check_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建自己的打卡记录" ON public.alive_check_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 更新时间触发器
CREATE TRIGGER update_alive_check_settings_updated_at
  BEFORE UPDATE ON public.alive_check_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 添加工具到 energy_studio_tools
INSERT INTO public.energy_studio_tools (
  tool_id, title, description, icon_name, 
  category, gradient, is_available, display_order,
  detailed_description, usage_scenarios
) VALUES (
  'alive-check', 
  '死了没', 
  '每日安全打卡，让关心你的人安心',
  'HeartHandshake',
  'management',
  'from-rose-500 to-red-500',
  true,
  16,
  '为独居或需要被关注的人设计的安全功能。每天简单打卡表示"我还好"，如果连续多天未打卡，系统会自动通知您设定的紧急联系人。',
  '["独居生活安全", "家人远程关怀", "老年人看护"]'
);