

# 为青少年、中年觉醒、银发陪伴添加底部导航和"设为首页"功能

与宝妈专区相同的处理方式，对三个页面做同样的改动。

## 改动文件

### 1. `src/pages/xiaojin/XiaojinHome.tsx`
- 引入 `AwakeningBottomNav`
- 外层容器添加 `pb-20`
- 在底部（footer 前）添加"设为我的首页"按钮，`localStorage.setItem('preferred_audience', 'youth')`
- 页面底部添加 `<AwakeningBottomNav />`

### 2. `src/pages/LaogeAI.tsx`
- 引入 `AwakeningBottomNav`
- 外层容器添加 `pb-20`
- 添加"设为我的首页"按钮，`localStorage.setItem('preferred_audience', 'midlife')`
- 页面底部添加 `<AwakeningBottomNav />`

### 3. `src/pages/ElderCarePage.tsx`
- 引入 `AwakeningBottomNav`
- 外层容器添加 `pb-20`
- 添加"设为我的首页"按钮，`localStorage.setItem('preferred_audience', 'senior')`
- 页面底部添加 `<AwakeningBottomNav />`

### 4. `src/pages/MiniAppEntry.tsx`
- 已有 `preferred_audience` 检查逻辑，确认 audiences 数组中 `youth`/`midlife`/`senior` 的 id 和 route 映射正确（当前已正确）

每个页面的"设为首页"按钮样式与宝妈专区一致，颜色匹配各自主题。

