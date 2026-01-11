-- 1. 添加 source 字段区分挑战来源
ALTER TABLE public.daily_challenges 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated' 
  CHECK (source IN ('ai_generated', 'coach_action', 'user_created'));

-- 2. 添加关联日记字段
ALTER TABLE public.daily_challenges 
ADD COLUMN IF NOT EXISTS journal_entry_id UUID REFERENCES public.wealth_journal_entries(id) ON DELETE SET NULL;

-- 3. 创建索引优化查询
CREATE INDEX IF NOT EXISTS idx_daily_challenges_source ON public.daily_challenges(source);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_journal_entry_id ON public.daily_challenges(journal_entry_id);

-- 4. 注释说明
COMMENT ON COLUMN public.daily_challenges.source IS '挑战来源: ai_generated=AI推荐, coach_action=教练对话, user_created=用户自建';
COMMENT ON COLUMN public.daily_challenges.journal_entry_id IS '关联的财富日记ID（仅coach_action类型）';