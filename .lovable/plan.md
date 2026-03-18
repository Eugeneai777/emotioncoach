
## 发布失败修复计划（针对“Up to date 变蓝、无法真正发布”）

### 我确认的问题
- 你不是“没点对按钮”，而是**构建阶段失败**，所以发布状态会反复回到可点击蓝色。
- 当前核心报错是：`Cannot find package 'rollup' imported from /opt/template-node-modules/vite/dist/node/cli.js`。
- 这是依赖解析/安装层问题，不是轮播图 UI 代码逻辑问题。

### Do I know what the issue is?
Yes。问题在于构建环境里 `vite -> rollup` 依赖链没有被正确装载（且项目同时存在 Bun/NPM 锁文件，容易触发构建器使用不一致的依赖来源）。

---

### 实施步骤（代码层）
1. **统一包管理器来源（关键）**
   - 删除：`bun.lock`、`bun.lockb`
   - 只保留 `package-lock.json` 作为唯一锁文件，避免构建环境混用 Bun 模板依赖。

2. **显式声明 rollup 依赖（兜底）**
   - 在 `package.json` 增加 `rollup`（建议放 `dependencies`，保证任何安装模式都能拿到）。
   - 保持 `vite` 版本与现有配置一致，不改业务代码。

3. **触发一次干净重装与重建**
   - 通过依赖文件变更触发平台重新安装依赖并重新构建。
   - 不再通过“改注释”这种软触发方式处理这类依赖级错误。

4. **发布验证**
   - 验证预览可正常启动（不再出现 rollup 缺失）。
   - 再执行 Publish → Update，确认状态不再回蓝。
   - 快速回归 `/mini-app`：轮播展示、点击跳转、测评弹窗均正常。

---

### 技术细节（给你透明说明）
- 报错路径在 `/opt/template-node-modules/...`，说明失败发生在构建依赖容器，而非业务页面代码。
- 你当前出现的一组“模块找不到 / 类型异常”症状（如 framer-motion、jspdf、react-query 等）与 rollup 报错属于同类：**依赖树未正确加载**。
- 解决优先级是“依赖安装稳定性” > “页面代码调整”。

---

### 影响范围
- 仅改依赖与锁文件：
  - `package.json`
  - `bun.lock`（删除）
  - `bun.lockb`（删除）
- `src/pages/MiniAppEntry.tsx` 等业务页面不做功能改动，视觉与跳转逻辑保持现状。
