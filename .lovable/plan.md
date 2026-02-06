
# 财富卡点测评激活页实施计划

## 需求概述

创建独立激活页面，用户通过激活码完成注册并获得测评使用权限。

## 系统架构

```text
用户访问 /wealth-block-activate
              │
              ▼
       ┌──────────────┐
       │  激活页面    │
       │ 输入激活码   │
       └──────────────┘
              │
    ┌─────────┴─────────┐
    ▼                   ▼
 已登录              未登录
    │                   │
    │              快速注册
    │                   │
    └─────────┬─────────┘
              ▼
       redeem-activation-code
       (验证激活码、创建订单)
              │
              ▼
       跳转 /wealth-block
```

## 实施步骤

### 步骤一：数据库迁移

创建 `wealth_assessment_activation_codes` 表：

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | text | 激活码（唯一） |
| batch_name | text | 批次名称 |
| source_channel | text | 来源渠道 |
| is_used | boolean | 是否已使用 |
| redeemed_by | uuid | 使用者ID |
| redeemed_at | timestamptz | 使用时间 |
| expires_at | timestamptz | 过期时间 |
| created_at | timestamptz | 创建时间 |

配置 RLS 策略确保数据安全。

### 步骤二：后端 Edge Function

创建 `redeem-activation-code` 函数：

1. 验证用户已登录
2. 查询激活码有效性（存在、未使用、未过期）
3. 检查用户是否已有测评权限
4. 创建 orders 记录（package_key=wealth_block_assessment, amount=0）
5. 标记激活码已使用
6. 返回成功结果

### 步骤三：前端激活页面

创建 `src/pages/WealthBlockActivate.tsx`：

- 页面标题和简介
- 激活码输入框
- 未登录时显示快速注册组件
- 激活成功后跳转测评页
- 复用现有 `QuickRegisterStep` 组件

### 步骤四：路由配置

在 `App.tsx` 添加路由：
```
/wealth-block-activate → WealthBlockActivate
```

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| 数据库迁移 | 新建 | 创建激活码表和 RLS |
| `supabase/functions/redeem-activation-code/index.ts` | 新建 | 激活码兑换逻辑 |
| `src/pages/WealthBlockActivate.tsx` | 新建 | 激活页面 |
| `src/App.tsx` | 修改 | 添加路由 |
| `supabase/config.toml` | 修改 | 配置新函数 |

## 技术细节

- 激活码格式：8-12位字母数字，大小写不敏感
- 微信环境复用现有静默授权逻辑
- 支持追踪来源渠道用于数据分析
