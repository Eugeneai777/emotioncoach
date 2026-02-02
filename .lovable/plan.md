

# 绽放合伙人注册码批量生成方案

## 需求理解

您需要为55位合伙人生成注册码，让他们可以自行用注册码登录注册成为绽放合伙人。

## 现有系统能力

系统已有完整的邀请码流程：

| 组件 | 功能 |
|------|------|
| `/admin/bloom-invitations` | 管理员后台邀请管理 |
| `BloomPartnerBatchImport` | 批量导入组件 |
| `/invite/:code` | 用户领取邀请页面 |
| `claim-partner-invitation` | 后端领取处理 |

**数据库已支持**: `invitee_phone` 字段已设为可空（nullable），无需修改数据库

## 当前问题

批量导入组件要求 **"姓名,手机号"** 两列数据，无法支持只有姓名的导入。

## 解决方案

### 修改批量导入组件

修改 `BloomPartnerBatchImport.tsx`，支持只有姓名的导入：

**改进前**：
```
格式要求：姓名,手机号,备注
示例：张三,13800138001,备注
```

**改进后**：
```
格式要求：姓名（必填）,手机号（可选）,备注（可选）
示例：
张三
李四,13800138002
王五,,线下招募
```

### 文件修改清单

| 文件 | 修改内容 |
|------|----------|
| `src/components/admin/BloomPartnerBatchImport.tsx` | 修改CSV解析逻辑，支持单列姓名导入 |

## 技术实现

### CSV 解析逻辑调整

```typescript
// 当前逻辑（需要2列）
if (parts.length >= 2) {
  results.push({ name: parts[0], phone: parts[1] });
}

// 改进逻辑（1列即可）
if (parts.length >= 1 && parts[0].trim()) {
  results.push({
    name: parts[0].trim(),
    phone: parts[1]?.trim() || '',  // 手机号可选
    notes: parts[2]?.trim() || undefined,
  });
}
```

### UI 提示更新

更新格式说明，告知用户手机号为可选：

```
每行一条记录，格式：姓名（必填）,手机号（可选）,备注（可选）
支持只粘贴姓名列表，每行一个姓名
```

## 使用流程

### 管理员操作

1. 进入 `/admin/bloom-invitations`
2. 点击「批量导入」按钮
3. 直接粘贴姓名列表：
   ```
   张艳
   Angela安安
   Cherie Chen鸿冰
   郑海慧
   陈霞
   ...
   ```
4. 点击「开始导入」
5. 系统为每人生成唯一邀请码（如 `BLOOMABC123`）
6. 点击「导出结果」下载 CSV（包含姓名、邀请码、邀请链接）
7. 将邀请链接分发给对应合伙人

### 合伙人操作

1. 收到邀请链接 `https://xxx/invite/BLOOMABC123`
2. 点击进入邀请页面
3. 看到欢迎信息："亲爱的 [姓名]"
4. 点击「微信登录并领取」
5. 完成微信授权登录
6. 自动成为绽放合伙人，跳转至合伙人中心

## 您的55人名单导入示例

完成修改后，您可以直接粘贴：

```text
张艳
Angela安安
Cherie Chen鸿冰
郑海慧
陈霞
聪颖
小为
建昭
张辉（light）
Sally Ding喜雅
张华
燕子
Larissa
Sophie
苹果姐姐
🔥恩宠的杨🔥
刘晶
撒拉（腊梅）
芳芳
司纳
艳琴
美丽（王南）
Lisa
殷辉
丁莉
陶子
香草
琴
钒晨
Lydia
Esther清清
笑笑
景琳
吕敏杰
牛莹
Fran
冯
娜娜
XFF
李莹妹
Hannah焦
Mi`xq宓老师
乙安
Tammy赵老师
冯群
陈颖
DavidZheng
Ruth-田
恩典彩虹（翼飞）
四叶草
林青
rx 景姝
萌萌
Rachel Xue
```

系统将为每人生成唯一邀请码和链接，可导出为 CSV 文件分发。

