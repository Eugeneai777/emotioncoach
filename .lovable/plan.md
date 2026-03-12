

## 简化教练注册流程 — 统一身份「绽放身份教练」

### 需求理解
管理员生成邀请链接时预设统一教练名称（如"绽放身份教练"），教练注册时去掉「服务项目」步骤，系统自动创建一个60分钟的默认服务。

### 改动

#### 1. 数据库：`coach_invitations` 加字段
```sql
ALTER TABLE coach_invitations ADD COLUMN default_service_name TEXT;
```

#### 2. `CoachInvitationManager.tsx` — 增加默认服务名称输入
- 创建邀请弹窗中新增「统一服务名称」输入框，默认值为"绽放身份教练"
- 创建时写入 `default_service_name`

#### 3. `BecomeCoach.tsx` — 去掉 services 步骤
- `STEPS` 从 4 步改为 3 步：基本信息 → 资质证书 → 确认提交
- 邀请验证时额外 select `default_service_name`
- 提交时自动创建 `coach_services` 记录：
  - `service_name` = `invitationData.default_service_name` 或 `basicInfo.displayName + " 咨询"`
  - `duration_minutes` = 60
  - `price` = 0
- 移除 `services` state 和 `ServicesStep` 引用

#### 4. `SubmitStep.tsx` — 简化确认页
- 移除 `services` prop，不再展示服务项目卡片
- 新增一行提示："系统将自动为您创建默认服务（60分钟），价格由平台审核后设定"

### 涉及文件
| 文件 | 改动 |
|------|------|
| migration SQL | `coach_invitations` 加 `default_service_name` 列 |
| `CoachInvitationManager.tsx` | 增加「统一服务名称」输入，默认值"绽放身份教练" |
| `BecomeCoach.tsx` | 去掉 services 步骤，提交时自动创建默认服务 |
| `SubmitStep.tsx` | 移除 services 展示，显示默认服务提示 |

