
-- Create promo_pages table
CREATE TABLE public.promo_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  target_audience text,
  bundle_price numeric NOT NULL DEFAULT 0,
  original_price numeric NOT NULL DEFAULT 0,
  products jsonb DEFAULT '[]'::jsonb,
  selling_points jsonb DEFAULT '[]'::jsonb,
  testimonials jsonb DEFAULT '[]'::jsonb,
  theme jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_pages ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read active promo pages"
ON public.promo_pages FOR SELECT
USING (is_active = true);

-- Admin write access
CREATE POLICY "Admins can manage promo pages"
ON public.promo_pages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert first promo page data
INSERT INTO public.promo_pages (slug, title, subtitle, target_audience, bundle_price, original_price, products, selling_points, testimonials, theme)
VALUES (
  'workplace-stress',
  '职场压力急救包',
  '压力大到失眠？焦虑到心悸？一套方案，身心同调',
  '职场压力大人群',
  399,
  798,
  '[
    {
      "name": "情绪管理训练营",
      "price": 399,
      "icon": "🧠",
      "duration": "21天",
      "highlights": ["AI教练全程陪伴", "科学情绪管理方法", "每日打卡+社群互助", "个性化成长报告"],
      "tag": "系统训练"
    },
    {
      "name": "知乐胶囊",
      "price": 399,
      "icon": "💊",
      "duration": "1瓶/30粒",
      "highlights": ["天然植物配方", "快速缓解焦虑", "改善睡眠质量", "无依赖性"],
      "tag": "立刻见效"
    }
  ]'::jsonb,
  '["7天内明显改善睡眠质量", "掌握科学情绪管理方法", "AI教练24小时全程陪伴", "知乐胶囊快速缓解身体症状", "训练营+胶囊，身心同步调理"]'::jsonb,
  '[
    {"name": "Lisa", "avatar": "👩‍💼", "role": "互联网产品经理", "content": "加班到凌晨是常态，焦虑到整夜睡不着。用了知乐胶囊第3天就感觉睡眠好多了，配合训练营的情绪练习，现在压力大的时候知道怎么调节了。"},
    {"name": "张伟", "avatar": "👨‍💻", "role": "金融分析师", "content": "以前靠咖啡续命，身体越来越差。这个组合真的是救命包，胶囊稳住身体状态，训练营教我从根源管理情绪。"},
    {"name": "小雨", "avatar": "👩‍🏫", "role": "中学教师", "content": "带毕业班压力巨大，经常头痛失眠。朋友推荐的这个套餐，性价比太高了，相当于买一送一！"}
  ]'::jsonb,
  '{"gradient": "from-rose-500 via-orange-500 to-amber-500", "accent": "orange"}'::jsonb
);
