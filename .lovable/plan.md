

## 将「觉察日记」加入自我探索分类

### 当前数据库结构

**自我探索分类工具列表（按 display_order 排序）：**
| display_order | tool_id | title |
|--------------|---------|-------|
| 0 | wealth-block | 财富卡点测评 |
| 5 | goals | 目标设定 |
| 6 | values | 价值探索 |
| 7 | vision | 愿景板 |
| 8 | strengths | 优势识别 |

---

### 修改方案

#### 1. 数据库：插入新工具记录

在 `energy_studio_tools` 表中插入「觉察日记」：

```sql
INSERT INTO energy_studio_tools (
  tool_id, title, description, detailed_description,
  icon_name, category, gradient, display_order, 
  is_available, is_system, usage_scenarios
) VALUES (
  'awakening',
  '觉察日记',
  '记录困境与顺境，打破无意识状态',
  '通过6个入口（情绪、选择、关系、感恩、行动、方向）记录生活中的困境与顺境，用最低成本打破"自动驾驶"状态，发现命运的破局点。',
  'Sparkles',
  'exploration',
  'from-amber-500 to-orange-500',
  1,  -- 放在财富卡点(0)之后
  true,
  true,
  ARRAY['感觉迷茫时', '想打破惯性时', '睡前5分钟记录']
);
```

#### 2. 代码：添加跳转逻辑

**文件**：`src/pages/EnergyStudio.tsx`

在 `handleToolClick` 函数中添加觉察日记的路由：

```tsx
// 第91-108行，添加新的跳转逻辑
const handleToolClick = (toolId: string) => {
  if (toolId === 'awakening') {
    navigate('/awakening');
    return;
  }
  if (toolId === 'goals') {
    navigate('/goals');
    return;
  }
  // ... 其他逻辑
};
```

---

### 修改后效果

**自我探索分类工具列表：**
```text
├── 财富卡点测评 (display_order: 0)
├── 觉察日记     (display_order: 1)  ← 新增
├── 目标设定     (display_order: 5)
├── 价值探索     (display_order: 6)
├── 愿景板       (display_order: 7)
└── 优势识别     (display_order: 8)
```

---

### 修改清单

| 类型 | 内容 | 说明 |
|-----|------|------|
| 数据库 | INSERT 新记录 | 添加觉察日记工具 |
| 代码 | `src/pages/EnergyStudio.tsx` | 添加 `/awakening` 跳转逻辑 |

