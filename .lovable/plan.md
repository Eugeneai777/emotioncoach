# 管理员代上传教练证书

## 目标
- 在「真人教练管理 → 资质审阅」中，管理员可以替教练新增、替换、编辑、删除证书
- 在 `AdminCreateCoachDialog`（手动录入教练）的成功流之后，允许立即补充证书
- 已通过教练在 `CoachEditDialog` 中也提供「资质管理」入口

数据表 `coach_certifications` 已对 `admin` 角色开放完整 RLS（`管理员可以管理所有资质`），无需迁移。

## 改动

### 1. 新增组件 `AdminCertificationUploader.tsx`
位置：`src/components/admin/human-coaches/AdminCertificationUploader.tsx`

复用 `CertificationsStep` 的字段语义 + `CoachPhotoUploader` 的压缩上传模式：
- 字段：证书名称（必填）、类型下拉（沿用 psychology/coaching/counseling/training/education/other）、颁发机构、证书编号、颁发日期、图片（上传到 `community-images/certifications/{coachId}/{timestamp}.jpg`，自动压缩到 ≤1600px JPG 0.85）
- 提交：`insert coach_certifications` 时写入 `verification_status='verified'`、`verified_by=auth.uid()`、`verified_at=now()`、`admin_note='管理员代上传'`
- 提供两种用法：
  - 行内「+ 替学员新增证书」按钮 → 内嵌折叠表单
  - 「替换图片」按钮 → 仅上传图片并 `update` 当前行 `image_url`

### 2. 修改 `CoachApplicationDetail.tsx`（待审核流程）
在「资质审阅」Tab：
- 顶部加 `AdminCertificationUploader`（新增模式），提交后 `invalidateQueries(['coach-applications'])` + 重新拉取证书
- 每条证书卡片右侧追加「替换图片」「编辑信息」「删除」三个按钮（小图标）
  - 替换图片：调用 uploader 的 patch 模式
  - 编辑：弹窗复用同一表单，预填
  - 删除：`delete from coach_certifications where id=?`，二次确认
- 管理员新增的证书 `verification_status` 默认 `verified`，待审核流程的「已审阅」计数将其自动计入（保持现有 `reviewedCertIds` 联动逻辑兼容：把 `verification_status==='verified'` 也算入已审阅初始集合）

### 3. 修改 `CoachEditDialog.tsx`（已通过教练）
新增「资质管理」Tab（若现状是单页表单则增加分区），内含证书列表 + `AdminCertificationUploader`，操作能力与上方一致。

### 4. 修改 `AdminCreateCoachDialog.tsx`
当前对话框成功创建后直接关闭。改为：
- 创建成功后切换到第 2 步「资质补充（可选）」，复用 `AdminCertificationUploader` 列表 + 新增表单
- 底部按钮：「完成」关闭对话框，「跳过」直接关闭
- 提示行：「头像、详细资质等…」改为「头像可在教练编辑入口补充」

## 验收
1. 后台「待审核」打开 Angela 的资质审阅 → 可新增「家庭教育指导师」证书并上传图片，列表立即出现，状态为「已验证」
2. 同一张证书可点「替换图片」更换图，刷新后展示新图
3. 已通过教练在编辑入口可看到证书列表并执行同样的增删改
4. 手动录入新教练时，创建后即可在第 2 步上传至少 1 张证书，跳过亦可

## 不改动
- 自助 / 代申请流程的 `CertificationsStep`
- `coach-photos` Bucket、`community-images` Bucket 权限
- 现有审批通过 RPC
