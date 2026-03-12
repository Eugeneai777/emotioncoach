

## 邀请链接预设资质证书

### 需求
管理员创建邀请链接时可预选资质证书（如"ICF 教练认证"），教练注册时这些证书自动带入且不可删除，其他证书可选填。

### 改动

#### 1. 数据库：`coach_invitations` 加字段
```sql
ALTER TABLE public.coach_invitations 
ADD COLUMN default_certifications JSONB DEFAULT '[]';
```
存储格式：`[{"certType": "coaching_cert", "certName": "ICF 教练认证"}, ...]`

#### 2. `CoachInvitationManager.tsx` — 增加预设证书选择
- 在创建弹窗中增加证书多选区域，复用 `CERT_OPTIONS` 列表
- 选中的证书以标签形式展示，存入 `default_certifications`
- 新增 state：`defaultCerts`

#### 3. `BecomeCoach.tsx` — 邀请验证时读取预设证书
- `validateInvite` 的 select 增加 `default_certifications`
- 初始化 `certifications` state 时，将预设证书预填入
- 将预设证书类型列表传给 `CertificationsStep`

#### 4. `CertificationsStep.tsx` — 预设证书不可删除，其他选填
- 新增 prop：`presetCertTypes: string[]`（预设的证书 certType 列表）
- 预设证书显示锁定标记，不显示删除按钮
- 移除"至少选择1项"的校验（`isValid` 改为始终 `true`，因为预设证书已满足）
- 下一步按钮文案改为"下一步：确认提交"

### 涉及文件
| 文件 | 改动 |
|------|------|
| migration SQL | `coach_invitations` 加 `default_certifications JSONB` |
| `CoachInvitationManager.tsx` | 创建弹窗增加证书多选 |
| `BecomeCoach.tsx` | 读取预设证书并初始化 |
| `CertificationsStep.tsx` | 预设证书锁定，其他选填 |

