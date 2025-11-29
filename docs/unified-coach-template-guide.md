# 统一教练模板使用指南

## 概述

统一教练模板 (`CoachLayout`) 提供了一套完整的、可复用的教练页面框架，支持对话式教练的快速搭建。

## 核心组件

### 1. CoachLayout - 主布局容器

位置：`src/components/coach/CoachLayout.tsx`

主要功能：
- 统一的页面布局和导航
- 空状态与对话状态的自动切换
- 集成头部、内容区、输入区

### 2. 可复用功能组件

#### CoachTrainingCamp - 训练营模块
位置：`src/components/coach/CoachTrainingCamp.tsx`

功能：
- 训练营邀请卡片（未激活状态）
- 训练营进度卡片（激活状态）
- 智能通知轮播

使用示例：
```tsx
<CoachTrainingCamp
  activeCamp={activeCamp}
  onStartCamp={() => setShowStartCamp(true)}
  onViewDetails={() => navigate("/camp-intro")}
  onCheckIn={handleCheckIn}
  notifications={notifications}
  currentNotificationIndex={currentNotificationIndex}
  onNextNotification={() => setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length)}
  onMarkAsRead={markAsRead}
  onDeleteNotification={deleteNotification}
  colorTheme="green"
  coachType="情绪教练"
/>
```

#### CoachCommunity - 社区瀑布流
位置：`src/components/coach/CoachCommunity.tsx`

功能：
- 展示社区动态
- 瀑布流布局

使用示例：
```tsx
<CoachCommunity />
```

## 快速开始：创建新教练

### 第1步：配置教练信息

在 `src/config/coachConfigs.ts` 中添加新教练配置：

```typescript
export const coachConfigs: Record<string, CoachConfig> = {
  // ... 现有配置
  
  newCoach: {
    id: "newCoach",
    emoji: "✨",
    title: "新教练名称",
    subtitle: "副标题",
    description: "详细描述",
    gradient: "from-purple-500 via-pink-500 to-rose-500",
    primaryColor: "purple",
    steps: [
      {
        id: 1,
        name: "第一步",
        subtitle: "Step 1",
        description: "步骤描述",
        details: "详细说明"
      },
      // ... 更多步骤
    ],
    stepsTitle: "方法论标题",
    stepsEmoji: "🎯",
    historyRoute: "/new-coach-history",
    historyLabel: "我的日记",
    placeholder: "请输入..."
  }
};
```

### 第2步：创建 Chat Hook

创建 `src/hooks/useNewCoachChat.ts`：

```typescript
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export const useNewCoachChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/new-coach`;

  const sendMessage = async (input: string) => {
    // 实现发送消息逻辑
    // 参考 useCommunicationChat.ts
  };

  const resetConversation = () => {
    setMessages([]);
  };

  return {
    messages,
    isLoading,
    sendMessage,
    resetConversation
  };
};
```

### 第3步：创建 Edge Function

创建 `supabase/functions/new-coach/index.ts`：

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    // 实现 AI 对话逻辑
    // 参考 carnegie-coach/index.ts
    
    return new Response(/* streaming response */, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

### 第4步：创建页面组件

创建 `src/pages/NewCoach.tsx`：

```typescript
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CoachLayout } from "@/components/coach/CoachLayout";
import { CoachTrainingCamp } from "@/components/coach/CoachTrainingCamp";
import { CoachCommunity } from "@/components/coach/CoachCommunity";
import { coachConfigs } from "@/config/coachConfigs";
import { useNewCoachChat } from "@/hooks/useNewCoachChat";
import { useSmartNotification } from "@/hooks/useSmartNotification";

const NewCoach = () => {
  const navigate = useNavigate();
  const config = coachConfigs.newCoach;
  const chat = useNewCoachChat();
  
  // 如果需要训练营功能
  const [activeCamp, setActiveCamp] = useState(null);
  const { notifications, markAsRead, deleteNotification } = useSmartNotification('new_coach');
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);

  return (
    <CoachLayout
      // 主题配置
      emoji={config.emoji}
      title={config.title}
      subtitle={config.subtitle}
      description={config.description}
      gradient={config.gradient}
      primaryColor={config.primaryColor}
      
      // 步骤配置
      steps={config.steps}
      stepsTitle={config.stepsTitle}
      stepsEmoji={config.stepsEmoji}
      moreInfoRoute={config.moreInfoRoute}
      
      // 路由配置
      historyRoute={config.historyRoute}
      historyLabel={config.historyLabel}
      
      // 对话功能
      messages={chat.messages}
      isLoading={chat.isLoading}
      input={input}
      onInputChange={setInput}
      onSend={() => {
        chat.sendMessage(input);
        setInput("");
      }}
      onNewConversation={chat.resetConversation}
      placeholder={config.placeholder}
      
      // 可选功能模块
      trainingCamp={
        <CoachTrainingCamp
          activeCamp={activeCamp}
          onStartCamp={() => navigate("/camp-intro")}
          onViewDetails={() => navigate("/camp-intro")}
          notifications={notifications}
          currentNotificationIndex={currentNotificationIndex}
          onNextNotification={() => setCurrentNotificationIndex((prev) => (prev + 1) % notifications.length)}
          onMarkAsRead={markAsRead}
          onDeleteNotification={deleteNotification}
          colorTheme="purple"
          coachType="新教练"
        />
      }
      community={<CoachCommunity />}
    />
  );
};

