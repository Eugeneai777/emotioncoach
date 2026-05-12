## 目标
在【有劲生活馆】的【专业测评】列表中新增「男人有劲状态评估」入口，点击后跳转到现有测评页 `/assessment/male_midlife_vitality`。

## 实现步骤

### 1. 数据库新增一条测评工具记录
向 `energy_studio_tools` 插入一行（迁移）：
- `tool_id`: `male-midlife-vitality`
- `title`: 男人有劲状态评估
- `description`: 6维深度扫描，识别男人中年活力卡点
- `icon_name`: `Flame`（lucide 图标）
- `category`: `exploration`
- `gradient`: `from-orange-500 to-red-500`
- `display_order`: 1（排在财富卡点附近，靠前露出）
- `is_available`: true

### 2. 前端配置 `src/config/energyStudioTools.ts`
- 在 `assessmentToolIds` Set 中加入 `"male-midlife-vitality"`，让前端筛选到「专业测评」 tab。
- 在 `tools` 数组追加一条 `type: "assessment"` 配置（用于 `getToolById` 取 `duration` / `tags`）：duration `8分钟`，tags `["新", "男士专属"]`。

### 3. 路由跳转 `src/pages/EnergyStudio.tsx`
在 `handleToolClick` 的 `navRoutes` 映射中加入：
```ts
"male-midlife-vitality": "/assessment/male_midlife_vitality",
```
其余渲染逻辑（标签/图标/时长展示）已是数据驱动，无需改动。

## 不改动范围
- 不修改测评本身（`DynamicAssessmentPage` / `male_midlife_vitality` 模板）。
- 不动【日常工具】tab 与其它入口。
