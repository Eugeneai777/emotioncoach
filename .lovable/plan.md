## 现状诊断

`/assessment/male_midlife_vitality` 历史对比视图（`DynamicAssessmentHistory.tsx` 中 `compareMode` 分支）当前问题：

1. **视觉空洞**：04/29 → 04/30 中部大块留白，原始分 `0 → 34` 没有翻转成"状态指数"，雷达图在稀疏数据下几乎看不到形状。
2. **数值语言冰冷**：`+5 / +7` 是技术口径，男人看到 `恢复阻力 +7` 不知好坏（原始分越高越差，翻转后才更好）。
3. **价值点缺失**：没有回答中年男性最关心的——我现在啥状态？哪一项先动手？比上次好/坏在哪？接下来怎么办？
4. **商业承接为零**：对比卡底部无 CTA，错过用户"刚看见自己变化"的最高转化时刻。

---

## 商业架构思路

把"历史对比"从**数据展示**重构为**男性向状态叙事 + 行动闭环**：看见 → 理解 → 行动 → 复测。

### 内容架构（5 个 Block）

```text
┌────────────────────────────────────────┐
│ 1. 状态电量对比卡                      │
│    上次 XX% · ↑+N% · 本次 XX%          │
│    一句话定调："电量回到了 XX%"        │
├────────────────────────────────────────┤
│ 2. 6 维雷达 + 上下叠层                 │
│    翻转后的状态指数（越大越好）        │
├────────────────────────────────────────┤
│ 3. 关键变化 Top3 进步 + Top1 退步      │
│    ✅ 睡眠修复 +18% "夜里更扛得住了"    │
│    ⚠️ 顶事力 -12% "关键时刻还在硬撑"    │
├────────────────────────────────────────┤
│ 4. 本周一个动作（基于最弱维度）        │
│    "本周只做一件事：睡前 10 分钟离机"  │
├────────────────────────────────────────┤
│ 5. 三选一 CTA（按状态档分级排序）      │
│    [找教练 1v1] [进 7 天有劲营] [复测] │
└────────────────────────────────────────┘
```

### 男性向语言映射

| 维度 | 状态语言 | 加分文案 | 减分文案 |
|---|---|---|---|
| 精力续航 | 电量 | 白天更扛造了 | 下午就开始没电 |
| 睡眠修复 | 修复力 | 夜里能真正关机 | 睡了像没睡 |
| 压力内耗 | 抗压阀门 | 压得住事了 | 心里那根弦还在崩 |
| 关键时刻信心 | 顶事力 | 关键场合更稳 | 关键时还在硬撑 |
| 关系温度 | 家里温度 | 和家人能松下来 | 回家还是装着 |
| 恢复阻力 | 恢复速度 | 跌倒后爬起更快 | 状态掉了拉不回 |

### 三档状态分级

- **80-100 满电**：绿 / 主推「7 天后复测」
- **50-79 半电**：琥珀 / 主推「7 天有劲营」
- **0-49 低电**：橙红 / 主推「找教练 1v1」

---

## 三端兼容与稳定性（核心约束）

### 排版策略
- **断点统一**：用 Tailwind `sm: md: lg:`，与项目现有断点一致；不引入新媒体查询。
- **容器宽度**：沿用历史页 `max-w-lg md:max-w-2xl mx-auto`，PC 端不撑满，避免雷达图被拉伸。
- **5 个 Block 全部 `w-full` + `min-w-0`**：避免子内容（长文案、emoji）撑破父容器导致横向滚动。
- **数字与中文混排**：用 `tabular-nums` + `whitespace-nowrap` 锁定百分比列宽，防止换行抖动。
- **雷达图高度**：移动 `h-[260px]`，平板 `sm:h-[300px]`，PC `md:h-[360px]`，全部用 `ResponsiveContainer`，沿用现有 `DimensionRadarChart` 不改动其内部。
- **CTA 按钮**：移动单列 `flex-col gap-2`，≥sm 三列 `sm:grid sm:grid-cols-3 sm:gap-3`，每个按钮 `min-h-[44px]` 满足触控规范。

