

# 全天候抗压套餐 — 售前/售后/个人中心优化方案

## 概览

针对 `/promo/synergy` 套餐页面的 4 个优化点，涉及售前体验、售后跳转、物流状态和个人中心信息展示。

---

## 1. 售前提示：知乐胶囊配送时间说明（问题 1.1）

在两个位置添加配送时间提示，让用户在购买前知晓胶囊需要 4-7 天从香港发货：

**文件：`src/pages/SynergyPromoPage.tsx`**
- 在「知乐胶囊」产品卡片区域添加配送提示："📦 香港直邮，预计 4-7 个工作日到达"
- 在 `SuccessPanel` 中将"预计3个工作日内寄出"改为"香港直邮，预计 4-7 个工作日送达"
- 添加建议文案："建议收到胶囊后再开始训练营，获得最佳协同效果"

---

## 2. 地址填写优化：省市区三级联动 + 地址簿（问题 1.2）

### 2.1 数据库：新建 `user_shipping_addresses` 表

```sql
CREATE TABLE public.user_shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  province TEXT NOT NULL,
  city TEXT NOT NULL, 
  district TEXT NOT NULL,
  detail TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.user_shipping_addresses ENABLE ROW LEVEL SECURITY;
-- 用户只能管理自己的地址
CREATE POLICY "Users manage own addresses" ON public.user_shipping_addresses
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### 2.2 省市区三级联动组件

**新建文件：`src/components/store/RegionPicker.tsx`**
- 使用中国行政区划 JSON 数据（内嵌精简版，省/市/区三级）
- 三个 Select 下拉框依次选择省→市→区
- 选择后拼接为完整地区字符串

### 2.3 地址簿管理组件

**新建文件：`src/components/store/AddressManager.tsx`**
- 展示用户已保存的收货地址列表
- 支持新增、编辑、删除、设为默认
- 包含省市区选择器 + 详细地址 + 姓名 + 手机号

### 2.4 改造 CheckoutForm

**修改文件：`src/components/store/CheckoutForm.tsx`**
- 顶部显示已保存地址列表（可选择）
- "新增地址"展开表单：姓名 + 手机号 + 省市区三级选择 + 详细地址
- 保留现有的粘贴智能识别功能
- 新增"保存此地址"勾选项
- 已登录用户显示地址列表；未登录用户仅显示表单

---

## 3. 售后跳转优化（问题 2.1）

### 3.1 购买成功后跳转至情绪日记训练营

**修改文件：`src/pages/SynergyPromoPage.tsx`**
- `handleEnterCamp` 改为导航至 `/camp-intro/emotion_journal_21`（21天情绪日记训练营，已存在）
- `SuccessPanel` 按钮文案改为"进入21天情绪日记训练营"
- 添加训练营描述文字

### 3.2 购买成功页添加物流提示

在 `SuccessPanel` 中增加一条物流状态卡片：
- "📦 知乐胶囊正在从香港发出，预计 4-7 天送达"
- "📱 可在「设置 → 账户」中查看物流状态"

---

## 4. 订单收货信息存储

### 4.1 数据库：orders 表添加收货字段

```sql
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS buyer_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS shipping_note TEXT;
```

### 4.2 修改支付成功逻辑

**修改文件：`src/pages/SynergyPromoPage.tsx`**
- `handlePaySuccess` 中将 `checkoutInfo` 写入 orders 表（通过 order_no 更新），替代目前的 localStorage 存储

---

## 5. 个人中心（设置页）信息展示（问题 3）

**修改文件：`src/pages/Settings.tsx`**

在"账户"Tab 中扩展内容：

### 5.1 已购用户新增展示
- **订单详情卡片**：展示订单号、支付金额、支付时间、支付方式（已有 `PurchaseHistory` 组件）
- **已购课程/训练营**：新增 `MyCourses` 组件，查询 `user_camp_enrollments` 表展示已参加的训练营及进度
- **物流信息卡片**：新增 `ShippingStatus` 组件，查询 orders 表中含有 `buyer_address` 的订单，展示物流状态（pending=待发货/shipped=已发货/delivered=已签收）

### 5.2 未购用户
- 保持现有账户信息展示（`AccountBalance` 已处理无套餐情况）
- 不显示课程和物流模块（无数据时自动隐藏）

**新建文件：**
- `src/components/settings/MyCourses.tsx` — 展示已参加训练营列表
- `src/components/settings/ShippingTracker.tsx` — 展示物流状态卡片

---

## 文件变更汇总

| 类型 | 文件 | 说明 |
|------|------|------|
| DB | 迁移 | 新建 `user_shipping_addresses` 表；orders 表加收货/物流字段 |
| 新建 | `src/components/store/RegionPicker.tsx` | 省市区三级联动 |
| 新建 | `src/components/store/AddressManager.tsx` | 地址簿管理 |
| 新建 | `src/components/settings/MyCourses.tsx` | 我的训练营列表 |
| 新建 | `src/components/settings/ShippingTracker.tsx` | 物流状态卡片 |
| 修改 | `src/components/store/CheckoutForm.tsx` | 集成地址簿+三级联动 |
| 修改 | `src/pages/SynergyPromoPage.tsx` | 配送提示+跳转至情绪日记+订单存储 |
| 修改 | `src/pages/Settings.tsx` | 账户Tab添加课程和物流模块 |

