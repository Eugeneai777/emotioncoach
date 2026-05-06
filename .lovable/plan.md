## 问题定位

经核实代码，35+女性竞争力测评结果页（`CompetitivenessResult.tsx`）**已有**「7天有劲训练营」跳转入口（第472-482行），但只是一个 `variant="outline"` 的细长按钮，紧跟在「AI 深度解读」卡片之后。在长长的雷达图 + 折叠式 AI 解读之后，用户视觉上很容易忽略它，所以反馈"没有"。

而财富卡点测评（`WealthBlockResult.tsx` 第720-750行）使用的是**emerald-teal 渐变卡片 + 图标 + 文案 + CTA 按钮**的高显眼组件，因此一眼就能看到。

两者实现质量不一致，需统一为同等显眼程度。

## 优化方案

把 `CompetitivenessResult.tsx` 中 `{/* 7天有劲训练营推荐 */}` 那一段（472-482行）从「outline 细按钮」升级为与财富卡点页一致的「渐变推荐卡片」：

- 使用 rose→purple 渐变（沿用本页 35+ 女性主题色，避免突兀）
- 卡片内含：图标 + 标题「7天有劲训练营」+ 一句针对 35+ 女性的贴合文案（例如"职场+家庭双线疲惫？7天每日15分钟能量练习，帮你重启节奏感、找回竞争力底气"）+ 主按钮「了解7天有劲训练营」
- 位置保留在「AI 深度解读」之后、分享卡片之前
- 跳转目标 `/camp-intro/emotion_stress_7` 不变

## 技术细节

- 仅修改 `src/components/women-competitiveness/CompetitivenessResult.tsx` 第472-482行
- 复用项目已有的 `Card / CardContent / Button` 组件，颜色用 Tailwind 渐变类（与财富卡点页一致的写法）
- 不动任何业务逻辑、数据库、付费墙
- 历史报告也走同一组件，所以老用户回看时也会看到新卡片

## 验证

实现后用浏览器工具进入 `/women-competitiveness` 历史报告页截图确认卡片渲染正常即可。
