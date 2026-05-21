## Mama 页面横幅链接修改

### 修改内容
将 Mama 页面（`/mama`）顶部 sticky 横幅的跳转链接修改：

- **当前链接：** `/promo/synergy?source=mama`（7天有劲训练营）
- **目标链接：** `/promo/midlife-women-399`（7天身心舒展营）

### 文件
- `src/pages/MamaAssistant.tsx` 第 102 行
- 仅修改 `navigate()` 的目标路径参数

### 影响
- 横幅文案「🌸 7天有劲训练营 · 找回你的能量」保持不变（仅修改跳转目标）
- 未购买用户看到的 sticky 横幅点击后跳转至新的 midlife-women-399 推广页