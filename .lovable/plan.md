

## 在邀请对话框中添加"财富测评海报"卡片选项

### 目标

在"生成分享卡片"对话框中新增一个"财富测评"推广海报选项，与现有的"训练营邀请"卡片并列。该海报**不显示个人测评结果**，只展示产品卖点和二维码，适合推广分享。

### 新增卡片设计

| 元素 | 内容 |
|------|------|
| 标题 | 财富卡点测评 |
| 副标题 | 3分钟找到你的财富天花板 |
| 卖点1 | 30个真实财富场景深度扫描 |
| 卖点2 | AI智能解码行为/情绪/信念三层卡点 |
| 卖点3 | 90%的人测完才发现：不是赚得少，是留不住 |
| 底部CTA | 扫码免费测评 + 二维码 |
| 配色 | 琥珀-橙色渐变（与训练营卡片协调但有区分） |

### 改动文件

**1. 新建 `src/components/wealth-block/WealthBlockPromoShareCard.tsx`**
- 纯推广卡片组件，不接收任何测评分数/结果数据
- 接收 `avatarUrl`、`displayName`、`partnerInfo` 用于个性化
- 使用 `useQRCode` 生成指向 `/wealth-block` 的二维码
- 使用 inline styles 确保 html2canvas 兼容
- 琥珀-紫色渐变背景，与训练营卡片风格统一但配色区分

**2. 修改 `src/components/wealth-camp/WealthInviteCardDialog.tsx`**
- `CARD_OPTIONS` 从 1 个选项扩展为 2 个：

```text
[
  { id: 'camp',  label: '训练营邀请', emoji: '🏕️' },
  { id: 'promo', label: '财富测评',   emoji: '💰' },
]
```

- 新增 `CardTab` 类型 `'promo'`
- 新增 `promoCardRef` ref
- `renderCard` 中添加 `case 'promo'` 渲染新组件
- `abovePreview` 恢复 Tab 选择器 UI（当选项 > 1 时显示切换按钮）
- `promo` 卡片使用 html2canvas 截图流程（非服务端生成），与 `camp` 一致
- 默认选中 `camp`（从打卡页进入时）

### 改动量

| 文件 | 类型 | 改动 |
|------|------|------|
| `WealthBlockPromoShareCard.tsx` | 新建 | 约 120 行推广卡片组件 |
| `WealthInviteCardDialog.tsx` | 修改 | 添加 Tab 选项、ref、renderCard case、Tab UI |

共 2 个文件，无数据库或后端改动。

