

# 优化"财富简报"页面排版

## 修改内容

### 1. 重命名：财富简报 --> 我的财富日记

在 `src/pages/WealthCampCheckIn.tsx` 中修改以下文本：
- 第 856 行：Tab 标签 `财富简报` 改为 `财富日记`
- 第 913 行：空状态提示 `还没有财富简报` 改为 `还没有财富日记`
- 第 914 行：`完成财富梳理后自动生成` 保持不变

### 2. 修复手机端按钮排版混乱

当前问题：第 868-908 行，4 个功能按钮 + 2 个补齐按钮全部挤在一行（`flex items-center justify-between`），手机屏幕上会溢出或换行混乱。

修复方案：
- 将 4 个快捷按钮区域改为 `grid grid-cols-2 gap-2`（2x2 网格布局），每个按钮等宽
- 将 2 个补齐按钮（BackfillMemoriesButton、BackfillVoiceBriefingsButton）移到快捷按钮下方，也用 `grid grid-cols-2 gap-2` 排列
- 整体外层用 `space-y-3` 垂直堆叠

### 技术细节

修改文件：`src/pages/WealthCampCheckIn.tsx`

改动前结构：
```
<div flex justify-between>
  <div flex flex-wrap>  ← 4个按钮挤在一起
    冥想库 | 财富测评 | 教练对话 | 分享邀请
  </div>
  BackfillMemoriesButton   ← 和上面同行
  BackfillVoiceBriefingsButton  ← 和上面同行
</div>
```

改动后结构：
```
<div space-y-3>
  <div grid grid-cols-2 gap-2>  ← 2x2 网格
    冥想库 | 财富测评
    教练对话 | 分享邀请
  </div>
  <div grid grid-cols-2 gap-2>  ← 补齐按钮单独一行
    BackfillMemoriesButton | BackfillVoiceBriefingsButton
  </div>
</div>
```

