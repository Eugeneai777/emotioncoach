

# 在 /mini-app 页面添加"介绍"按钮

## 改动

**文件：`src/pages/MiniAppEntry.tsx`**

在品牌区（logo + 标题）右侧添加一个"了解有劲AI"按钮，点击跳转 `/platform-intro`。

具体做法：在顶部品牌区的 `div` 内，标题右侧添加一个小按钮，使用 `Info` 图标 + "介绍"文字，样式为轻量圆角胶囊按钮（`outline` 风格），与品牌区视觉协调。

同时需要导入 `Info` 图标。

| 文件 | 改动 |
|------|------|
| `src/pages/MiniAppEntry.tsx` | 品牌区添加"介绍"按钮，跳转 `/platform-intro` |

