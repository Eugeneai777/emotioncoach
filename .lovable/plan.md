## 目标
在 mini-app 入口页(`src/pages/MiniAppEntry.tsx`)隐藏「短剧脚本」入口卡片,不在前端展示给用户。

## 改动
**文件**: `src/pages/MiniAppEntry.tsx`
- 删除第 608–630 行整个「短剧脚本」入口的 `<div className="px-4 pb-4">...</div>` 包裹块(含 `motion.button`、图标、标题、副标题、箭头)。
- 如果 `Clapperboard` 图标在文件内仅此一处使用,顺手从顶部 `lucide-react` import 中移除,避免 lint 警告。

## 保留
- 路由 `/drama-script` 与底层组件 `DramaScriptGenerator` 不删除(后台 admin 还在使用,且便于将来恢复)。
- 仅前端 mini-app 入口隐藏。

## 验收
- mini-app 首页(`MiniAppEntry`)在「7天有劲训练营 banner」下方不再出现「短剧脚本」卡片。
- 页面其余布局、滚动、动画不受影响。