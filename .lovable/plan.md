

# 重新配置豆包 AppId 等信息

## 概述
更新豆包实时语音的三个关键配置：`DOUBAO_APP_ID`、`DOUBAO_ACCESS_TOKEN`（通过密钥管理工具更新），以及将硬编码的 `X-Api-App-Key` 改为从环境变量读取。

## 步骤

### 1. 更新 DOUBAO_APP_ID 密钥
使用密钥管理工具更新 `DOUBAO_APP_ID` 的值，提示你输入新的 App ID。

### 2. 更新 DOUBAO_ACCESS_TOKEN 密钥
使用密钥管理工具更新 `DOUBAO_ACCESS_TOKEN` 的值，提示你输入新的 Access Token。

### 3. 新增 DOUBAO_APP_KEY 密钥
将当前硬编码在 `doubao-realtime-relay` 中的 `X-Api-App-Key: 'PlgvMymc7f3tQnJ6'` 改为从环境变量 `DOUBAO_APP_KEY` 读取，并通过密钥管理工具让你设置该值。

### 4. 修改 Edge Function 代码
在 `supabase/functions/doubao-realtime-relay/index.ts` 中：
- 新增读取 `DOUBAO_APP_KEY` 环境变量
- 将 `'X-Api-App-Key': 'PlgvMymc7f3tQnJ6'` 替换为 `'X-Api-App-Key': DOUBAO_APP_KEY`
- 在配置校验中加入 `DOUBAO_APP_KEY` 的检查

### 5. 重新部署 Edge Function
部署更新后的 `doubao-realtime-relay` 函数使配置生效。

## 不影响的内容
- OpenAI Realtime 通道及其他教练模式不受影响
- 前端代码无需修改
- 音色、模型版本等参数保持不变

