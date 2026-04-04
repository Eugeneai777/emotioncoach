

# 线上说明会活动落地页 + 模板消息群发

## 概述

创建一个专属活动落地页 `/event/ai-breakthrough`，展示完整活动信息，然后通过现有微信群发工具发送模板消息，用户点击后跳转到该页面。

## 需要做的事

### 1. 创建活动落地页组件

**新建文件**: `src/pages/EventAIBreakthrough.tsx`

一个精美的移动端优先活动页面，包含：
- 顶部 Banner：活动主题「普通人如何靠"AI+真实关系"破圈？」
- 活动信息卡片：时间、地点、会议号、密码
- 活动亮点/痛点共鸣区（学了AI用不起来、想进垂直领域找不到入口...）
- 一键复制会议号按钮
- 底部 CTA：分享给好友

设计风格：暖色渐变，与有劲AI整体品牌一致。

### 2. 注册路由

**修改文件**: `src/App.tsx`

添加路由 `/event/ai-breakthrough`，懒加载 `EventAIBreakthrough`。

### 3. 更新 OG 配置映射

**修改文件**: `src/config/ogConfig.ts`

在 `pathToKeyMap` 中添加 `/event/ai-breakthrough` 映射，用于微信分享卡片展示。

### 4. 修改模板消息支持自定义跳转 URL

**修改文件**: `supabase/functions/send-wechat-template-message/index.ts`

在请求参数中支持 `custom_url` 字段，当传入时替代默认的 `/?notification=...` 链接：

```typescript
// 第720行附近
const messageBody = {
  touser: openid,
  template_id: templateId,
  url: notification.custom_url || `${wechatBaseUrl}/?notification=${notification.id}`,
  data: messageData,
};
```

### 5. batch-send 透传 custom_url

**修改文件**: `supabase/functions/batch-send-wechat-template/index.ts`

接收 `custom_url` 参数并透传到 notification 对象中。

### 6. 管理后台群发工具支持自定义链接

**修改文件**: `src/components/admin/WechatBroadcast.tsx`

在发送表单中增加"跳转链接"输入框（可选），填写后会作为 `custom_url` 传入。

---

## 发送流程

1. 活动页上线后，管理员进入 `/admin/wechat-broadcast`
2. 选择"全部粉丝"模式
3. 填写标题：`免费线上说明会｜AI+真实关系破圈`
4. 填写内容：`4月4日周六 20:00 腾讯会议`
5. 填写跳转链接：`https://wechat.eugenewe.net/event/ai-breakthrough`
6. 点击发送

用户收到模板消息 → 点击 → 打开活动落地页 → 看到完整信息 → 复制会议号参加

## 文件变更总结

| 文件 | 操作 |
|---|---|
| `src/pages/EventAIBreakthrough.tsx` | 新建，活动落地页 |
| `src/App.tsx` | 添加路由 |
| `src/config/ogConfig.ts` | 添加路径映射 |
| `supabase/functions/send-wechat-template-message/index.ts` | 支持 custom_url |
| `supabase/functions/batch-send-wechat-template/index.ts` | 透传 custom_url |
| `src/components/admin/WechatBroadcast.tsx` | 增加跳转链接输入框 |

