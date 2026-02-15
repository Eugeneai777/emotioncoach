

## 去除推广码卡片，整合为"我的推广中心"

### 改动

推广 Tab 中"我的推广码"卡片（第 208-230 行）与"固定推广链接"卡片功能完全重叠——都是给用户一个链接去分享。推广码本身对用户无意义，用户只需要一个可复制的链接和二维码。

**删除"我的推广码"整个 Card（第 207-230 行）**，同时删除相关的 `handleCopyCode` 和 `handleCopyLink` 逻辑。

推广 Tab 改后只保留两个组件：
1. `EntryTypeSelector` — 选择免费/付费入口
2. `FixedPromoLinkCard` — 推广链接 + 复制/二维码/海报

### 技术细节

**修改文件：`src/pages/Partner.tsx`**
- 删除第 207-230 行的推广码 Card 区块
- 删除 `handleCopyCode` 和 `handleCopyLink` 函数（搜索后确认是否还有其他地方引用）
- 移除不再需要的 `Copy` 图标 import（如果仅此处使用）

改后推广 Tab 结构：
```text
推广 Tab
├── EntryTypeSelector（入口方式 + 体验包内容）
└── FixedPromoLinkCard（推广链接 + 操作按钮）
```

