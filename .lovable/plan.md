

## 服务条款同意文本一行显示优化

### 问题

截图中"继续即表示您同意 服务条款 和 隐私政策"换行成了两行，视觉上不够紧凑。

### 修改方案

**修改 `src/pages/Auth.tsx`（第 567-583 行）**

1. 将容器从 `items-start` 改为 `items-center`（checkbox 居中对齐）
2. 移除 checkbox 的 `mt-0.5` 偏移
3. 给 label 添加 `whitespace-nowrap` 防止换行
4. 去除链接文字的左右 `mx-0.5` 间距，改用更紧凑的写法

修改后效果：整行文字 + checkbox 在同一行显示，不换行。

**同步修改 `src/components/onboarding/QuickRegisterStep.tsx`** 中相同的条款区域，保持两处入口样式一致。

### 涉及文件

- `src/pages/Auth.tsx` — 主登录页条款区域
- `src/components/onboarding/QuickRegisterStep.tsx` — 快速注册弹窗条款区域