### 小程序 web-view 约束
- **不使用** `position: fixed`、`window.open`、`document.referrer`（小程序内不可靠）。
- **CTA 路由**：统一走 `useNavigate`；外链场景复用现有 `openExternalUrl` + `wechat.eugenewe.net` 标准。
- **分享对比海报**：复用 `MaleMidlifeVitalityShareCard` 渲染路径与 `useMiniProgramShareBridge`，不新建桥接。
- **路由稳定**：先 `navigate(...)` 再 `setCompareMode(false)`（遵循 Component Reentrancy 规范）。

### 流畅度
- **动画降级**：所有 `framer-motion` 动效用 `prefers-reduced-motion` 自动降级（项目已有 `useReducedMotion`），低端 Android 不卡顿。
- **首屏不阻塞**：Block 1-3 同步渲染；雷达图（Block 2）和文案表（Block 3-4）通过 `useMemo` 缓存计算，避免每次 re-render 重算翻转分。
- **图片零依赖**：5 个 Block 全部 SVG/emoji，无远程图，避免小程序内白屏。
- **零网络新请求**：本次改造不调用任何 edge function，对比文案完全本地规则映射。

### 兼容性回归测试矩阵（实施时 QA）

| 端 | 视口 | 关注点 |
|---|---|---|
| H5 iOS Safari | 375×812 / 414×896 | 雷达图 SVG 渲染、`100vh` 抖动 |
| H5 Android Chrome | 360×800 | emoji 字体回退、长文案换行 |
| 微信小程序 web-view | 375×667 / 414×736 | 路由跳转、分享桥接、不出现横向滚动 |
| iPad | 768×1024 | `sm:` 断点切换 |
| PC | 1280 / 1440 / 1920 | 容器居中不拉伸、CTA 三列均分 |

---

## 实施步骤

### 1. 新建男性向语言配置
`src/config/maleMidlifeVitalityCopy.ts`
- `STATUS_LABEL_MAP`：维度 → 生活化标签
- `getStatusBand(pct)`：返回 `{ level, color, headline, ctaPrimary }`
- `getDeltaCopy(label, deltaPct)`：返回加/减分中文短句
- `getActionForWeakestDimension(label)`：返回"本周一句话动作"

### 2. 新建对比叙事组件
`src/components/dynamic-assessment/MaleVitalityCompareView.tsx`
- 接收 `currentRecord`, `previousRecord`，输出 5 个 Block
- 内部翻转原始分（复用现有 `toVitalityStatusScore`）
- 三端响应式 class 严格按上文断点策略
- CTA 路由：教练 → `/coaches`，7 天营 → 现有 vitality 营路径，复测 → `localStorage` + Toast

### 3. 接入 `DynamicAssessmentHistory.tsx`
- 在 `sorted && compareMode` 分支内，**仅当 `isMaleMidlifeVitality === true`** 时用 `<MaleVitalityCompareView />` 替换原通用 Card；其它测评保持不变。
- 折叠详情区（行 510 起）追加一行"与上次相比"摘要带（电量变化 / 进步最大 / 退步最大），共用同一文案库。

### 4. 三端 QA（按上方矩阵）

---

## 不做的事（控制范围）

- 不改数据库、不动 `og_configurations`、不动评分引擎
- 不替换通用 `DynamicAssessmentHistory`，其它测评零影响
- 不引入 AI 生成对比文案（首版规则映射，零延迟、零额度）
- 不调整海报组件结构，仅复用

---

## 交付物

- 新增：`src/config/maleMidlifeVitalityCopy.ts`
- 新增：`src/components/dynamic-assessment/MaleVitalityCompareView.tsx`
- 修改：`src/components/dynamic-assessment/DynamicAssessmentHistory.tsx`（仅在 vitality 分支注入新组件 + 折叠详情加摘要带）

预计代码量 ≈ 380 行（含文案表）。