export default NewCoach;
```

### 第5步：添加路由

在 `src/App.tsx` 中添加路由：

```typescript
import NewCoach from "@/pages/NewCoach";

// 在路由配置中添加
<Route path="/new-coach" element={<NewCoach />} />
```

### 第6步：添加到教练空间

在 `src/components/coach/CoachSpaceContent.tsx` 中添加教练卡片：

```typescript
const coaches = [
  // ... 现有教练
  {
    id: "new-coach",
    title: "新教练",
    subtitle: "副标题",
    description: "描述",
    icon: "Sparkles",
    gradient: "from-purple-500 to-pink-500",
    route: "/new-coach",
    badge: "新"
  }
];
```

## 可选功能配置

### 语音控制

```typescript
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

const {
  isListening,
  startListening,
  stopListening,
  isSupported: voiceInputSupported
} = useSpeechRecognition();

const {
  isSpeaking,
  stopSpeaking,
  isSupported: voiceOutputSupported
} = useSpeechSynthesis();

<CoachLayout
  // ... 其他配置
  voiceControls={{
    isListening,
    isSpeaking,
    onStartListening: startListening,
    onStopListening: stopListening,
    onStopSpeaking: stopSpeaking,
    isSupported: voiceInputSupported && voiceOutputSupported
  }}
/>
```

### 场景模板

```typescript
<CoachLayout
  // ... 其他配置
  scenarios={
    <YourScenariosComponent onSelectScenario={(prompt) => {
      setInput(prompt);
      chat.sendMessage(prompt);
    }} />
  }
/>
```

### 额外内容

```typescript
<CoachLayout
  // ... 其他配置
  extraContent={
    <div>
      <YourCustomComponent1 />
      <YourCustomComponent2 />
    </div>
  }
/>
```

## 最佳实践

### 1. 配置集中管理
所有教练配置统一在 `coachConfigs.ts` 中管理，便于维护和复用。

### 2. Hook 复用
Chat Hook 的实现可以参考现有的：
- `useStreamChat.ts` - 情绪教练
- `useCommunicationChat.ts` - 沟通教练
- `useParentCoach.ts` - 亲子教练

### 3. 颜色主题
使用语义化的颜色：
- `green` - 情绪教练
- `blue` - 沟通教练
- `purple` - 亲子教练
- 其他主题可自定义

### 4. 模块化
将可复用的功能抽取为独立组件：
- 训练营：`CoachTrainingCamp`
- 社区：`CoachCommunity`
- 通知：集成在 `CoachTrainingCamp` 中

### 5. 类型安全
使用 TypeScript 接口确保类型安全：
- `CoachConfig` - 教练配置
- `CoachLayoutProps` - 布局属性
- 自定义消息类型

## 常见问题

### Q: 如何自定义步骤数量？
A: 在配置中的 `steps` 数组中添加或删除步骤，模板会自动适配。

### Q: 如何禁用某些功能？
A: 不传递对应的 prop 即可，所有可选功能都是可选的。

### Q: 如何自定义主题色？
A: 在配置中设置 `gradient` 和 `primaryColor`，使用 Tailwind 的颜色类。

### Q: 如何添加数据库表？
A: 使用 Supabase migration 工具创建对应的 briefing 表，参考：
- `briefings` - 情绪教练
- `communication_briefings` - 沟通教练
- `parent_coaching_sessions` - 亲子教练

## 示例项目

完整示例可参考现有教练：
- 情绪觉醒教练：`src/pages/Index.tsx`
- 卡内基沟通教练：`src/pages/CommunicationCoach.tsx`
- 家长情绪教练：`src/pages/ParentCoach.tsx`
