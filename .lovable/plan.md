

## 合并为单一"我的推广中心"卡片

### 当前问题

推广 Tab 仍有两张独立卡片，信息重复：
- **EntryTypeSelector**：入口方式选择 + 体验包列表 + 链接预览 + 保存按钮 + 4条提示
- **FixedPromoLinkCard**：链接显示 + 复制/二维码/海报 + 3条提示

两者都显示推广链接，都有复制功能，提示文字也有重叠。

### 方案：合并为一个组件 PromotionHub

```text
+------------------------------------------+
| 🔗 我的推广中心          剩余 88 名额     |
+------------------------------------------+
| 入口方式:  [免费领取]  [付费¥9.9]         |
|                                          |
| 推广链接:                                |
| https://wechat.eugenewe.net/claim?...    |
|                                          |
| [复制链接]  [二维码]  [海报]              |
|                                          |
| > 查看体验包内容（可折叠）                |
|                                          |
| ✓ 永久有效 · 用户注册后永久绑定           |
+------------------------------------------+
```

### 设计要点

1. **入口切换即时保存** — 选择免费/付费后自动保存到数据库，去掉"保存设置"按钮，减少操作步骤
2. **体验包默认折叠** — 用 Collapsible 组件包裹体验包列表，默认收起，减少视觉噪音
3. **链接区只保留一处** — 合并两处链接显示，保留操作按钮（复制/二维码/海报）
4. **提示精简为一行** — 7条提示合并为2-3条核心信息

### 技术细节

**新建文件：`src/components/partner/PromotionHub.tsx`**
- 整合 EntryTypeSelector 和 FixedPromoLinkCard 的全部功能
- Props：`partnerId`, `currentEntryType`, `prepurchaseCount`, `onUpdate`
- 入口切换使用 debounce 自动保存（切换后 500ms 自动保存）
- 体验包用 Collapsible 包裹，默认收起
- 链接根据当前 entryType 实时生成
- 操作按钮：复制链接、下载二维码、跳转海报中心

**修改文件：`src/pages/Partner.tsx`**
- 移除 EntryTypeSelector 和 FixedPromoLinkCard 的 import 和使用
- 替换为单个 `<PromotionHub>` 组件

**可删除文件（改动完成后）：**
- `src/components/partner/FixedPromoLinkCard.tsx`
- `src/components/partner/EntryTypeSelector.tsx`
（需先确认无其他页面引用）

