-- 创建自定义轮播卡片表
CREATE TABLE custom_carousel_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基础内容
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  emoji TEXT DEFAULT '✨',
  
  -- 视觉设计
  background_type TEXT DEFAULT 'gradient', -- 'gradient' | 'image' | 'solid'
  background_value TEXT, -- 渐变/颜色值或图片URL
  text_color TEXT DEFAULT 'dark', -- 'dark' | 'light'
  
  -- 图片内容
  image_url TEXT,
  image_position TEXT DEFAULT 'right', -- 'right' | 'left' | 'top' | 'background'
  
  -- 提醒功能
  has_reminder BOOLEAN DEFAULT false,
  reminder_time TIME,
  reminder_message TEXT,
  last_reminder_shown TIMESTAMPTZ,
  
  -- 按钮/动作
  action_text TEXT,
  action_type TEXT, -- 'link' | 'chat' | 'goal' | 'custom'
  action_data JSONB,
  
  -- 状态
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_custom_carousel_cards_user_id ON custom_carousel_cards(user_id);
CREATE INDEX idx_custom_carousel_cards_is_active ON custom_carousel_cards(is_active);

-- 启用 RLS
ALTER TABLE custom_carousel_cards ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户管理自己的卡片
CREATE POLICY "用户可以查看自己的卡片" 
ON custom_carousel_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的卡片" 
ON custom_carousel_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的卡片" 
ON custom_carousel_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的卡片" 
ON custom_carousel_cards 
FOR DELETE 
USING (auth.uid() = user_id);

-- 创建更新时间触发器
CREATE TRIGGER update_custom_carousel_cards_updated_at
BEFORE UPDATE ON custom_carousel_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();