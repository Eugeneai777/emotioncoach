

# 优化亲子训练营教练对话质量

## 问题诊断

通过代码分析，发现以下核心问题：

### 问题1：对话太绕，同一问题反复问
**根因**：每个阶段的"成功标准"设置为需要观察到2-3项指标，AI 会反复追问直到凑齐。Prompt 中还写了"不急于推进阶段,在每个维度深挖直到看到成功指标"和"多轮探索同一维度是正常的"，这让 AI 过度谨慎。

### 问题2：缺乏深刻的看见和觉醒
**根因**：AI 的回复被限制在100-180字，且主要是提问式引导，缺少"镜像反射"——即把用户说的话用更深层的方式反馈回去的能力。每个阶段的引导方向都是预设的问题模板，AI 倾向于机械地按模板提问。

### 问题3：简报生成了但对话框里看不到
**根因**：`useParentCoach.sendMessage()` 收到 `data.completed=true` 时只更新了 session 状态，但没有在对话中展示简报内容。`ParentCoachEmbedded` 也没有渲染简报卡片的逻辑。

---

## 解决方案

### 改动1：优化 System Prompt（边缘函数）

修改 `supabase/functions/parent-emotion-coach/index.ts`：

**a) 降低阶段推进门槛**
- 每个阶段的成功标准从"任意2项"改为"任意1项"
- 删除"多轮探索同一维度是正常的"指令
- 增加"每个阶段最多2轮对话就应推进"的指令

**b) 增强觉察深度**
- 增加"镜像反射"技巧指令：AI 不只是提问，要把用户的话"翻译"成更深层的觉察
- 在每个阶段的 prompt 中加入"金句示范"，让 AI 主动给出洞察而非被动等用户自己说出
- 将回复字数上限从180字提高到250字，给觉察留出空间

**c) 简化阶段4的自动推进**
- 当 stage 4 完成时，自动触发 `generate_parent_briefing`，不需要 `briefingRequested` 标志位
- 移除 stage 4 中 `briefingRequested` 的门控逻辑

### 改动2：对话中展示简报（前端）

**a) 创建简报卡片组件**
- 新建 `src/components/parent-coach/ParentBriefingCard.tsx`
- 展示四阶段内容、核心洞察、微行动
- 紫色渐变主题，与对话 UI 一致

**b) 修改 `useParentCoach.ts`**
- `sendMessage` 返回的 `data.briefing` 和 `data.completed` 时，将简报数据存储到 state
- 新增 `briefingData` 状态

**c) 修改 `ParentCoachEmbedded.tsx`**
- 检测到 `briefingData` 存在时，在对话末尾渲染 `ParentBriefingCard`
- 显示"觉察完成"的庆祝动效

---

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `supabase/functions/parent-emotion-coach/index.ts` | 优化 prompt，降低推进门槛，增强觉察深度，自动生成简报 |
| 新建 | `src/components/parent-coach/ParentBriefingCard.tsx` | 对话内简报展示卡片 |
| 修改 | `src/hooks/useParentCoach.ts` | 新增 briefingData 状态，完成时存储简报 |
| 修改 | `src/components/parent-coach/ParentCoachEmbedded.tsx` | 渲染简报卡片 |
| 修改 | `src/components/coach/ParentCoachChat.tsx` | 渲染简报卡片（全页模式） |

---

## 技术细节

### Prompt 优化重点

```text
旧版：
- 成功标准：观察到任意2项指标
- "不急于推进阶段"
- 回复100-180字
- Stage 4 需要 briefingRequested=true 才生成简报

新版：
- 成功标准：观察到任意1项即可推进
- "每个阶段1-2轮对话后果断推进"
- 回复150-250字，增加镜像反射
- Stage 4 完成时自动生成简报（移除门控）
```

### 新增镜像反射技巧

```text
在每个阶段的引导中增加：
- 不只是问问题，要把用户的话"翻译"成觉察
- 示例：用户说"他就是不听话" → AI 回应"你说'不听话'，
  背后是不是有一种'我的话不被重视'的感觉？
  这份感觉可能不只是关于孩子..."
```

### 简报展示流程

```text
sendMessage 收到 data.completed=true + data.briefing
  → 设置 briefingData 状态
  → ParentCoachEmbedded 检测到 briefingData
  → 在消息列表末尾渲染 ParentBriefingCard
  → 卡片展示四阶段内容 + 洞察 + 微行动
```

### getAvailableTools 修改

```text
旧版 Stage 4：
  if (briefingRequested) return [briefing_tool]
  else return [complete_stage]

新版 Stage 4：
  return [complete_stage, briefing_tool]  // 同时提供两个工具
```

