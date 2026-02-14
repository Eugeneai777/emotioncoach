
ALTER TABLE public.partner_invitations 
ADD COLUMN claimed_source text DEFAULT 'self';

-- 将现有管理员操作的记录标记
UPDATE public.partner_invitations 
SET claimed_source = 'admin' 
WHERE status = 'claimed' AND claimed_by IS NULL;

-- 将批量注册的7条记录标记
UPDATE public.partner_invitations 
SET claimed_source = 'batch' 
WHERE invite_code IN ('BLOOM-MX42','BLOOM-TZ44','BLOOM-FQ45','BLOOM-DZ47','BLOOM-ED49','BLOOM-LQ51','BLOOM-MM53');
