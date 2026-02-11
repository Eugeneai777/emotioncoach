

## 财富简报三大问题修复计划

### 问题诊断

经过代码分析，确认以下三个问题：

**问题 1：对话完成后没有在聊天界面展示财富简报卡片**
- 当前逻辑：AI 调用 `generate_wealth_briefing` 工具后，仅显示一条文字消息"正在生成财富日记..."和一个 toast 通知
- 缺失：没有在聊天窗口内渲染生成后的简报摘要卡片（如行为层/情绪层/信念层/给予行动等核心内容）

**问题 2：独立教练页面生成的简报在"财富简报"标签页不显示**
- 从 `/coach/wealth_coach_4_questions` 独立页面对话时，`contextData.campId` 为空，生成的日记 `camp_id` 为 NULL
- 查询逻辑 `useWealthJournalEntries` 第 87 行有 `.not('camp_id', 'is', null)` 过滤条件，排除了所有无训练营关联的简报
- `WealthCampCheckIn` 页面的查询也使用 `.eq('camp_id', campId)` 过滤

**问题 3：术语不统一，"财富日记"应统一为"财富简报"**
- 全代码库约 86 处使用"财富日记"，需统一为"财富简报"

---

### 修复方案

#### 1. 聊天界面增加财富简报结果卡片

创建 `src/components/wealth-camp/WealthBriefingResultCard.tsx`：
- 展示四层结构摘要：行为卡点、情绪信号、信念转化、给予行动
- 包含"查看详情"按钮跳转到简报详情页
- 样式与财富教练主题（amber/orange）一致

修改 `src/hooks/useDynamicCoachChat.ts`：
- 日记生成成功后，在聊天消息中追加一条包含简报数据的特殊消息（如 JSON 标记）
- 或通过新增 state（如 `generatedJournalData`）将简报数据传回 UI 层

修改 `src/components/ChatMessage.tsx` 或 `CoachLayout`：
- 检测简报生成完成后，在最后一条消息下方渲染 `WealthBriefingResultCard`

#### 2. 修复简报列表查询逻辑

修改 `src/hooks/useWealthJournalEntries.ts`（第 87 行）：
- 移除 `.not('camp_id', 'is', null)` 过滤条件，或改为条件性过滤
- 当不指定 campId 时，显示所有简报（含独立对话生成的）

修改 `src/pages/WealthCampCheckIn.tsx`（第 239-244 行）：
- 在"财富简报"标签页中，查询条件改为支持显示当前用户的所有简报，不仅限于当前 camp

#### 3. 统一术语"财富日记"→"财富简报"

涉及文件（约 12 个）：
- `src/hooks/useDynamicCoachChat.ts` - toast 和日志文案
- `src/pages/WealthCampCheckIn.tsx` - 页面标题和空状态文案
- `src/pages/WealthJournalDetail.tsx` - 详情页标题
- `src/components/wealth-camp/WealthJournalShareDialog.tsx` - 分享文件名
- `src/components/wealth-camp/WealthCampShareCard.tsx` - 介绍文案
- `src/components/wealth-camp/GraduationShareCard.tsx` - 毕业卡片
- `src/config/shareCardsRegistry.ts` - 分享卡片标题
- `src/hooks/useQuickMenuConfig.ts` - 快捷菜单标签
- `src/hooks/usePaymentCallback.ts` - 注释
- `src/pages/partner/CampGraduate.tsx` - 毕业页面

---

### 技术细节

#### 简报结果卡片实现方式

在 `useDynamicCoachChat` 中，日记生成成功后追加一条格式化消息到聊天流：

```text
// 在 journalResult 成功后，替换当前的"正在生成..."消息为完成消息
setMessages(prev => prev.map((msg, i) => 
  i === prev.length - 1 && msg.content.includes('正在生成')
    ? { ...msg, content: `📖 **财富简报已生成** (Day ${dayNumberToUse})\n\n**行为觉察**: ${briefingData.behavior_insight}\n**情绪信号**: ${briefingData.emotion_insight}\n**信念转化**: ${briefingData.belief_insight}\n**给予行动**: ${briefingData.giving_action}` }
    : msg
));
```

#### 查询修复

```typescript
// useWealthJournalEntries.ts - 移除 camp_id 非空过滤
let query = supabase
  .from('wealth_journal_entries')
  .select('*')
  .eq('user_id', user.id)
  .order('day_number', { ascending: true });

if (campId) {
  query = query.eq('camp_id', campId);
}
// 不再添加 .not('camp_id', 'is', null)
```

WealthCampCheckIn 的"财富简报"标签页也需要包含 `camp_id` 为空的记录（属于独立教练对话生成的简报）。

