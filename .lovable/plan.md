
## 总体目标（MVP 升级版）

在前一版方案基础上，扩展数据洞察的范围：从「售前漏斗」延伸到「学习交付」全链路，覆盖 `/promo/synergy` → 兑换/付费 → `/camp-checkin`（即 `/ln/:campId`）日常打卡 → 7 天结业。

产品判断：**学习侧 80% 的核心指标已在数据库里**（`camp_daily_progress`、`training_camps`、`conversations`、`briefings`），**MVP 不必为它们再加埋点**——只对"DB 无法捕获的曝光/意图行为"补少量埋点。这样既快又准。

---

## 一、埋点清单（最小够用集）

### A. 售前转化（前一版已确认）

| 事件 | 触发点 |
|---|---|
| `synergy_cta_click` | `SynergyPromoPage` 3 处 CTA |
| `synergy_youzan_click` | `SynergyRedeemDialog` 有赞按钮 |
| `synergy_youzan_qr_view` | 小程序码 mount |
| `synergy_redeem_success` | 兑换成功回调 |

### B. 学习交付（本次新增，仅 4 个）

| 事件 | 触发点 | 为何要埋（DB 不够用的原因） |
|---|---|---|
| `camp_checkin_page_view` | `CampCheckIn.tsx` mount（按 day_index 分组） | 区分"打开了第 X 天页面但没做任务"vs"完全没来" |
| `camp_task_start_click` | 4 个任务卡片的「开始冥想/开始对话/开始分享/查看推荐」按钮 onClick | 衡量"看到任务→点开任务"的意愿转化（DB 只记录完成态） |
| `camp_meditation_complete` | 冥想播放完成事件（已有时长追踪点） | 区分"勾选已完成"vs"真的播完了" |
| `camp_share_to_community_open` | 「开始分享」打开分享弹窗 | 衡量分享意愿（DB 只记最终 `has_shared_to_community`） |

> 其余学习数据全部直接从 DB 聚合，不再埋点（见下表）。

### C. 不埋点、直接从 DB 取的指标

| 指标 | 数据源 |
|---|---|
| 每日打卡完成率（按 day 1-7） | `camp_daily_progress.is_checked_in` |
| 当日必做任务完成率（冥想/对话/打卡） | `camp_daily_progress` 各字段 |
| 7 天全勤率 / 结业率 | `training_camps.completed_days = 7` |
| 平均完成天数 | `avg(training_camps.completed_days)` |
| AI 教练对话深度 | `conversations` + `briefings` JOIN |
| 反思简报生成数 | `briefings` count by camp |
| 社区分享率 | `camp_daily_progress.has_shared_to_community` |
| 留存曲线（Day1→Day7） | `camp_daily_progress` 按 progress_date 聚合 |
| 补卡使用率 | `camp_daily_progress.checkin_type = 'makeup'` |

---

## 二、后台「7天有劲训练营 · 数据洞察」面板（扩展版）

入口仍在「内容管理 → 训练营管理 → 7天有劲训练营」卡片右上「数据洞察」按钮，跳转 `/admin/camps/emotion_stress_7/insights`。

### Tab 化结构（对标测评洞察，按业务阶段分 Tab）

```text
┌─ 🏕️ 7天有劲训练营 · 数据洞察 ──────────────────────┐
│ 时间筛选: 今日 / 7天 / 30天 / 自定义    [导出 CSV] │
├────────────────────────────────────────────────────┤
│ [Tab 1: 总览]  [Tab 2: 售前转化]  [Tab 3: 学习交付] │
└────────────────────────────────────────────────────┘
```

#### Tab 1 · 总览（北极星）
KPI 卡（一行 5 个）：
- 售前页 UV
- 付费/兑换成功数
- 入营率（购买 → 至少打 1 天卡）
- 7 天全勤率
- 结业 NPS（先占位，二期接入）

下方折线图：每日新付费 vs 每日打卡 UV（双轴）

#### Tab 2 · 售前转化漏斗（前一版方案）
```
售前页 UV → CTA 点击 → 有赞跳转 → 兑换成功 → 入营
   100  →    40    →    25   →    8     →   8
        40%        62.5%        32%       100%
```
+ 流量来源 TOP（按 ref/referrer）
+ 兑换成功用户名单（含手机/兑换码/操作）

#### Tab 3 · 学习交付（新增核心）

