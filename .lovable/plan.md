## 7天伴随手册 - 剩余6步实施计划

### 已完成（上轮）
- `src/config/maleVitalityHandbook.ts` - 男版20题映射 + 4场景簇 + 6套7天恢复路径 + 训练营价值点
- `src/config/emotionHealthHandbook.ts` - 女版32题映射 + 5场景簇 + 4套7天恢复路径
- `src/lib/handbookText.ts` - `sanitizeHandbookText` 清洗 AI 输出脏字符

---

### Step 1：边缘函数 `generate-handbook-insights`

**路径**：`supabase/functions/generate-handbook-insights/index.ts`

**职责**：根据 `recordId + type + answers + cluster分布` 调用 Lovable AI Gateway（`google/gemini-2.5-flash`）生成"个性化心声"片段。

**输入**：`{ recordId, type: 'male_vitality' | 'emotion_health', answers, scenarioClusters, weakestDimension }`

**输出**：`{ recordId, insights: { coverNote, clusterInsights: {[clusterId]: string}, day7Reflection } }`

**关键防错**：
- `corsHeaders` 标准；OPTIONS 预检
- 入参 Zod 校验，缺 `recordId` 直接 400
- 返回体强制带 `recordId`，前端校验是否一致
- 输出经 `sanitizeHandbookText` 处理后再返回
- `verify_jwt = false`（管理员页面已自带 admin 鉴权）
- 错误用 `extractEdgeFunctionError` 模式（结构化 message + status）

---

### Step 2：前端 AI 调用 + 缓存层

**新增**：`src/lib/reportAIInsight.ts`

**职责**：
- 单例 in-memory cache：`Map<recordId, Promise<Insights>>` 防止同一 recordId 重复并发
- 调用 `supabase.functions.invoke('generate-handbook-insights', { body })`
- **强校验**：`returned.recordId === requested.recordId`，不匹配立即抛错（防错串）
- 失败时返回降级文案（不影响 PDF 生成，仅心声段落变为通用文本）

**新增**：`src/hooks/useBusyGuard.ts`（如未存在）—— 防止管理员同时点多次下载按钮。

---

### Step 3：P1-P9 渲染组件

**目录**：`src/components/admin/handbook/`

```
handbook/
├── HandbookContainer.tsx        // 9 页容器，A4 portrait, 794x1123px @96dpi
├── pages/
│   ├── P1Cover.tsx              // 封面：用户姓名(脱敏) + 测评类型 + 测评日期 + 水印(recordId)
│   ├── P2ScenarioBreakdown.tsx  // 第二章：按场景簇逐题解读（不按题号）
│   ├── P3Strengths.tsx          // 优势小红花
│   ├── P4Risks.tsx              // 风险预警
│   ├── P5Day1to2.tsx            // Day1-2 觉察 + 微动作
│   ├── P6Day3to4.tsx            // Day3-4 练习 + 复盘
│   ├── P7Day5to6.tsx            // Day5-6 巩固
│   ├── P8Day7Invite.tsx         // Day7 跃迁 + 训练营价值卡 + 企微二维码（无外链）
│   └── P9Companion.tsx          // 长期陪伴入口 + 客服顾问引导
├── shared/
│   ├── HandbookHeader.tsx       // 每页页眉（小logo + 测评名）
│   ├── HandbookFooter.tsx       // 页脚（页码 X/9 + recordId 末8位）
│   └── ScenarioCard.tsx         // 场景簇卡片，复用于 P2
```

**关键约束**：
- 全部使用 `index.css` 语义 token（`bg-background`、`text-foreground`、`border-border`），不写 hex
- 字体：使用项目已加载的中文字体；避免 Unicode 上下标
- 容器 `position: fixed; left: -9999px; top: 0`（屏幕外但可截图）
- 每个 P 组件接收 `{ data, insights, recordId }`，无任何全局 state 依赖
- P8 用 `qiwei-assistant-qr.jpg`（已存在 assets），不嵌外链

