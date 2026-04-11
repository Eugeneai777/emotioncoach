

# 添加「直播通知」模版场景

## 现状分析

当前群发系统有 7 个场景模版（default、encouragement、inactivity、after_briefing、emotion_improvement、goal_milestone、consistent_checkin），全部在前端 `SCENARIOS` 数组和后端 `SYSTEM_TEMPLATE_IDS` 映射中硬编码。

要新增「直播通知」，需要改动 3 处：

## 修改清单

### 1. 前端：添加场景选项
**文件**: `src/components/admin/WechatBroadcast.tsx`

在 `SCENARIOS` 数组中新增：
```typescript
{ value: "livestream", label: "直播通知" },
```

### 2. 后端：注册模版 ID 映射
**文件**: `supabase/functions/send-wechat-template-message/index.ts`

在 `SYSTEM_TEMPLATE_IDS` 中新增：
```typescript
'livestream': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
```
先复用 `WECHAT_TEMPLATE_DEFAULT` 通用模版。如果你在微信公众号后台新建了专用直播模版，后续可以添加 `WECHAT_TEMPLATE_LIVESTREAM` 环境变量替换。

### 3. 后端：添加直播场景的消息内容逻辑
在同一文件的 `scenarioContentMap` 和 `scenarioNames` 中增加：

```typescript
// scenarioNames
'livestream': '直播通知',

// scenarioContentMap  
'livestream': { 
  first: '直播即将开始', 
  content: '点击进入直播间', 
  remark: '精彩内容不容错过 🎬' 
},
```

这样管理员在群发界面选择「直播通知」场景后，可通过"自定义标题"和"自定义内容"覆盖默认文案（如填入具体直播主题、时间），"跳转链接"填入直播间地址。

### 使用方式
1. 群发页面选择「直播通知」场景
2. 自定义标题填：如「今晚8点直播：财富心理学」
3. 自定义内容填：如「Eugene老师带你解锁财富卡点」
4. 跳转链接填：直播间 URL
5. 选择用户 → 发送

