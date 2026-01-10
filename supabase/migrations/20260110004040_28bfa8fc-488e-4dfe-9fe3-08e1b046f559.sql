-- 更新财富训练营类型标识和名称
UPDATE camp_templates 
SET camp_type = 'wealth_block_7',
    camp_name = '7天财富觉醒训练营',
    duration_days = 7
WHERE camp_type = 'wealth_block_21';