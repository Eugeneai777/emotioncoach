

# 方案A：开放匿名读取 + 统一路由

## 改动

### 1. 数据库 — 添加 anon SELECT 策略

```sql
CREATE POLICY "Anyone can read active assessments"
ON public.partner_assessment_templates
FOR SELECT
TO anon
USING (is_active = true);
```

仅允许匿名用户读取已上线模板的元数据（标题、题目、维度等），不开放写入。与项目现有 `energy_studio_tools`、`video_courses` 等表的"开放浏览"策略一致。

### 2. `src/pages/MamaAssistant.tsx`（第167行）

路由从 `/women-competitiveness` 改为 `/assessment/women_competitiveness`，与 mini-app badge 统一。

### 3. `src/App.tsx`（第480行）

`/women-competitiveness` 改为 `Navigate` 重定向到 `/assessment/women_competitiveness`，兼容旧链接。

## 影响范围

- 不修改支付、结果保存等业务逻辑
- 不影响手机端/电脑端排版
- 所有入口（mini-app、/mama、/assessment-tools、旧链接）统一到动态引擎页面

