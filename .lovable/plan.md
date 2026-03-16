

## 将底部按钮对接「有劲AI生活教练」

### 修改内容

**文件：`src/components/awakening/AwakeningBottomNav.tsx`**

1. **顶部增加导入**（第 15 行后）：
```tsx
import { getSavedVoiceType } from "@/config/voiceTypeConfig";
```

2. **第 221-226 行**，将 `CoachVoiceChat` props 改为与生活教练页面一致：

```tsx
<CoachVoiceChat
  onClose={() => setShowVoiceChat(false)}
  coachEmoji="❤️"
  coachTitle="有劲AI生活教练"
  primaryColor="rose"
  tokenEndpoint="vibrant-life-realtime-token"
  userId={user?.id || ""}
  mode="general"
  featureKey="realtime_voice"
  voiceType={getSavedVoiceType()}
/>
```

| 属性 | 之前 | 之后 |
|------|------|------|
| coachEmoji | ✨ | ❤️ |
| coachTitle | 有劲AI语音教练 | 有劲AI生活教练 |
| primaryColor | amber | rose |
| tokenEndpoint | 无 | vibrant-life-realtime-token |
| mode | 默认 | general |
| featureKey | 无 | realtime_voice |
| voiceType | 无 | getSavedVoiceType() |

仅改一个文件，无数据库变动。

