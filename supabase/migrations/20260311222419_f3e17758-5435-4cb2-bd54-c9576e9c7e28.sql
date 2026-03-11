-- Rename 死了吗打卡/死了吗安全打卡/安全打卡 to 每日平安打卡
UPDATE public.packages SET package_name = '每日平安打卡' WHERE package_key = 'alive_check';
UPDATE public.partner_experience_items SET name = '每日平安打卡' WHERE item_key = 'alive_check';
