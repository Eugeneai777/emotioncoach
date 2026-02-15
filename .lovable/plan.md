

## 将"开始对话"按钮固定在底部并重新设计

### 修改方案

**文件：`src/components/coach/CoachEmptyState.tsx`**

将当前的内联按钮改为固定在底部的浮动按钮：

- 移除现有的 `chatEntryRoute` 按钮区域（底部 `flex justify-center` 部分）
- 改用 `fixed bottom-0` 定位，始终显示在页面底部
- 按钮重新设计：更大、更醒目的圆角胶囊按钮，带有amber渐变和阴影效果
- 添加安全区域适配（`safe-area-inset-bottom`）

**文件：`src/components/coach/CoachLayout.tsx`**

- 当 `chatEntryRoute` 存在时，为主内容区底部添加额外 padding，防止内容被固定按钮遮挡

### 按钮设计

- 固定在屏幕底部居中
- 宽度较大（接近全屏宽度，两侧留边距）
- amber/orange 渐变背景（与财富教练主题一致）
- 大圆角（pill shape）
- 白色文字 + 箭头
- 较大的阴影效果
- 点击时缩放反馈

