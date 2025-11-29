
-- 创建用户权限查询函数
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID)
RETURNS TABLE (
  feature_key TEXT,
  feature_name TEXT,
  category TEXT,
  access_level TEXT,
  access_value TEXT,
  package_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    fd.feature_key,
    fd.feature_name,
    fd.category,
    COALESCE(pf.access_level, 'none') as access_level,
    pf.access_value,
    p.package_name
  FROM feature_definitions fd
  LEFT JOIN package_features pf ON fd.id = pf.feature_id
  LEFT JOIN packages p ON pf.package_id = p.id
  LEFT JOIN subscriptions s ON s.package_id = p.id 
    AND s.user_id = p_user_id 
    AND s.status = 'active'
    AND (s.end_date IS NULL OR s.end_date > CURRENT_DATE)
  WHERE fd.is_active = true
  ORDER BY fd.category, fd.feature_key;
END;
$$;
