CREATE OR REPLACE FUNCTION notify_must_change_password()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.must_change_password = true 
     AND (OLD IS NULL OR OLD.must_change_password IS DISTINCT FROM true) THEN
    INSERT INTO smart_notifications (
      user_id, notification_type, scenario, title, message,
      icon, action_text, action_type, action_data, priority, coach_type
    ) VALUES (
      NEW.id, 'reminder', 'security_password_change',
      '🔒 安全提醒：请修改默认密码',
      '您的账号当前使用的是初始密码 123456，存在安全风险。为了保护您的账号安全，请尽快修改密码。',
      'Bell', '立即修改密码', 'navigate',
      '{"path": "/change-password"}'::jsonb, 5, 'general'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_must_change_password
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_must_change_password();