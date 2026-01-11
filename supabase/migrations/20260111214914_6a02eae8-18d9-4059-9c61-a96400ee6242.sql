-- 创建 add_user_quota 函数：用于语音通话失败后退还点数
-- 🔒 安全设计：只允许 service_role 或用户本人添加额度

CREATE OR REPLACE FUNCTION public.add_user_quota(
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_remaining_quota INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_quota INTEGER;
  v_new_quota INTEGER;
  v_caller_role TEXT;
BEGIN
  -- 获取调用者角色
  v_caller_role := current_setting('request.jwt.claims', true)::json->>'role';
  
  -- 🔒 安全检查：只允许 service_role 或用户本人操作
  IF v_caller_role != 'service_role' AND auth.uid() != p_user_id THEN
    RETURN QUERY SELECT FALSE, 0, '无权限操作其他用户额度'::TEXT;
    RETURN;
  END IF;
  
  -- 参数验证
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, '退还点数必须大于0'::TEXT;
    RETURN;
  END IF;
  
  -- 获取当前额度
  SELECT remaining_quota INTO v_current_quota
  FROM user_accounts
  WHERE user_id = p_user_id;
  
  IF v_current_quota IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, '用户账户不存在'::TEXT;
    RETURN;
  END IF;
  
  -- 计算新额度
  v_new_quota := v_current_quota + p_amount;
  
  -- 更新额度
  UPDATE user_accounts
  SET remaining_quota = v_new_quota, updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, v_new_quota, '退还成功'::TEXT;
END;
$$;