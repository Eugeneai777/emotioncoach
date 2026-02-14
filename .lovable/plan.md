
## CSV 导出与表格优化

### 改动内容

**文件：`src/components/admin/BloomPartnerInvitations.tsx`**

1. **CSV 导出改动**（第 391-403 行）：
   - 链接改为 `https://wechat.eugenewe.net/bloom-partner-intro`（固定，不含邀请码路径）
   - 新增"登录名"列（手机号带区号格式）和"密码"列（固定显示 `123456`）
   - 移除"金额"、"创建时间"、"领取时间"列
   - 新增"账号类型"列，显示"旧批次"/"新注册"/"已有账号"等

   CSV 表头变为：`邀请码,姓名,手机号,登录名,密码,邀请链接,状态,账号类型`

2. **账号类型映射逻辑**：
   - `batch` -> 旧批次
   - `batch_new` -> 新注册
   - `batch_existing` -> 已有账号
   - `admin` -> 管理员
   - `self` -> 自行领取
   - 其他 -> 空

3. 邀请链接统一使用 `getPromotionDomain()` + `/bloom-partner-intro` 路径
