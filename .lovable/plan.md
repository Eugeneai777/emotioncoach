

# 搭建7天情绪解压训练营（归属有劲训练营）

## 数据库

向 `camp_templates` 插入一条新记录：

```sql
INSERT INTO camp_templates (
  camp_type, camp_name, camp_subtitle, description,
  duration_days, theme_color, gradient, icon,
  category, price, original_price, price_note,
  benefits, stages, learning_formats,
  target_audience, is_active, display_order
) VALUES (
  'emotion_stress_7',
  '7天情绪解压训练营',
  '冥想·教练·打卡·分享，系统解压',
  '通过每日冥想、AI情绪教练梳理、打卡记录和社区分享，7天建立高效情绪管理习惯',
  7,
  'emerald',
  'from-emerald-500 to-teal-500',
  '🧘',
  'youjin',
  399, 599, '限时特惠',
  '["7天冥想引导音频","AI情绪教练无限对话","每日打卡追踪","社区分享支持"]',
  '[{"stage":1,"title":"觉察与释放（Day 1-3）","lessons":["认识压力信号","身体扫描冥想","情绪命名与表达"]},{"stage":2,"title":"重建与巩固（Day 4-7）","lessons":["认知重构练习","自我关怀冥想","压力管理工具箱","建立日常解压习惯"]}]',
  '[{"type":"meditation","title":"冥想引导","description":"每日5-10分钟引导冥想","icon":"Moon"},{"type":"coaching","title":"AI教练对话","description":"情绪梳理与觉察","icon":"MessageCircle"},{"type":"checkin","title":"打卡记录","description":"追踪每日进展","icon":"Check"},{"type":"sharing","title":"社区分享","description":"与同伴交流感悟","icon":"Share2"}]',
  '["职场人士","压力较大人群","情绪管理初学者"]',
  true, 15
);
```

## 前端修改

### 1. `src/pages/CampCheckIn.tsx`
- 在通用打卡布局（`emotion_diary_21` 等）的任务卡片区域，当 `camp_type === 'emotion_stress_7'` 时：
  - **新增冥想任务卡片**（在情绪教练对话之前），点击跳转至 `/tools`（复用已有 MeditationTimer 页面）或内嵌简易冥想计时器
  - **情绪教练对话卡片**路由增加 `emotion_stress_7` 判断，跳转 `/emotion-coach`

### 2. `src/components/energy-studio/AudienceHub.tsx`
- "职场解压"按钮路由改为 `/camp-intro/emotion_stress_7`

### 3. `src/components/poster/PosterStatsCard.tsx`
- `templateNames` 增加 `emotion_stress_7: '7天情绪解压营'`

### 4. `src/components/community/ShareCard.tsx`
- 分享路由映射增加 `emotion_stress_7` → `/camp-intro/emotion_stress_7`

### 5. CampIntro 页面
- 无需修改，已有动态路由 `/camp-intro/:campType` 自动渲染

## 核心逻辑

- 每日任务流：冥想 → 情绪教练对话（→ `/emotion-coach`） → 自动打卡 → 分享
- 购买流程复用 `UnifiedPayDialog` + `useCampPurchase`
- 打卡逻辑复用 `performCheckIn`

