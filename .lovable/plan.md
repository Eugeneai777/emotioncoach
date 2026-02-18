

# 为两位用户补建占位邮箱

## 背景
牛莹 (16639119807) 和 美丽 (13316883488) 在 auth.users 中没有 email，导致无法通过占位邮箱方式登录。

## 方案
通过调用已部署的 `backfill-placeholder-emails` 边缘函数，自动为所有缺少 email 的手机号用户补建占位邮箱。该函数会：

1. 扫描 profiles 表中有手机号的用户
2. 检查 auth.users 中是否缺少 email
3. 自动生成并写入占位邮箱（格式：`phone_{区号}{手机号}@youjin.app`）

## 执行步骤
直接调用已部署的 backfill-placeholder-emails 函数即可，无需修改任何代码。

## 技术细节
- 牛莹：`phone_8616639119807@youjin.app`
- 美丽：`phone_8613316883488@youjin.app`
- 函数已部署，只需触发执行

