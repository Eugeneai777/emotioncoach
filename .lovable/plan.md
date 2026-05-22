## 教练详情页优化（A-3 / B / C-2）

### 1. A-3：移除"通话"按钮，改为"加企微"弹窗

**底部操作栏（HumanCoachDetail.tsx L317-337）**
- 删除"通话"按钮，删除 `useCoachCall`、`Phone` 图标、`isInCall`、`startCall` 相关引用（若仅此处使用）
- 新增"加企微"按钮（outline 风格，teal 主题色），点击打开 `CoachWeChatDialog`

**新增组件 `src/components/human-coach/CoachWeChatDialog.tsx`**
- 基于 `Sheet`（底部弹出），参考 `MaleVitalityWeChatSheet` 风格
- 内容：
  - 标题"添加教练企业微信，沟通预约更顺畅"
  - 二维码图片（教练专属）+ 占位提示
  - 底部说明文案："长按识别二维码 / 在企业微信中扫码添加"
  - 小程序环境兼容提示（参考 `QiWeiQRCard` 的 `isWeChatMiniProgram` 分支）
- 二维码来源（按优先级 fallback）：
  1. `coach.wechat_qr_url`（数据库字段，若已存在则使用；不存在则忽略，本次不做迁移）
  2. 通用占位图 `src/assets/qiwei-placeholder.jpg`（新建占位资源，用户后续上传替换）

**占位资源**
- 在 `src/assets/` 创建 `coach-wechat-placeholder.jpg`（先复制现有 `qiwei-service-qr.jpg` 作为占位，或留 README 说明"待替换"）
- 文件头部注释标明：此为占位图，用户上传正式教练企微二维码后替换

### 2. B：修复服务卡片"立即预约"死按钮

**HumanCoachDetail.tsx L271-276**
- 给服务卡片的"立即预约"按钮添加 `onClick`：
  ```
  setSelectedService(service);
  setBookingOpen(true);
  ```
- 加上 `e.stopPropagation()`（防止冒泡到 Card）

### 3. C-2：用"新晋教练"徽章替代"0次咨询"

**统计区（L163-166）**
- 当 `coach.total_sessions === 0` 时，整列展示替换为徽章风格：
  - 大字部分：🌱 emoji
  - 副标题：「新晋教练」
  - 使用 teal 配色，保持与其他两列视觉等高
- 当 `total_sessions > 0` 时，保留原"X 次咨询"显示

**HumanCoachCard.tsx L97-100（列表卡片）**
- 同步处理：`total_sessions === 0` 时，将"0次"替换为"新晋"小徽章（保持 inline 风格，无需图标）

### 4. 技术细节

- `useCoachCall` 仅 HumanCoachDetail 引用 → 直接移除 import；否则只移除调用
- 新建组件保持与现有 sheet/dialog 风格统一（rounded-t-2xl、px-5 间距）
- 占位图通过 ES6 import 引入，便于后续替换：
  ```ts
  import qrPlaceholder from "@/assets/coach-wechat-placeholder.jpg";
  ```
- 不涉及后端 / DB schema 变更（即使 `wechat_qr_url` 字段不存在也能 fallback 到占位图）

### 5. 验证

- 点击底部"加企微" → 弹窗显示占位二维码
- 服务卡片"立即预约" → 打开 BookingDialog 且预选该服务
- `total_sessions=0` 教练 → 显示"🌱 新晋教练"而非"0 次咨询"
- `total_sessions>0` 教练 → 显示原咨询次数
