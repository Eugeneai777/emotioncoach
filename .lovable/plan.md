
将免费版财富测评结束页的训练营推广价格从 ¥299 改为 ¥0.01 用于测试。

## 定位
路由 `/wealth-assessment-free` → 推测组件在 `src/pages/` 或相关测评结束页/CTA 组件。需要先 grep `¥299` / `299` / `wealth_block` 训练营 CTA 来确认确切位置，并确认价格是写死还是来自 packageKey 配置。

## 计划
1. 搜索 `wealth-assessment-free` 路由对应组件
2. 搜索 ¥299 / ¥399 / 立即加入训练营 等关键字定位价格渲染处
3. 同时定位创建订单时传给 `create-wechat-order` 的 amount 字段
4. 改动两处：
   - UI 显示：`¥299` → `¥0.01`，划线价 `¥399` 与 `省¥100` 暂保留或同步隐藏（建议保留划线价，省略"省¥100"避免数字矛盾）
   - 下单 amount：传给后端的金额改为 `0.01`（分制则为 `1`，需看现有代码单位）
5. 仅影响这一个入口的 CTA，避免污染其他页面同类训练营购买（如 /camps、wealth-camp 详情页）

## 注意
- 仅作测试用途，需提醒用户测完后改回。
- 若 amount 由 packageKey 在后端配置（create-wechat-order 内固定金额），仅改前端显示无效，需要后端改 packageKey 价格映射或前端传 `forcedAmount`。先读代码确认。

确认后切回执行模式实施。
