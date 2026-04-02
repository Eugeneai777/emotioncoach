

# 在"联系人工"流程中添加可折叠企微二维码

## 方案

用户点击"联系人工" → AI 追问问题 → 用户描述 → AI 提交工单并回复确认 → 回复末尾附带 `[QIWEI_QR]` 标记 → 前端识别标记，渲染可折叠企微二维码链接。

## 实施步骤

### 1. 保存企微二维码图片
将上传图片复制到 `src/assets/qiwei-service-qr.jpg`

### 2. 新建 `src/components/customer-support/QiWeiQRCard.tsx`
- 默认收起状态，显示一行小字："紧急问题？点此联系企微客服 →"
- 点击展开显示企微二维码图片 + "扫码添加企微客服，获取即时帮助"
- 再次点击收起

### 3. 修改 `src/pages/CustomerSupport.tsx`
- Message 类型增加 `showQiWeiQR?: boolean`
- 渲染消息时，检测 `content` 中是否包含 `[QIWEI_QR]`，若包含则：
  - 从显示文本中移除 `[QIWEI_QR]` 标记
  - 在该消息气泡下方渲染 `QiWeiQRCard`

### 4. 修改边缘函数 `supabase/functions/customer-support/index.ts`
- `submit_ticket` 成功后的 system prompt 指令追加：提交工单后，回复确认文字，并在末尾追加 `[QIWEI_QR]`
- 具体：在 system prompt 第5条规则改为：
  > 投诉/问题 → 使用 submit_ticket 工具，工单创建成功后在回复末尾追加标记 [QIWEI_QR]

## 文件变更

| 文件 | 操作 |
|---|---|
| `src/assets/qiwei-service-qr.jpg` | 新增 |
| `src/components/customer-support/QiWeiQRCard.tsx` | 新建 |
| `src/pages/CustomerSupport.tsx` | 修改 |
| `supabase/functions/customer-support/index.ts` | 修改 |

