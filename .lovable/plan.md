

# 全页面顶部左上角添加有劲AI Logo

## 概述
在两个全局 Header 组件中统一添加有劲AI Logo，点击跳转到财富教练首页 `/`。不使用浮动按钮，而是固定集成在现有顶部导航栏的左上角位置。

---

## 方案：修改两个 Header 组件

应用中所有页面的顶部导航由两个组件控制：

1. **`PageHeader`**（用于 16+ 个子页面：设置、套餐、教练空间、训练营等）
2. **`CoachHeader`**（用于首页及所有教练对话页面）

只需修改这两个组件，即可覆盖全部页面。

---

## 具体改动

### 1. 修改 `src/components/PageHeader.tsx`

- 在左侧区域（返回按钮之前）添加有劲AI Logo
- Logo 使用已有的 `src/assets/logo-youjin-ai.png`，尺寸 28px 圆形
- 点击 Logo 跳转到 `/`（财富教练首页）
- 如果当前已在首页，Logo 不可点击（避免重复导航）
- Logo 始终显示，不受 `showBack` 等参数影响

布局变化：
```
之前: [返回] -------- [标题] -------- [右侧操作]
之后: [Logo] [返回] -- [标题] -------- [右侧操作]
```

### 2. 修改 `src/components/coach/CoachHeader.tsx`

- 在汉堡菜单按钮之前添加有劲AI Logo
- 同样 28px 圆形，点击跳转到 `/`
- 当前在首页时不做导航

布局变化：
```
之前: [菜单] [返回主页] -- [教练空间] [生活馆] [历史] [套餐/觉察] [通知]
之后: [Logo] [菜单] [返回主页] -- [教练空间] [生活馆] [历史] [套餐/觉察] [通知]
```

---

## 技术细节

### 修改文件
| 文件 | 改动 |
|------|------|
| `src/components/PageHeader.tsx` | 左侧添加 Logo 图片按钮 |
| `src/components/coach/CoachHeader.tsx` | 左侧添加 Logo 图片按钮 |

### 不新建文件
直接在两个 Header 组件中 import logo 图片并渲染，无需创建新组件。

### Logo 样式
- 使用 `src/assets/logo-youjin-ai.png`（项目中已有）
- 28px 圆形，`rounded-full object-cover`
- 点击时 `active:scale-95` 过渡动画
- 外层用 `cursor-pointer` 包裹，语义化为导航按钮

