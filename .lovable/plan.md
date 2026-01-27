
# 预约状态推送通知完善计划

## 当前系统状态

| 通知场景 | 触发点 | 状态 |
|:---------|:-------|:-----|
| 预约确认 | 支付成功回调 | 已实现 |
| 开始前提醒 | Cron 每小时检查 | 已实现（但时间精度不够） |
| 评价邀请 | 完成后1-2小时 | 已实现 |
| 预约取消 | 取消 API | 已实现 |
| 预约改期 | - | 仅定义，未实现 |
| 咨询完成 | - | 未实现 |
| 教练端通知 | - | 未实现 |

---

## 改进计划

### 1. 提升提醒时间精度

**问题**: Cron 每小时执行，可能错过精确的 15 分钟提醒窗口

**方案**: 增加提醒触发频率 + 添加前一天提醒

```text
修改: supabase/functions/trigger-appointment-reminders/index.ts
- 添加前一天晚上 8 点提醒场景
- 添加防重复发送逻辑（记录已发送的提醒）

修改: 数据库 Cron Job
- 将 trigger-appointment-reminders 从每小时改为每 15 分钟执行
- Schedule: */15 * * * *
```

---

### 2. 添加"咨询完成"通知

**场景**: 教练标记会话完成后，立即通知用户

**修改文件**:

| 文件 | 改动 |
|:-----|:-----|
| `supabase/functions/send-appointment-notification/index.ts` | 添加 `appointment_completed` 场景处理 |
| `src/hooks/useAppointmentNotification.ts` | 添加 `sendCompletionNotification` 方法 |
| `src/components/human-coach/AppointmentCard.tsx` | 教练完成预约时调用通知 |

**通知内容示例**:
```text
标题: {用户名}，咨询已结束
内容: 与{教练名}的{服务名}咨询已完成
备注: 感谢您的信任，期待下次相见 ✨
```

---

### 3. 添加教练端通知

**场景**: 教练需要收到新预约、取消、即将开始的通知

**修改文件**:

| 文件 | 改动 |
|:-----|:-----|
| `supabase/functions/send-appointment-notification/index.ts` | 支持向教练发送通知 |
| `supabase/functions/wechat-pay-callback/index.ts` | 支付成功后通知教练有新预约 |
| `supabase/functions/cancel-appointment/index.ts` | 取消时通知教练 |
| `supabase/functions/trigger-appointment-reminders/index.ts` | 提醒时同时通知教练 |

**新增场景**:
- `coach_new_appointment` - 教练收到新预约
- `coach_appointment_reminder` - 教练即将开始提醒
- `coach_appointment_cancelled` - 用户取消通知

---

### 4. 实现改期功能和通知

**新建/修改文件**:

| 文件 | 改动 |
|:-----|:-----|
| `supabase/functions/reschedule-appointment/index.ts` | 新建：改期逻辑 |
| 前端改期 UI | 在预约详情添加改期按钮 |

---

### 5. 添加已发送提醒记录表（防重复）

**数据库变更**:

```sql
CREATE TABLE IF NOT EXISTS appointment_notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES coaching_appointments(id),
  scenario TEXT NOT NULL,
  recipient_type TEXT NOT NULL, -- 'user' | 'coach'
  recipient_id UUID NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id, scenario, recipient_id)
);
```

---

## 技术实现细节

### send-appointment-notification 改动

```typescript
// 新增场景类型
type NotificationScenario = 
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'review_invitation'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_completed'       // 新增
  | 'coach_new_appointment'       // 新增
  | 'coach_appointment_reminder'  // 新增
  | 'coach_appointment_cancelled'; // 新增

// 新增参数
interface AppointmentNotificationRequest {
  userId?: string;
  coachId?: string;  // 新增：支持向教练发送
  scenario: NotificationScenario;
  appointmentId: string;
  minutesBefore?: number;
}
```

### useAppointmentNotification 改动

```typescript
export const useAppointmentNotification = () => {
  // ... 现有方法 ...

  // 新增：发送完成通知
  const sendCompletionNotification = async (userId: string, appointmentId: string) => {
    return sendNotification({
      userId,
      scenario: 'appointment_completed',
      appointmentId,
    });
  };

  // 新增：通知教练有新预约
  const sendCoachNewAppointmentNotification = async (coachId: string, appointmentId: string) => {
    return sendNotification({
      coachId,
      scenario: 'coach_new_appointment',
      appointmentId,
    });
  };

  return {
    // ...
    sendCompletionNotification,
    sendCoachNewAppointmentNotification,
  };
};
```

---

## 修改文件清单

| 文件 | 类型 | 改动说明 |
|:-----|:-----|:---------|
| `supabase/functions/send-appointment-notification/index.ts` | 修改 | 添加新场景、支持教练端通知 |
| `supabase/functions/trigger-appointment-reminders/index.ts` | 修改 | 添加前一天提醒、教练提醒、防重复逻辑 |
| `supabase/functions/wechat-pay-callback/index.ts` | 修改 | 新预约通知教练 |
| `supabase/functions/cancel-appointment/index.ts` | 修改 | 取消时通知教练 |
| `src/hooks/useAppointmentNotification.ts` | 修改 | 添加新方法 |
| `src/components/human-coach/AppointmentCard.tsx` | 修改 | 完成预约时发送通知 |
| 数据库迁移 | 新建 | 创建通知日志表 |
| Cron Job | 修改 | 调整执行频率为每15分钟 |

---

## 预期效果

完成后，用户和教练将在以下节点收到微信模板消息推送：

### 用户端
1. 预约确认（支付成功后立即）
2. 前一天晚上提醒
3. 开始前 1 小时/15 分钟提醒
4. 咨询完成通知
5. 完成后评价邀请
6. 预约取消/改期通知

### 教练端
1. 收到新预约通知
2. 开始前提醒
3. 用户取消通知
