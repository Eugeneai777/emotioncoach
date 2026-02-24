

## 优化课程页面顶部标题居中

### 问题

从截图可以看到，"线上课程"标题没有居中显示，而是偏右。原因是左侧有 Logo + 返回按钮占据了空间，但右侧没有对应的占位元素，导致 `flex-1 text-center` 的标题区域实际上不居中。

### 解决方案

将标题改为 `absolute` 定位实现真正的视觉居中（类似 `PageHeader` 组件的做法），不受左右内容宽度的影响。

### 具体改动

**文件：`src/pages/Courses.tsx`**

修改 header 部分的布局结构：

1. 给 header 内部容器添加 `relative` 定位
2. 标题区域改为 `absolute left-1/2 -translate-x-1/2`，实现真正居中
3. 副标题一并居中显示

改动前：
```text
[Logo] [返回]  [        线上课程（偏右）        ]
```

改动后：
```text
[Logo] [返回]      线上课程（居中）
                共358门课程·系统化学习成长
```

### 技术细节

- 将标题的 `flex-1 text-center` 替换为 `absolute left-1/2 -translate-x-1/2` 绝对居中
- 这与项目中 `PageHeader` 组件（第74行）使用的居中方式一致，保持风格统一
- 不影响左侧 Logo 和返回按钮的功能

