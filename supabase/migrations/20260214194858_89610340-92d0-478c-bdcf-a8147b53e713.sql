
ALTER TABLE public.profiles 
ADD COLUMN must_change_password boolean DEFAULT false;

-- 标记已有的批量注册用户
UPDATE public.profiles 
SET must_change_password = true 
WHERE id IN (
  SELECT claimed_by FROM public.partner_invitations 
  WHERE claimed_source = 'batch' AND claimed_by IS NOT NULL
);
