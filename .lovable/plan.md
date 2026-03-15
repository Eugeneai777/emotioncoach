

# 优化 /us-ai 为轻入口设计（对齐 /mama 风格）

## 当前问题

`/us-ai` 是一个长滚动页面，包含 Hero、3个工具卡（含示例）、测评、每日卡片、冷静按钮、升级计划、CTA 共 7 个区块，内容过重，不符合轻入口模式。

`/mama` 的轻入口模式：品牌标题 → 中心大按钮 → 3列快捷入口 → 场景卡片 → 测评入口 → 设为首页 → 底部导航。

## 改造方案

### 重写 `src/pages/UsAI.tsx`

参照 MamaAssistant 的结构重新组织：

1. **顶部栏**：左侧"有劲生活馆"返回链接 + 右侧"分享"按钮
2. **品牌标题**：「我们AI」+ 副标题「两个人，更懂彼此」
3. **中心大按钮**：圆形渐变按钮（暖橙色），点击进入对话（`/us-ai/tool?type=chat`），文字"聊一聊"，配呼吸动画
4. **3列快捷入口**：
   - 💬 今日对话（→ chat）
   - 🔄 情绪翻译（→ translate）  
   - 🔧 冲突修复（→ repair）
5. **更多功能区**（横向紧凑卡片）：
   - 📊 关系测评（→ assessment）
   - ⏸️ 冷静按钮（→ calm，保留原有组件或内联）
   - 📋 每日关系卡（→ daily card，保留原有组件）
6. **设为我的首页**按钮：`localStorage.setItem('preferred_audience', 'couple')`
7. **底部**：`<AwakeningBottomNav />`

### 保留的子组件

- `UsAICalmButton`、`UsAIDailyCard` 可保留，但从页面直接展示改为通过入口点击展开或导航
- 也可选择精简后内联在页面中（如 MamaQuickScenarios 的方式）

### 删除/不再直接使用

- `UsAIHero`（合并到页面顶部）
- `UsAIToolCards`（改为 3 列小入口）
- `UsAIAssessment`（改为单行入口按钮）
- `UsAICTA`（不再需要底部大 CTA）
- `UsAIUpgrade`（可放入更多功能区或移除）

### 样式主题

保持 usai 暖橙配色（`usai-primary`、`usai-beige`、`usai-light`），与 mama 的粉色系做区分。

## 文件变更

| 文件 | 改动 |
|------|------|
| `src/pages/UsAI.tsx` | 重写为轻入口布局，添加 AwakeningBottomNav 和"设为首页" |

子组件文件暂不删除，仅不在主页面引用（冷静按钮和每日卡片可选择内联保留）。

