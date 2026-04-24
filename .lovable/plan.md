## 教练「联系电话」为空问题 - 根因与修复方案

### 一、根因定位

数据库验证：`human_coaches` 表存在 `phone text` 字段，但**最近 5 位教练（包括「林蒿老师」）的 phone 全部为 NULL**。

代码层 Bug 在 `src/pages/BecomeCoach.tsx` 第 194-204 行的 `coachPayload`：

```ts
const coachPayload = {
  name: basicInfo.displayName,
  bio: basicInfo.bio,
  avatar_url: basicInfo.avatarUrl,
  specialties: basicInfo.specialties,
  experience_years: basicInfo.yearsExperience,
  status: "pending",
  is_accepting_new: false,
  is_verified: false,
  // ❌ 缺少 phone: basicInfo.phone
};
```

申请表单 `BasicInfoStep.tsx` 收集了手机号（必填、11 位），第 238 行甚至用它做防重查询，**但 INSERT/UPDATE payload 里漏写了 `phone`**，所以从未落库。

后台 `CoachEditDialog.tsx` 读 `coach.phone`，因数据库为空，UI 自然显示空。

---

### 二、修复方案

#### 1. 代码修复（核心）

`src/pages/BecomeCoach.tsx` 第 194-204 行 `coachPayload` 增加 `phone`：

```ts
const coachPayload = {
  name: basicInfo.displayName,
  phone: basicInfo.phone,        // ✅ 新增
  bio: basicInfo.bio,
  avatar_url: basicInfo.avatarUrl,
  specialties: basicInfo.specialties,
  experience_years: basicInfo.yearsExperience,
  status: "pending",
  is_accepting_new: false,
  is_verified: false,
};
```

仅 1 行新增，INSERT 和 UPDATE 路径同时生效，今后所有新申请、再次提交审核都会带上手机号。

#### 2. 存量数据回填（一次性）

对历史已注册教练，从其登录账户的 `profiles.phone` 自动回填：

```sql
UPDATE public.human_coaches hc
SET phone = p.phone
FROM public.profiles p
WHERE hc.user_id = p.id
  AND (hc.phone IS NULL OR hc.phone = '')
  AND p.phone IS NOT NULL
  AND p.phone <> '';
```

覆盖范围：用户用手机号注册/绑定过的教练账号。少数纯微信注册无手机号的教练仍需手动维护，但后台编辑已有「联系电话」输入框，可直接补录。

#### 3. 不影响范围

- ✅ `CoachEditDialog.tsx` 已正确读写 `phone`，无需改动
- ✅ 后台 phone 字段编辑、保存逻辑已就绪
- ✅ 不动 RLS、不动表结构、不动其他端

---

### 三、改动清单

| 类型 | 文件 / 操作 |
|---|---|
| 前端 | `src/pages/BecomeCoach.tsx` 第 194 行 payload 加 `phone` |
| 数据回填 | 一次性 UPDATE，按 user_id 关联 profiles.phone |

### 四、验收

| 场景 | 期望 |
|---|---|
| 新教练提交申请 | `human_coaches.phone` 自动写入 11 位手机号 |
| 已审核教练再次编辑提交 | phone 同步更新 |
| 后台 `/admin/human-coaches` 编辑「林蒿老师」等存量教练 | 联系电话框显示其手机号（若 profiles 有） |
| 后台手动补录 | 保存即时生效 |
