
-- 1. 清理空壳账号的邮箱（已注销，无订单）
UPDATE auth.users SET email = 'deleted_ebb5519c@youjin.app' WHERE id = 'ebb5519c-e88c-46aa-a42a-140eead21287';

-- 2. 给主账号绑定正确的虚拟邮箱
UPDATE auth.users SET email = 'phone_8618135536098@youjin.app' WHERE id = '69f66ed2-c71e-45e7-b6e1-1033bda0c2da';
