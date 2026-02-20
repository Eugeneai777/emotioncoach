

## 在二维码卡片下方添加「分享测评结果」卡片按钮

### 目标
在 WealthAdvisorQRCard（财富觉醒顾问二维码卡片）下方，新增一个「分享我的测评结果」入口卡片，点击后打开已有的 `WealthInviteCardDialog` 分享弹窗。

---

### 设计方案

在结果页中，WealthAdvisorQRCard 下方（约第 695 行之后）插入一个分享入口卡片，视觉上为一个简洁的 CTA 卡片：

```text
┌────────────────────────────────────┐
│  📤  分享我的AI测评报告给朋友       │
│  让他们也来看看自己的财富卡点        │
│                      [立即分享 →]  │
└────────────────────────────────────┘
```

点击后触发 `WealthInviteCardDialog`，使用 `defaultTab="value"` 并传入当前测评分数和反应模式。

---

### 技术细节（仅修改 `src/components/wealth-block/WealthBlockResult.tsx`）

**1. 添加导入**
- 导入 `WealthInviteCardDialog`（来自 `@/components/wealth-camp/WealthInviteCardDialog`）
- 导入 `Share2` 图标（来自 `lucide-react`）

**2. 在 WealthAdvisorQRCard 与 BloomInviteCodeEntry 之间插入分享卡片**

```tsx
{/* 分享测评结果入口 */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.4 }}
>
  <WealthInviteCardDialog
    defaultTab="value"
    assessmentScore={result ? 100 - calculateHealthScore(
      result.behaviorScore + result.emotionScore + result.beliefScore
    ) : undefined}
    reactionPattern={result.reactionPattern}
    trigger={
      <Card className="cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50">
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">分享我的AI测评报告</p>
            <p className="text-xs text-muted-foreground">让朋友也来看看自己的财富卡点</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    }
  />
</motion.div>
```

**3. 需要额外导入的内容**
- `Share2` 已在页面头部导入列表中（需确认，若未导入则添加）
- `WealthInviteCardDialog` 需新增导入
- `ChevronRight` 需确认是否已导入

---

### 影响范围
- 仅修改 `src/components/wealth-block/WealthBlockResult.tsx`（添加导入 + 插入约 25 行 JSX）
- 复用现有的 `WealthInviteCardDialog` 组件，无需创建新组件
- 不影响现有页面逻辑
