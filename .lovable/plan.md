

## AI 自动配置体验包

选择产品后，系统自动调用 AI 生成图标、描述、功能特性、颜色主题等字段，管理员只需确认或微调即可保存。

---

### 交互流程

1. 管理员在下拉菜单中选择一个产品
2. 界面显示"AI 配置中..."加载状态
3. 后端函数调用 AI，根据产品名称和描述自动生成：
   - icon（合适的 emoji）
   - value（如"1次"、"50点"等）
   - description（一句话描述，约30-50字）
   - features（4条功能亮点）
   - color_theme（blue/green/amber/purple 之一）
4. 自动填充所有字段，管理员可修改后保存

---

### 实现步骤

#### 1. 新建后端函数

**文件：** `supabase/functions/generate-experience-config/index.ts`

- 接收 `package_name`、`description`、`price` 参数
- 使用 Lovable AI（`google/gemini-2.5-flash`）生成配置
- Prompt 要求 AI 返回 JSON 格式：`{ icon, value, description, features, color_theme }`
- 参考现有体验包数据风格（如已有的尝鲜会员、情绪健康测评等）作为 few-shot 示例
- 需要管理员权限验证（检查 `user_roles` 表中的 admin 角色）

#### 2. 修改前端组件

**文件：** `src/components/admin/ExperiencePackageManagement.tsx`

修改 `handlePackageSelect` 函数：

- 选择产品后，立即调用 `generate-experience-config` 函数
- 显示加载状态（按钮/输入框显示 skeleton 或 spinner）
- AI 返回结果后，自动填充所有表单字段（name、value、icon、description、features、color_theme）
- 如果 AI 调用失败，回退到当前逻辑（仅填充 name 和 value）
- 添加"重新生成"按钮，允许管理员对 AI 结果不满意时重新请求

---

### 技术细节

**AI Prompt 设计：**

```text
你是一个体验包配置助手。根据以下产品信息，生成体验包的展示配置。

产品名称：{package_name}
产品描述：{description}
产品价格：¥{price}

请参考以下已有配置风格：
- 尝鲜会员：icon=🎫, value=50点, description=体验有劲AI教练的入门权益...
- 情绪健康测评：icon=💚, value=1次, description=56道专业题目评估...

返回 JSON 格式（不要包含其他文字）：
{
  "icon": "一个最贴切的emoji",
  "value": "如1次、50点等",
  "description": "30-50字的一句话描述",
  "features": ["亮点1", "亮点2", "亮点3", "亮点4"],
  "color_theme": "blue或green或amber或purple"
}
```

**调用方式：**

```typescript
const response = await supabase.functions.invoke('generate-experience-config', {
  body: { package_name, description, price }
});
```

### 文件变更总表

| 文件 | 操作 |
|------|------|
| `supabase/functions/generate-experience-config/index.ts` | 新建 |
| `src/components/admin/ExperiencePackageManagement.tsx` | 修改 - 添加 AI 自动配置逻辑 |

