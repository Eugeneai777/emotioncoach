## 问题确认（基于您手机小程序截图）

打开 `src/components/dynamic-assessment/MaleMidlifeVitalityShareCard.tsx` 与 `ShareCardBase.tsx` 核对，发现 3 个真实 bug（与端口无关，是组件本身的问题，三端都会出现）：

1. **维度文字底部被截掉**（"精力续航 / 睡眠修复 / 关键时刻信心 / 压力调节" 字底有缺口）
   - 第 115 行维度标签：`fontSize: 13, width: 78, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'`，没有显式 `lineHeight`，html2canvas 在不同字体度量下（小程序 webview vs PC Chrome）会把字底切掉。
   - `width: 78px` 对 5 字标签（"关键时刻信心"）也偏紧。

2. **"下一步建议" 卡片重复出现两次**（第 125-128 行与 130-133 行渲染了完全相同的内容）。

3. **底部 "Powered by 有劲AI" 被卡片圆角裁切**
   - `ShareCardBase` 外层 `padding={0}` + `overflow:hidden`，但内层正文用了 `padding: '24px 24px 16px'`，footer（QR + Branding）落在 padding=0 的外层、紧贴卡片边缘，圆角把品牌行下半部切掉了。

## 改动范围

只改 1 个文件：`src/components/dynamic-assessment/MaleMidlifeVitalityShareCard.tsx`。
不改 `ShareCardBase`、不动截图工具链、不动评分逻辑、不动支付/路由。

## 具体方案

### A. 维度行文字不再被截（核心）

把维度行的标签样式从：
```text
fontSize:13, width:78, whiteSpace:nowrap, overflow:hidden, textOverflow:ellipsis
```
改为：
```text
fontSize:13, lineHeight:1.45, width:96, whiteSpace:nowrap,
paddingTop:2, paddingBottom:2, fontVariantNumeric:'tabular-nums',
fontFamily:'-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
```

要点：
- 显式 `lineHeight: 1.45` + 上下各 2px padding，给汉字降部留出空间，html2canvas 截图就不会切字底。
- `width: 78 → 96`，"关键时刻信心" 6 字也能完整放下。
- 去掉 `overflow:hidden / textOverflow:ellipsis`（在不同 webview 字体下会"突然吞字"，反而是不稳定来源）。
- 显式声明中文字体栈，三端（PC Chrome / iOS Safari / 微信小程序 webview / Android webview）字体度量一致。

百分比数字同步加 `fontVariantNumeric:'tabular-nums'`，三端数字宽度一致。

维度数量保持 **`.slice(0, 4)`** 不变（按您反馈）。

### B. 删除重复 "下一步建议" 卡

删掉文件第 130-133 行那张重复白卡，只保留第 125-128 行那一张，字号 `13px`、行高 `1.6` 不变。

### C. 修底部品牌行被切

把 `<MaleMidlifeVitalityShareCard>` 传给 `ShareCardBase` 的 `padding` 从 `0` 改为 `20`，并把内层正文的 `padding` 从 `'24px 24px 16px'` 改为 `'4px 4px 12px'`。

效果：footer 也获得对称 20px 内边距，"Powered by 有劲AI" 不再被圆角裁掉。整体视觉宽度不变。

### D. 跨端排版稳定性兜底

在卡片根容器（ShareCardBase children 最外层 div）加：
- `fontFamily` 显式声明（同上字体栈）
- 所有数字元素加 `fontVariantNumeric: 'tabular-nums'`
- 给 "下一步建议" 文本块也加 `lineHeight: 1.6`（已有）+ `wordBreak: 'break-word'`

### E. （顺便）二维码副标题缩短

`ctaSubtitle` 从 `'3分钟 · 私密评估 · 免费出结果'` 缩为 `'3分钟 · 私密 · 免费'`，避免 360px 宽度下右侧文字太挤。
（仅这一行文案改动，不影响数据。）

## 验收清单

实现后我会：
1. 在 PC 预览触发 `/assessment/male_midlife_vitality` 结果页生成海报，下载 PNG 检查：
   - 4 个维度标签字底完整，无截断
   - 只有一张"下一步建议"
   - "Powered by 有劲AI" 完整可见
   - 状态指数 % 与结果页主分数一致
2. 用 360 / 390 / 414 三种主流移动宽度复核（覆盖手机端、小程序 webview、PC 缩放）。
3. 不在页面正文显示这张海报（保持现有 `position:absolute; left:-9999px` 隐藏渲染）。

## 不动的部分
- 不改 `ShareCardBase`，不影响其它测评海报
- 不改评分公式 / `toVitalityStatusScore`
- 不改截图工具 / 上传链路 / 支付链路 / 路由
