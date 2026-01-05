-- Add new fields for personalized awakening data
ALTER TABLE wealth_journal_entries 
ADD COLUMN IF NOT EXISTS personal_awakening JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS responsibility_items TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS new_belief TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS old_belief TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS giving_action TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS emotion_need TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS belief_source TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN wealth_journal_entries.personal_awakening IS '个人化觉醒数据，包括具体经历、情绪信号、信念来源等';
COMMENT ON COLUMN wealth_journal_entries.responsibility_items IS '用户能负责的事项列表';
COMMENT ON COLUMN wealth_journal_entries.new_belief IS '新的赋能信念';
COMMENT ON COLUMN wealth_journal_entries.old_belief IS '旧的限制性信念';
COMMENT ON COLUMN wealth_journal_entries.giving_action IS '用户选择的给予行动';
COMMENT ON COLUMN wealth_journal_entries.emotion_need IS '情绪背后的内心需求';
COMMENT ON COLUMN wealth_journal_entries.belief_source IS '信念的来源（记忆/经历）';