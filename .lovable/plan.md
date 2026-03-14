

# 微信小程序入口页方案

## 目标

新建一个专为微信小程序 WebView 设计的精简入口页（路由 `/mini-app`），只展示 6 个人群按钮，全屏沉浸式布局，无顶部导航栏。`/energy-studio` 保持不变。

## 改动

### 1. 新建 `src/pages/MiniAppEntry.tsx`

- 全屏沉浸式设计，无 PageHeader（小程序自带导航栏）
- 顶部 logo + 标语区（有劲AI · 每个人的生活教练）
- 6 个人群入口以 2x3 大卡片网格展示，每张卡片更大（约 140px 高），渐变封面 + 大 emoji + 标题 + 副标题
- 底部可选"探索更多"链接跳转到 `/energy-studio`
- 使用 `detectPlatform()` 检测小程序环境，可做平台适配

### 2. 注册路由（`src/App.tsx`）

- 添加 `/mini-app` 路由指向 `MiniAppEntry`

### 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | 新建，小程序入口页 |
| `src/App.tsx` | 注册 `/mini-app` 路由 |

无数据库改动。`/energy-studio` 不受影响。

