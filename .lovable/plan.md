

## 推广活动列表优化：点击进入详情页

### 改动概览

将推广活动列表简化为可点击的列表项，移除"复制链接"和"预览"按钮。点击活动卡片后进入详情/编辑页面，在详情页提供复制链接、预览和删除等操作。

### 具体改动

**1. PartnerLandingPageList.tsx - 简化列表项**
- 移除每条记录下方的"复制链接"、"预览"、"删除"按钮
- 整行改为可点击，点击后导航到详情页 `/partner/landing-page/:id`
- 列表项只显示：标题、受众、渠道、日期、状态标签、右侧箭头图标
- 标题从"已保存落地页"改为"推广活动"

**2. 新建 PartnerLandingPageDetail.tsx 详情/编辑页面**
- 路径：`/partner/landing-page/:id`
- 页面内容：
  - 顶部返回按钮
  - 落地页标题、受众、渠道、创建日期、状态
  - 落地页内容预览（标题、副标题、卖点列表、CTA 文案）
  - 操作区域：复制链接、预览（导航到 /lp/:id）、删除
- 从 `partner_landing_pages` 表按 id 获取数据

**3. 路由注册**
- 在 App.tsx 中添加 `/partner/landing-page/:id` 路由

### 技术细节

- 列表项使用 `cursor-pointer hover:bg-accent/50` 样式提示可点击
- 详情页使用 `useParams` 获取 id，`useNavigate` 实现返回和预览导航
- 复制链接仍使用 `getPromotionDomain()` 生成生产域名 URL
- 删除后自动返回上一页
