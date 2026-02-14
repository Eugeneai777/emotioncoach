
## 全面优化：Dashboard 增强 + 落地页升级 + 真实数据接入

### 一、Dashboard 增强（FlywheelGrowthSystem.tsx）

**1.1 新增"活跃活动"统计卡片**
- 查询 `partner_landing_pages` 中 `status = 'published'` 的数量
- Dashboard 从 4 卡片扩展为 5 卡片（活跃活动 / 总投放 / 总触达 / 总转化 / 总收入）
- 移动端布局：第一行 3 个，第二行 2 个

**1.2 增长趋势指标**
- `fetchStats` 同时查询两个时间段：本周（0-7天）和上周（7-14天）
- 计算触达、转化、收入的周环比增长率
- 每个统计卡片下方用绿色箭头（增长）或红色箭头（下降）标注增长率

**1.3 按钮文案更新**
- "AI 定制落地页" 改为 "设置推广活动"，保留 Sparkles 图标

### 二、落地页设计升级（LandingPage.tsx）

**2.1 视觉增强**
- Hero 区域增加渐变背景装饰元素（圆形光晕）
- 标题加大字号，增加动态效果（fade-in）
- 产品标签从普通文字改为醒目的 Badge 样式

**2.2 社会证明区块**
- 在卖点和 CTA 之间新增社会证明：显示"已有 XX 人参与"虚拟计数
- 增加信任标识（安全保障、专业认证等图标）

**2.3 紧迫感元素**
- CTA 按钮增加脉冲动画效果
- CTA 下方增加"限时优惠"提示文字

**2.4 页面访问追踪**
- 页面加载时向 `conversion_events` 插入 `page_view` 事件
- 记录 `landing_page_id` 在 metadata 中
- CTA 点击时插入 `click` 事件

### 三、推广活动真实数据（PartnerLandingPageList.tsx）

**3.1 实际点击/购买数据**
- 获取页面列表后，查询 `conversion_events` 表
- 通过 `metadata->landing_page_id` 匹配每个推广活动的事件
- 点击数 = `page_view` + `click` 事件数
- 购买数 = `payment` 事件数
- 替换当前硬编码的 `0`

### 技术细节

**Dashboard 数据获取增强**：
```text
fetchStats 逻辑：
1. 查询 partner_landing_pages count (status='published')
2. 本期事件：最近 7 天
3. 上期事件：7-14 天前
4. 计算增长率：
   growth = prev === 0 
     ? (curr > 0 ? 100 : 0) 
     : ((curr - prev) / prev * 100)
```

**新增 totalStats 字段**：
```text
{
  campaigns: number,        // 活跃活动数
  spend: number,
  reach: number,
  conversions: number,
  revenue: number,
  reachGrowth: number,      // 触达增长率 %
  conversionGrowth: number, // 转化增长率 %  
  revenueGrowth: number,    // 收入增长率 %
}
```

**落地页追踪实现**：
- 使用 `conversion_events` 表，`feature_key = 'landing_page'`
- `metadata` 中存储 `{ landing_page_id: id, partner_id: partnerId }`
- 使用 `visitor_id`（基于 localStorage 生成的匿名 ID）追踪未登录访客

**推广活动列表数据查询**：
- 获取页面 ID 列表后，批量查询 `conversion_events`
- 按 `metadata->>landing_page_id` 过滤和分组
- 使用 `event_type` 区分点击和购买

**增长趋势卡片样式**：
- 正增长：绿色文字 + TrendingUp 图标
- 负增长：红色文字 + TrendingDown 图标
- 零增长：灰色文字 + Minus 图标

**修改文件清单**：
- `src/components/partner/FlywheelGrowthSystem.tsx` - Dashboard 升级 + 按钮文案
- `src/pages/LandingPage.tsx` - 视觉升级 + 追踪埋点
- `src/components/partner/PartnerLandingPageList.tsx` - 真实数据接入
