

## 问题确认

截图所示页面是 **DynamicCoach（动态文字教练）** 页面用户点击「语音通话」后弹出的 `CoachVoiceChat` 全屏覆盖层。

底部的「今天心情 / 人际关系 / 压力 / 自我成长」场景胶囊与「分享你的想法…」文字输入框，**是底层文字教练页面的 `CoachInputFooter` 组件**，它没有被语音覆盖层挡住，反而盖住了语音页底部的红色挂断按钮。

## 根因（已查实）

- `CoachVoiceChat` 根容器：`fixed inset-0 z-50`（src/components/coach/CoachVoiceChat.tsx:2273）
- `CoachInputFooter` 根容器：`fixed bottom-0 ... z-50`（src/components/coach/CoachInputFooter.tsx:121）

两者 **z-index 相同（都是 z-50）**，由于 `CoachInputFooter` 在 DOM 中位于 `CoachVoiceChat` 之后渲染（`CoachLayout` 内嵌套层级更深），后绘制者覆盖先绘制者 → 文字底栏盖住红色挂断按钮，用户无法点击挂断/通话/PTT 按钮。

同样的问题在 `CommunicationCoach`、`WealthCoachChat` 等同类型动态教练页都存在（都用 `CoachLayout` + `CoachVoiceChat` 组合）。

## 修复方案

### 方案 A（推荐 · 最小改动）：提升 `CoachVoiceChat` 的 z-index

把 `CoachVoiceChat` 全屏容器的 `z-50` 提升到 `z-[60]`（或 `z-[100]`），让语音页稳定盖在所有底栏之上。

**改动 1 处**：
- `src/components/coach/CoachVoiceChat.tsx:2215`（PTT 接通画面）
- `src/components/coach/CoachVoiceChat.tsx:2242`（连接中画面）  
- `src/components/coach/CoachVoiceChat.tsx:2273`（主对话画面）

把这 3 处的 `z-50` 改为 `z-[60]`。

**优点**：
- 一处改动，覆盖 DynamicCoach / CommunicationCoach / WealthCoachChat 等所有调用方
- 不影响 `CoachInputFooter` 在文字模式下的层级（toast `z-[100]`、弹窗 `z-[60]` 仍然能正常盖在语音页上）
- 不动业务逻辑

### 方案 B（治本 · 二选一）：打开语音覆盖时隐藏底层文字底栏

在 `DynamicCoach.tsx` / `CommunicationCoach.tsx` / `WealthCoachChat.tsx` 里，把 `showVoiceChat` 状态透传给 `CoachLayout`，当其为 `true` 时不渲染 `CoachInputFooter`：
- `CoachLayout` 增加 `hideFooter?: boolean` prop
- 调用方：`hideFooter={showVoiceChat}`

**优点**：从根上消除两层 fixed 元素叠加，避免任何点击穿透/无障碍朗读混乱。
**缺点**：要改 4 个文件，工作量稍大。

### 推荐
**采用方案 A**：单点修复立即解决问题；同时把方案 B 作为后续优化预留（不在本次提交内）。

## 改动清单（方案 A）

- `src/components/coach/CoachVoiceChat.tsx`：
  - 第 2215 行 `z-50` → `z-[60]`
  - 第 2242 行 `z-50` → `z-[60]`
  - 第 2273 行 `z-50` → `z-[60]`

## 不改动

- `CoachInputFooter` 仍保持 `z-50`（文字模式下与系统其他 sticky 元素的层级关系不变）
- 业务逻辑、计费、麦克风释放、PTT 模式等均不动
- 弹窗 / Toast / Sheet（默认 `z-[100]`）仍然能正常覆盖语音页

## 验证方式

1. 打开 `/coach/vibrant_life_sage`（情绪教练）→ 点击「语音通话」
2. 红色挂断按钮应在最上层，可正常点击挂断
3. 底层「今天心情 / 人际…」胶囊与「分享你的想法…」输入框应被语音页完全遮盖（不可见、不可点）
4. 在 `/coach/communication`、`/coach/wealth_*` 等同类页面同样验证
5. 通话中弹出的余额不足横幅、点数规则弹窗、Recharge 弹窗仍能正常显示（z-[100] > z-[60]）