---

### Step 4：管理员导出页 `AdminHandbookExport.tsx`

**路径**：`src/pages/admin/AdminHandbookExport.tsx`

**路由**：
- `/admin/handbook/male/:recordId`
- `/admin/handbook/emotion/:recordId`

**流程**：
1. 校验 admin 角色（`useUserRole`），非 admin 直接 redirect
2. 加载记录（男版查 `partner_assessment_results`，女版查 `emotion_health_assessments`）
3. 调 `reportAIInsight(recordId, type, ...)` 拿洞察
4. 渲染 `<HandbookContainer key={recordId}>`（key 强制每次重置 DOM，防错串）
5. 提供"下载 PDF"按钮 → 调 `exportNodeToPdf` 生成 `{测评名}_{用户名/手机后4位}_{recordId前8位}_{YYYYMMDD}.pdf`
6. 记录写入 `pdf_generation_logs`（admin_id、record_id、filename、status）
7. 顶部水印条显示当前 recordId + 用户名，便于人工核对

**App.tsx 路由注册**：在 admin 路由组内追加这两条 route。

---

### Step 5：管理员抽屉新增"下载7天伴随手册PDF"按钮

**修改文件**：
- `src/components/admin/AssessmentRespondentDrawer.tsx`（男版）
- `src/components/admin/EmotionHealthInsightsDetail.tsx`（女版）

**改动**：
- 顶部操作区追加按钮：「下载 7 天伴随手册 PDF」
- 点击 → `window.open('/admin/handbook/{type}/{recordId}', '_blank')`
- 使用 `useBusyGuard` 防止重复点击
- 按钮 hover 提示生成耗时约 10-20s（含 AI 调用）

---

### Step 6：数据库审计表 `pdf_generation_logs`

**迁移**：
```sql
create table public.pdf_generation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null,
  record_id uuid not null,
  handbook_type text not null check (handbook_type in ('male_vitality','emotion_health')),
  filename text not null,
  status text not null default 'success' check (status in ('success','failed','partial')),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.pdf_generation_logs enable row level security;

create policy "Admin can read pdf logs"
  on public.pdf_generation_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admin can insert pdf logs"
  on public.pdf_generation_logs for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'admin') and admin_id = auth.uid());

create index idx_pdf_logs_record on public.pdf_generation_logs(record_id, created_at desc);
```

---

### 数据准确性 & 不串号 - 5 道防线汇总

1. **路由参数 recordId 单一来源** —— 不接收 array、不接收 batch
2. **`<HandbookContainer key={recordId}>`** —— key 变即重新挂载，无残留 DOM
3. **AI 返回校验** —— `returned.recordId !== requested.recordId` 立即抛错
4. **页面水印** —— 顶部条 + 每页页脚都打印 recordId 末8位，人工可核对
5. **审计日志** —— `pdf_generation_logs` 留痕，可追溯

### 防乱码 - 4 道防线

1. html2canvas + 浏览器原生中文字体（无缺字）
2. 上下标用 `<sub>/<sup>` Unicode 而非生僻字符
3. 边缘函数输出经 `sanitizeHandbookText` 过滤 `\u0000-\u001F`、零宽字符、BOM
4. CSS 强制 `word-break: break-word`，PDF 生成前 `await document.fonts.ready`

---

### 不动的部分

- 不改测评结果页（用户端）
- 不改测评流程
- 不改现有支付/订单逻辑
- 不动 `src/integrations/supabase/{client,types}.ts`
- 不新增 npm 依赖（`html2canvas`、`jspdf` 已存在）

---

### 用户确认点

请确认是否按上述方案推进。确认后我将依次执行：
DB 迁移 → 边缘函数 → 缓存层 → P1-P9 组件 → 导出页 + 路由 → 抽屉按钮接入。

回复"继续"即开工。