**Block 1 · 7 天完成率热力图**
```
        Day1  Day2  Day3  Day4  Day5  Day6  Day7
入营人数 100   100   100   100   100   100   100
打卡UV    92    85    78    71    65    61    58
完成率   92%   85%   78%   71%   65%   61%   58%
```
→ 一眼看出流失最严重的那一天

**Block 2 · 当日必做任务完成率**（按 day_index 分桶）
```
              冥想完成   对话完成   打卡   社区分享(选)
Day1 (n=100)   85%       72%       92%    18%
Day2 (n=92)    78%       65%       85%    14%
...
```

**Block 3 · 学习行为漏斗（聚合 7 天）**
```
打开打卡页 → 点开冥想 → 冥想完成 → 点开对话 → 对话完成 → 当日打卡
  PV         click      complete    click       briefing     checkin
```

**Block 4 · 学员名单**
| 昵称 | 手机 | 入营日 | 当前 Day | 完成天数 | 最后活跃 | 状态 | 操作 |
|---|---|---|---|---|---|---|---|
| … | … | … | Day 3 | 3/7 | 2h ago | 🟢进行中 | 查看详情 / 复制手机 |

状态枚举：进行中 / 流失警告（>2 天未活跃）/ 已结业 / 已退营

筛选：进行中 / 流失 / 已结业 + 搜索

**Block 5 · 结业洞察**（小卡片组）
- 平均完成天数
- 平均对话轮次
- 平均简报生成数
- 补卡使用率

---

## 三、技术实现

### 新建文件
- `src/components/admin/camps/CampInsightsDetail.tsx`（主页面，含 3 个 Tab）
- `src/components/admin/camps/insights/CampSalesFunnel.tsx`
- `src/components/admin/camps/insights/CampLearningPanel.tsx`
- `src/components/admin/camps/insights/CampStudentTable.tsx`
- `src/hooks/useCampInsights.ts`（聚合 hook，返回三类数据）

### 修改文件（埋点 + 入口）
- `src/lib/behaviorTracker.ts` → 新增 `trackEvent(eventType, metadata?)` 通用方法
- `src/pages/promo/SynergyPromoPage.tsx` → 3 处 CTA
- `src/components/promo/SynergyRedeemDialog.tsx` → 有赞 / QR / 兑换成功
- `src/pages/CampCheckIn.tsx` → mount 埋 page_view、4 个任务按钮 onClick 埋 task_start
- `src/components/admin/CampTemplatesManagement.tsx` → 卡片新增「数据洞察」按钮（仅 `emotion_stress_7` 启用）
- `src/components/admin/AdminLayout.tsx` → 注册 `camps/:campKey/insights` 路由

### 数据库
**完全无需迁移**。所有指标走现有表：
- `user_behavior_signals`（埋点）
- `camp_daily_progress` / `training_camps`（学习交付）
- `synergy_redeem_codes` / `orders`（售前转化）

### 权限
沿用 `/admin` 现有 `has_role(admin)` 校验。学员名单查询走 admin 上下文，已有 RLS 覆盖。

### 性能
- 默认窗口 7 天，预估 PV < 1k/周、学员 < 200，前端聚合可承受
- 学员名单分页（每页 50）
- 折线图按日预聚合，hook 内 `useMemo`

---

## 四、二期可扩展（不在本次 MVP）

- 单学员行为时间线（点开「查看详情」抽屉）
- 流失预警自动推送（结合现有 `smart_notifications`）
- 与 1v1 / Havruta 团辅排课系统打通
- 21 天营、绽放营复用同一组件，按 `camp_key` 切换

---

## 五、MVP 取舍说明（产品视角）

| 想做 | 本期是否做 | 理由 |
|---|---|---|
| 售前 + 学习 完整漏斗 | ✅ | 闭环价值最大 |
| 7 天热力图 + 任务完成率 | ✅ | 决定续作运营策略的核心 |
| 学员名单 + 流失标记 | ✅ | 运营立刻可用 |
| 单学员行为时间线 | ❌ 二期 | 工作量大，先用聚合数据驱动 |
| 自动流失推送 | ❌ 二期 | 需要先观察阈值 |
| NPS / 结业满意度 | ❌ 二期 | 需先接入问卷收集 |
| 后端 RPC 聚合 | ❌ | MVP 数据量小，前端聚合更快迭代 |
