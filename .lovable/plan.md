
问题定位（为什么会“显示不完全”）
1. 这个页面的“数据看板”Tab里同时渲染了 `PartnerSharedDataDashboard` 和 `ZhileOrdersDashboard`。
2. `ZhileOrdersDashboard` 内部表格设置了 `minWidth: 1900px`（并且 table 是 `w-max`），但外层及上层容器缺少足够的 `w-full / min-w-0 / max-w-full` 约束，导致最小宽度向上“撑开”布局。
3. 结果是：不仅订单表右侧字段难以完整看到，连上方看板区域（空态文案、按钮、统计卡）也会出现右侧被截断，看起来像“数据没显示全”。

实施方案（只做前端结构修复，不改后端）
1. 在数据看板Tab容器做宽度隔离
   - 文件：`src/components/admin/industry-partners/IndustryPartnerDetail.tsx`
   - 给 `Tabs`、`TabsContent value="data-dashboard"`、内部 `space-y-6` 容器补齐 `w-full min-w-0`（必要时加 `max-w-full`），避免子组件宽度外溢影响整页。

2. 重构知乐订单表滚动容器，彻底隔离“内容宽度”和“布局宽度”
   - 文件：`src/components/partner/ZhileOrdersDashboard.tsx`
   - 结构改为：
     - 外层：`w-full min-w-0`
     - 横向滚动层：`w-full max-w-full overflow-x-auto`（绑定 `scrollRef`）
     - 纵向滚动层：`max-h-[60vh] overflow-y-auto`
     - 表格：`min-w-[1900px] w-max`
   - 目标：页面本身不被撑宽，只有表格区内部可横向滚动。

3. 滚动条可见性强化（保持你要的“类似图中效果”）
   - 保留并收敛自定义 scrollbar 样式到稳定 class（不再依赖易冲突内联结构）。
   - 提高横向滚动条对比度与厚度，保证在常见浏览器下可见。

4. 保持现有交互
   - 左右滚动按钮继续操作同一个横向滚动容器。
   - sticky 表头、筛选、导出等逻辑不变。

验收标准
1. 数据看板上方空态文案与“录入数据”按钮居中完整，不再右侧截断。
2. 知乐订单统计卡完整显示（4张卡不被裁切）。
3. 订单表可在首屏区域看到并使用横向滚动（拖动或左右按钮都可到最右列）。
4. 在常见宽度（1366/1536/1920）下显示一致。
