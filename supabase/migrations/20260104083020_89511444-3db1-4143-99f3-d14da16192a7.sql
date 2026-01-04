-- Add unique constraint for wealth journal entries to support upsert
ALTER TABLE public.wealth_journal_entries 
ADD CONSTRAINT wealth_journal_entries_user_camp_day_unique 
UNIQUE (user_id, camp_id, day_number);