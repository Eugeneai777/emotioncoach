

# 优化身份绽放训练营落地页（6项修改）

## 改动总览

所有修改集中在 `src/pages/IdentityBloomPromoPage.tsx` 一个文件。

### 1. 去除"AI教练"和"海沃塔"相关文案

**涉及位置：**
- **Hero 副标题**（~L451）：删除"AI教练 +"，改为"专业教练 + 知乐胶囊，双重陪伴系统蜕变"
- **Hero 三引擎公式**（~L462-478）：移除 `Brain/AI教练` 卡片，只保留"专业教练"和"知乐胶囊×4"
- **coreHighlights 数组**（L90）：删除 `AI身份教练` 条目，删除体系化闭环中的"AI陪伴"文字
- **dailyLoop 数组**（L101）：删除 `AI教练对话` 步骤
- **deliveryCore 数组**（L109）：删除 `AI身份教练系统` 条目
- **supportRoles 数组**（L177）：删除 `AI身份教练系统` 条目
- **成功面板**（~L232）：去除 AI 相关提示文案

### 2. 知乐胶囊图片更换

将上传的 `4盒装商品封面.jpg` 复制到 `src/assets/zhile-4box-cover.jpg`，替换胶囊区块（~L861）的 `zhileProductNew` 引用。

### 3. 真实改变数据优化

替换现有 `testimonials` 数组（L182-186）为用户提供的7条学员真实反馈（截图中的内容），格式改为纯引语卡片（无虚构数据指标），标题改为"学员真实反馈：活成自己，才是幸福感与成就感的终极答案"。

### 4. 专业教练辅导小字修改

`dailyLoop` 数组第3项（L102）：`desc` 从"资深教练1V1/小组辅导"改为"资深教练小组辅导"。

### 5. 专属亮点改为1项

`deliveryHighlights` 数组（L113-116）：删除海沃塔条目，仅保留1项：
```
{ icon: "🎯", title: "资深教练小组辅导", detail: "量身定制身份重建方案", tag: "稀缺" }
```
渲染区域从 `grid-cols-2` 改为单列居中。

### 6. 附加权益改为2项

`deliveryBonuses` 数组（L117-121）：改为：
```
[
  { icon: "🔄", title: "免费复训" },
  { icon: "🏘️", title: "成长社群" },
]
```

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/pages/IdentityBloomPromoPage.tsx` | 修改上述6处内容 |
| `src/assets/zhile-4box-cover.jpg` | 新增（从上传文件复制） |

