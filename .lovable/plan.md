

# 错误类型分布增加页面位置、用户、时间信息

## 问题

当前"错误类型分布与诊断"只显示错误类型名称和次数（如 `server_error 3次 60%`），缺少关键上下文：
- **报错页面位置**：不知道是在哪个页面/功能触发的错误
- **来源用户**：只有截断的 userId（8位），没有用户昵称
- **详细时间**：没有展示最近发生时间

## 修复方案

### 1. 数据采集层：`RequestRecord` 增加 `page` 字段

**文件**：`src/lib/stabilityDataCollector.ts`

- `RequestRecord` 接口新增 `page?: string` 字段，记录触发请求时的 `location.pathname`
- 在 fetch 拦截器的两处 `pushRecord()` 调用中，添加 `page: location.pathname`
- 同时增加路径到中文页面名的映射函数 `getPageLabel()`，将 `/wealth-block` 映射为"财富卡点测评"等

### 2. 错误指标增强：`typeDistribution` 携带详情

**文件**：`src/lib/stabilityDataCollector.ts`

- `ErrorMetrics.typeDistribution` 每项增加 `recentDetails` 数组，包含该类型最近 5 条错误的 `{ userId, page, timestamp }` 信息
- 在 `computeHealthMetrics()` 的错误统计逻辑中收集这些详情

### 3. 用户名查询

**文件**：`src/components/admin/StabilityMonitor.tsx`

- 收集所有出现在 `recentDetails` 中的 userId
- 批量查询 `profiles` 表的 `display_name`（userId 是前8位，需用 `like` 匹配）
- 建立 userId → 显示名称 的映射

### 4. UI 展示增强

**文件**：`src/components/admin/StabilityMonitor.tsx`

在"错误类型分布与诊断"的每个错误类型条目下方，新增一个"最近报错详情"区域：

```text
server_error  ████████████  3次 (60%)
├ 诊断卡片...
└ 最近报错:
  · 财富卡点测评支付  桑洪彪  2026.02.26 09:25
  · 情绪健康测评      张三    2026.02.26 09:20
```

每条显示：页面中文名 · 用户昵称（无则显示ID前8位）· 格式化时间

## 技术细节

| 文件 | 改动说明 |
|------|----------|
| `src/lib/stabilityDataCollector.ts` | `RequestRecord` 加 `page` 字段；fetch 拦截器记录 `location.pathname`；`typeDistribution` 增加 `recentDetails`；新增 `getPageLabel()` 路径映射 |
| `src/components/admin/StabilityMonitor.tsx` | 查询 profiles 获取用户名；错误类型条目下展示页面、用户、时间详情 |

## 改动量
- 2 个文件
- 数据采集层约 30 行改动
- UI 展示层约 40 行改动
- 不影响现有功能，纯增量

