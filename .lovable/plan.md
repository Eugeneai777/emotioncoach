# 修复情绪健康测评定价显示

## 问题

`/mini-app` 入口的"测一测"弹窗里，"情绪健康测评"仍显示为 `限时¥9.9` 并跳转到付费版 `/emotion-health`。但该测评现已改为免费，与首页其他入口（如 `/emotion-health-lite`）不一致。

## 改动

编辑 `src/pages/MiniAppEntry.tsx`，共 2 处：

1. **第 52 行**（女性专区 → 测一测 badge）
2. **第 628 行**（PromoBanner 活动轮播点击的测评列表）

两处都将：
- `route: "/emotion-health"` → `route: "/emotion-health-lite"`
- `price: "限时¥9.9"` → `price: "免费"`

## 不改动

- `/emotion-health` 付费版路由本身保留（仍可用于历史链接和付费完整版）
- 其他测评定价不变
- 不动后端、不动数据库
