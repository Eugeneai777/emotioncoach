# 在 mini-app 首页增加「小区生活」入口

## 背景

项目里已有的「小区」相关页面是 **有劲生活**（路由 `/youjin-life`），页面内包含「🏘️ 小区生活圈」板块（社区服务卡片、外部链接）、本月消费摘要，以及子页面 `/youjin-life/chat`、`/expenses`、`/help`、`/habits`。

目前 mini-app 首页（`/mini-app`）的「探索更多」横滑模块只有 4 张卡片：日常工具、专业测评、系统训练营、故事教练，**没有指向有劲生活的入口**。

## 要做的事

在 mini-app 首页「探索更多」横滑模块中新增第 5 张卡片：

- 标题：小区生活
- 副标题：家门口的日常
- 描述：小区服务、邻里活动、生活记账，家门口的事一站搞定。
- 点击跳转：`/youjin-life`
- 配色：绿色系（emerald / teal），与现有 cyan、violet、amber、orange 卡片区分

卡片样式、动画、横向滑动行为完全沿用现有卡片，不改动其它模块。

## 技术细节

- 文件：`src/pages/MiniAppEntry.tsx`
- 在 `exploreBlocks` 数组末尾追加一项，字段与现有项一致（`icon`、`title`、`sub`、`desc`、`route`、`illustrationKey`、`iconColor`、`iconBg`、`bg`、`ring`、`glow`）
- 从 `lucide-react` 引入 `Home`（或 `Building2`）作为图标
- 渲染逻辑无需改动，数组驱动自动生效
