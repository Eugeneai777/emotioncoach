-- Update wealth_block_21 camp template to 7 days
UPDATE camp_templates 
SET duration_days = 7,
    updated_at = now()
WHERE camp_type = 'wealth_block_21';