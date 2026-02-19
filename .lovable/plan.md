

# 优化推广活动页面设计 — 运营视角

## 目标

将推广活动的详情页和列表页从"信息展示"升级为"运营工作台"，突出投放量、数据指标和快捷操作。

## 修改内容

### 1. 详情页重构 (`PartnerLandingPageDetail.tsx`)

**增加数据概览区（Stats Row）**
在标题和 Meta 行之间插入一行 4 格统计卡片，运营一眼可见关键数据：

```text
+----------+----------+----------+----------+
| 投放量   | 观看     | 购买     | 转化率   |
| 1000人以下|   12    |    3    |  25.0%   |
+----------+----------+----------+----------+
```

- 投放量：读取数据库 `volume` 字段（如 "1000人以下"）
- 观看/购买：从 `conversion_events` 表实时查询
- 转化率：自动计算 购买/观看

**Meta 行优化**
- 显示顺序调整为：受众 · 渠道 · 投放量 · 创建日期
- 编辑模式改为 3 列：受众 / 渠道 / 投放量

**编辑模式支持 volume**
- 新增 `editVolume` state
- 保存时同步写入 `volume` 字段

**接口更新**
- `LandingPageData` 增加 `volume: string | null`

### 2. 列表页优化 (`PartnerLandingPageList.tsx`)

**展示真实投放量**
- 查询时增加 `volume` 字段
- "投放"列显示真实 `volume`（如 "1000人以下"），替代硬编码的 0
- 因 volume 是文本格式（如 "1000人以下"），列宽适当加宽到 w-14

**接口更新**
- `LandingPage` 增加 `volume: string | null`

### 3. 详情页数据获取

新增 `fetchMetrics` 函数，从 `conversion_events` 中查询当前活动的观看和购买数据，与详情页 Stats Row 绑定。

## 技术细节

```text
PartnerLandingPageDetail.tsx:
  - interface: 增加 volume
  - state: 新增 editVolume, metrics { views, purchases }
  - fetchMetrics(): 查询 conversion_events where metadata->landing_page_id = id
  - Stats Row: 4 格 grid，bg-muted/30 圆角卡片
  - Meta 行: grid-cols-3 编辑布局（受众/渠道/投放量）
  - saveEditing: update 含 volume

PartnerLandingPageList.tsx:
  - select 增加 volume
  - interface 增加 volume
  - "投放"列: page.volume || "—" 替代 "0"
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/components/partner/PartnerLandingPageDetail.tsx` | 增加 Stats Row、volume 编辑、metrics 查询 |
| `src/components/partner/PartnerLandingPageList.tsx` | 查询并展示真实 volume |

