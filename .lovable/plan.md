

# 将直播通知切换为 WECHAT_TEMPLATE_APPOINTMENT 模版

## 分析

两个模版的字段结构不同：

```text
WECHAT_TEMPLATE_DEFAULT (当前直播用)     WECHAT_TEMPLATE_APPOINTMENT (目标)
─────────────────────────────────────    ──────────────────────────────────
first    → 标题头                        thing1  → 预约项目/通知主题 (≤20字)
keyword1 → 用户名                        thing19 → 详情/内容 (≤20字)
keyword2 → 内容                          time21  → 时间
keyword3 → 时间
remark   → 底部备注
```

APPOINTMENT 模版没有 `first` 和 `remark`，只有 3 个字段，更简洁。

## 修改内容

### 文件: `supabase/functions/send-wechat-template-message/index.ts`

**1. 更改模版映射** (第26行)
```typescript
// 改前
'livestream': Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
// 改后
'livestream': Deno.env.get('WECHAT_TEMPLATE_APPOINTMENT') || Deno.env.get('WECHAT_TEMPLATE_DEFAULT') || '',
```

**2. 将 livestream 加入专用分支处理**
在消息构建逻辑中，为 `livestream` 场景新增判断，使用 `thing1/thing19/time21` 字段：

```typescript
} else if (scenario === 'livestream') {
  const timeStr = formatBeijingTime();
  messageData = {
    thing1: { value: (notification.title || '直播即将开始').slice(0, 20), color: "#173177" },
    thing19: { value: (messageContent || '点击进入直播间').slice(0, 20), color: "#173177" },
    time21: { value: timeStr, color: "#173177" },
  };
}
```

## 发送效果预览

用户在微信中收到的消息将显示为：

```text
┌────────────────────────────────┐
│  预约通知                       │
│                                │
│  预约项目：今晚8点财富心理学直播   │
│  详    情：Eugene老师带你解锁卡点  │
│  时    间：2026-04-11 20:00     │
│                                │
│  详情 >                        │
└────────────────────────────────┘
```

点击消息 → 跳转到管理员设置的自定义链接（直播间URL）。

## 对比效果

| 项目 | 改前 (DEFAULT模版) | 改后 (APPOINTMENT模版) |
|------|-------------------|----------------------|
| 外观 | 带标题头+底部备注，5个字段 | 简洁卡片，3个字段 |
| 链接 | 同样支持自定义链接 | 同样支持 |
| 字段 | first/keyword1-3/remark | thing1/thing19/time21 |

