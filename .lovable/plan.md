
# 亲子沟通测评页面添加 PageHeader

## 问题
亲子沟通测评页面（`/communication-assessment`）缺少全站标准的 `PageHeader` 组件，没有左上角 Logo 和返回按钮。

## 方案
在 `CommunicationAssessment.tsx` 的 `<main>` 标签内、`<Tabs>` 之前插入 `PageHeader` 组件：

- 使用 `backTo="/communication-intro"` 让返回按钮导航回亲子教练页面
- 不设置 title，保持简洁（与其他测评页一致）

## 修改文件
**`src/pages/CommunicationAssessment.tsx`**
- 导入 `PageHeader`
- 在 `<main>` 内顶部添加 `<PageHeader backTo="/communication-intro" />`
