
## 删除「分享我的AI测评报告」按钮及相关代码

### 涉及文件

只需修改一个文件：`src/components/wealth-block/WealthBlockResult.tsx`

---

### 修改内容

**1. 删除 JSX 块（第 716-726 行）**

删除整个 `<WealthInviteCardDialog>` 组件（包含 trigger 按钮）：

```tsx
// 删除这段
<WealthInviteCardDialog
  defaultTab="value"
  assessmentScore={100 - healthScore}
  reactionPattern={result.reactionPattern}
  trigger={
    <Button className="w-full h-14 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg text-base">
      <Share2 className="w-5 h-5 mr-2" />
      分享我的AI测评报告
    </Button>
  }
/>
```

**2. 删除 import（第 9 行）**

```tsx
// 删除
import WealthInviteCardDialog from "@/components/wealth-camp/WealthInviteCardDialog";
```

**3. 清理 lucide-react import（第 5 行）**

`Share2` 仅在此按钮中使用，从 import 中移除：

```tsx
// 修改前
import { Target, Heart, Brain, Share2, Sparkles, ChevronDown, ChevronUp, BookImage } from "lucide-react";

// 修改后
import { Target, Heart, Brain, Sparkles, ChevronDown, ChevronUp, BookImage } from "lucide-react";
```

---

### 注意

- `motion.div` 容器（第 710-788 行）保留，其中还包含 `UnifiedPayDialog` 和 `StartCampDialog`，这两个组件不受影响。
- `XiaohongshuShareDialog` 的 import 保留（如果其他地方用到）。
- 不影响任何其他页面，`WealthInviteCardDialog` 组件本身不删除，仅移除在此处的使用。
