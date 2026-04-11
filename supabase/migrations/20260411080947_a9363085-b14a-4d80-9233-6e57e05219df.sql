UPDATE public.wechat_broadcast_jobs 
SET status = 'failed', 
    last_error = '重复任务，已自动取消', 
    completed_at = now(), 
    updated_at = now() 
WHERE id = 'd6edaf09-5974-48d0-b98c-61d883493dc0' 
  AND status = 'running' 
  AND processed_count = 0;