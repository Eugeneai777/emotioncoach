

## 拉大管理后台弹窗尺寸

### 问题
当前 `DialogContent` 默认最大宽度为 `sm:max-w-lg`（约 512px），对管理后台的复杂表单和内容来说偏小。

### 方案

为 `DialogContent` 增加 `size` prop，提供 5 个标准尺寸，方便各弹窗按需选择：

```text
size="sm"   -> sm:max-w-md   (420px, 简单确认/设置)
size="md"   -> sm:max-w-lg   (512px, 默认，保持向后兼容)
size="lg"   -> sm:max-w-2xl  (672px, 复杂表单)
size="xl"   -> sm:max-w-3xl  (768px, 富内容编辑)
size="full" -> sm:max-w-4xl  (896px, 大表格/矩阵)
```

### 改动范围

**1. 修改 `src/components/ui/dialog.tsx`**
- 用 `class-variance-authority` 为 `DialogContent` 添加 `size` variant
- 统一内置 `max-h-[85vh] overflow-y-auto`
- 默认 `size="md"`，不传时行为不变

**2. 批量更新管理后台弹窗**

将各弹窗手动写的 `className="max-w-xxx"` 替换为对应的 `size` prop：
- 简单弹窗（删除确认、角色设置）→ `size="sm"`
- 中等弹窗（创建合伙人、工单详情）→ `size="md"`（可省略）
- 复杂弹窗（用户详情、产品编辑、OG编辑）→ `size="lg"`
- 大型弹窗（知识库编辑、Prompt矩阵、四部曲编辑）→ `size="xl"` 或 `size="full"`

约 35 个管理后台弹窗文件需要更新，非管理后台弹窗保持不变。
