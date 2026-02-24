

## 优化课程页面排版 - 去除冗余按钮

### 要解决的问题

从截图可以看到，来源筛选行（"全部来源 358"、"绽放公开课 105"、"有劲365 253"）和类别筛选行的"全部"按钮占据了太多空间，且"全部来源"按钮与"全部"按钮功能重复，用户体验冗余。

### 具体改动

**文件：`src/pages/Courses.tsx`**

1. **删除整个来源筛选行**（第317-337行）-- 移除"全部来源"、"绽放公开课"、"有劲365"三个按钮
2. **删除类别筛选中的"全部"按钮** -- categories 数组不再包含 `{ id: "all", name: "全部" }` 项
3. **删除 `activeSource` 状态及相关逻辑** -- 包括 `sourceStats`、`sourceFilteredCourses`、`sources` 数组，以及 `filteredCourses` 中的来源筛选判断
4. **类别筛选支持取消选中** -- 点击已选中的类别按钮时，切换回显示全部课程（相当于 `activeCategory = "all"`），这样无需"全部"按钮
5. **`categoryStats` 改为基于全部课程计算**（因为没有来源筛选了）

### 改动后的布局

```text
[搜索框]
[个人成长 38] [人际关系 22] [情绪管理 38] [领导力 260]
显示 20 / 358 门课程
[课程卡片...]
```

点击已激活的类别按钮可取消筛选，回到全部课程。

### 技术细节

- 删除 `activeSource` state 和 `setActiveSource`
- 删除 `sourceStats`、`sourceFilteredCourses`、`sources` 变量
- `categoryStats` 直接从 `courses` 计算
- `filteredCourses` 中去掉来源筛选逻辑
- 类别按钮 onClick 改为 toggle 逻辑：`setActiveCategory(prev => prev === cat.id ? "all" : cat.id)`
- categories 数组从 `Object.entries(categoryStats)` 开始，不再加 "全部" 项

