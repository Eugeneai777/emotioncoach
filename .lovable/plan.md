

## 有劲生活馆未登录看不到内容的原因和修复方案

### 根本原因

`energy_studio_tools` 表的 RLS（行级安全）策略只允许 `authenticated`（已登录用户）读取数据：

```
策略名：所有用户可查看启用的工具
角色：authenticated  -- 问题在这里，排除了匿名用户
条件：is_available = true
```

未登录用户使用的是 `anon` 角色，该策略不覆盖 `anon`，所以查询返回 0 行数据，页面虽然加载了，但工具列表为空——看起来就是"什么都看不到"。

### 修复方案

**1. 修改 RLS 策略（数据库迁移）**

为 `energy_studio_tools` 表添加一条允许匿名用户读取已启用工具的策略：

```sql
CREATE POLICY "匿名用户可查看启用的工具"
  ON public.energy_studio_tools
  FOR SELECT
  TO anon
  USING (is_available = true);
```

这样未登录用户也能看到所有可用工具卡片。

**2. 排查其他相关表**

有劲生活馆页面还引用了以下表，需要逐一检查它们的 RLS 策略是否也限制了 `anon` 访问：
- `og_configurations`（OG 元数据）
- `user_quick_menu_config`（快捷菜单，属于个人数据，可不开放）

**3. 无需修改代码**

`EnergyStudio.tsx` 页面代码本身没有任何登录跳转逻辑，问题纯粹是数据库权限层面的。修改 RLS 策略即可解决。

### 影响范围

- 仅涉及一条 RLS 策略的新增
- 不影响已有的 `authenticated` 策略
- `energy_studio_tools` 表中只有展示性数据（工具名称、描述、图标等），不含敏感信息，开放给匿名用户是安全的

