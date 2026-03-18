

## 修正后的精简方案

### 现状确认
`/mini-app`（MiniAppEntry.tsx）没有使用 PageHeader，因此**没有汉堡菜单**。底部只有 `AwakeningBottomNav`，快捷菜单是该页面唯一的功能入口。

### 改动内容

| 文件 | 改动 |
|------|------|
| `src/components/awakening/AwakeningBottomNav.tsx` | 快捷菜单中「建议」改名为「联系客服」，路径 `/customer-support` 不变 |
| `src/components/FloatingQuickMenu.tsx` | 删除「建议」条目，消除其他页面的重复入口 |

### 最终效果
- `/mini-app` 主页：快捷菜单「联系客服」是**唯一客服入口**
- 其他页面（如觉察日记）：通过 PageHeader 汉堡菜单访问客服
- 浮动菜单不再包含重复客服条目

