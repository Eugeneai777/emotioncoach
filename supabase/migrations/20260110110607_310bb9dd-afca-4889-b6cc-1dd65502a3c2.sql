-- 将已完成7天打卡但状态未更新的训练营标记为completed
UPDATE training_camps tc
SET status = 'completed', updated_at = NOW()
WHERE tc.status = 'active'
  AND tc.camp_type IN ('wealth_block_7', 'wealth_block_21')
  AND (
    SELECT COUNT(*) 
    FROM wealth_journal_entries wje 
    WHERE wje.camp_id = tc.id
  ) >= 7;