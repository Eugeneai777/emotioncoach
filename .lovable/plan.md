

## 将"财富测评"设为第一个 Tab 选项

### 改动

只需修改 **1 个文件**：`src/components/wealth-camp/WealthInviteCardDialog.tsx`

#### 1. 调换 `CARD_OPTIONS` 顺序

将 `promo` 放到数组第一位：

```ts
const CARD_OPTIONS = [
  { id: 'promo', label: '财富测评',   emoji: '💰' },
  { id: 'camp',  label: '训练营邀请', emoji: '🏕️' },
];
```

#### 2. 更新默认选中 Tab

将 `defaultTab` 的默认值从 `'camp'` 改为 `'promo'`，确保打开对话框时默认显示财富测评卡片。

共 1 个文件，约 2 行改动。

