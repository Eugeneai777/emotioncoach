

## 将大劲AI融合到亲子教练系统（复制小劲AI双轨模式）

### 现状分析

**小劲AI 已有的融合点（参考模板）：**
1. `TeenModeEntryCard` — 在亲子教练页嵌入"双轨模式"入口卡片
2. `XiaojinMoodReport` — 在家长端展示孩子的情绪周报
3. `TeenInviteShareDialog` — 生成邀请链接 `/xiaojin?from=parent_{userId}`
4. `ParentTeenIntro` — 双轨模式介绍页
5. `xiaojin_mood_logs` 表 — 孩子端数据回传
6. `useChildMoodReport` — 家长端读取孩子数据
7. `ParentChildDiary` — 亲子日记页也展示 XiaojinMoodReport

**大劲AI 当前状态：**
- 独立页面 `/elder-care`，含聊天、问候、提醒、心情4个子页面
- `elder-chat` 边缘函数
- 无绑定系统、无数据回传、无家长端入口

---

### 需要新建/修改的内容

#### 1. 数据层 — 绑定 + 数据回传

| 操作 | 说明 |
|------|------|
| 新建 `elder_bindings` 表 | 子女(user_id) ↔ 长辈 绑定关系，字段参考 teen 绑定表 |
| 新建 `elder_mood_logs` 表 | 长辈端心情/打卡数据回传，供子女端查看 |
| RLS 策略 | 子女只能查看自己绑定的长辈数据 |

#### 2. 大劲AI 端改造

| 文件 | 改动 |
|------|------|
| `ElderCarePage.tsx` | 支持 `?from=child_{userId}` 参数，解析并存储子女归因 |
| `ElderMoodPage.tsx` | 心情记录同步写入 `elder_mood_logs` |
| 新建 `utils/elderMoodUpload.ts` | 仿 `xiaojinMoodUpload.ts`，处理归因和数据上传 |

#### 3. 子女端（亲子教练页）入口

| 文件 | 改动 |
|------|------|
| 新建 `ElderModeEntryCard.tsx` | 仿 `TeenModeEntryCard`，显示"让爸妈也有AI陪伴"入口 |
| 新建 `ElderMoodReport.tsx` | 仿 `XiaojinMoodReport`，展示长辈情绪周报 |
| 新建 `ElderInviteShareDialog.tsx` | 生成邀请链接 `/elder-care?from=child_{userId}` |
| 新建 `useElderMoodReport.ts` | 仿 `useChildMoodReport`，读取 `elder_mood_logs` |
| 新建 `useElderBindings.ts` | 管理子女-长辈绑定状态 |
| `ParentCoach.tsx` | 在 TeenModeEntryCard 下方加入 ElderModeEntryCard |

#### 4. 介绍页

| 文件 | 改动 |
|------|------|
| 新建 `ElderCareIntro.tsx` | 仿 `ParentTeenIntro`，介绍"银发双轨模式" |
| `App.tsx` | 添加 `/elder-care-intro` 路由 |

#### 5. 亲子日记整合

| 文件 | 改动 |
|------|------|
| `ParentChildDiary.tsx` | 添加 Tab 或区域展示 `ElderMoodReport` |

---

### 工作量预估

约 10 个新文件 + 5 个修改文件 + 2 个数据库迁移，建议分 2-3 轮实施：
1. **第一轮**：数据库表 + 绑定逻辑 + 数据回传工具
2. **第二轮**：子女端入口卡片 + 情绪周报 + 邀请分享
3. **第三轮**：介绍页 + 亲子日记整合

