

# 当前计划缺失项评估

`.lovable/plan.md` 中的计划**仅**涉及"强制触发新版本发布"，**没有**包含以下两项：

## 缺失一：Day 3/5/6 冥想文案分段（空格分隔文本）

`formatScript` 函数（第 222-254 行）只支持两种分段方式：
1. 按 `\n` 换行分段
2. 按 `。！？…` 标点分段

Day 3/5/6 的 Whisper 转录文本没有句号，用空格分隔句子，导致无法分段（显示为一整坨）。

**修复**：在 `formatScript` 中增加第三层逻辑——当标点分割仍只产生 1 个段落时，按空格 ` ` 分割句子，每 4-5 句合并为一段。

## 缺失二：播放缓冲慢

当前 `<audio>` 使用 `preload="auto"`，但 5MB 的 MP3 文件在移动端仍需较长缓冲。改进措施：

1. **预加载优化**：将 `preload` 改为 `"metadata"`，点击播放时再开始加载音频数据
2. **加载进度显示**：监听 `progress` 事件，显示缓冲百分比（如"加载中 45%..."），让用户知道正在加载而非卡死
3. **已有重试逻辑保留**：第 153-166 行的 `audio.load()` 重试机制保持不变

## 缺失三：简体中文统一

数据库层面的简体中文修正已在之前的 SQL UPDATE 中完成。但需要**验证**线上数据是否已生效（数据库操作是实时的，不依赖前端发布）。

## 更新后的完整计划

| 步骤 | 内容 | 类型 |
|---|---|---|
| 1 | `formatScript` 增加空格分割逻辑，修复 Day 3/5/6 排版 | 前端代码 |
| 2 | 音频 `preload` 改为 `metadata`，增加缓冲进度显示 | 前端代码 |
| 3 | 查询线上数据库确认简体中文已生效 | 数据验证 |
| 4 | 发布新版本（以上代码改动会自动触发 Publish 按钮可用） | 发布 |

### 技术细节

**formatScript 修改**（StressMeditation.tsx 第 239-253 行）：
```typescript
// 在 sentParagraphs.length <= 1 时追加空格分割逻辑
if (sentParagraphs.length <= 1) {
  const spaceSegments = allText.split(/\s+/).filter(s => s.trim());
  if (spaceSegments.length > 4) {
    const spaceParagraphs: string[][] = [];
    let spaceCurrent: string[] = [];
    for (const seg of spaceSegments) {
      spaceCurrent.push(seg);
      if (spaceCurrent.length >= 4) {
        spaceParagraphs.push([spaceCurrent.join('，')]);
        spaceCurrent = [];
      }
    }
    if (spaceCurrent.length > 0) spaceParagraphs.push([spaceCurrent.join('，')]);
    return spaceParagraphs;
  }
}
```

**音频缓冲改进**（StressMeditation.tsx）：
- 第 281 行 `preload="auto"` → `preload="metadata"`
- 播放按钮区域增加缓冲进度百分比显示
- 新增 `bufferProgress` state + `progress` 事件监听

