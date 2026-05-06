## 目标
让漫画拼图中的旁白/对白不再是"死板的矩形条"，而是像真正漫画那样：
- **旁白(narration)** → 仿手写"叙事框"(caption box)，常带折角/不规则边、米黄底色，固定贴在画格顶角
- **对白(dialogue)** → 真正的"对话气泡"，椭圆形、带指向人物的小尖角(tail)，根据画格位置自动指向
- **拟声/强调** → 可选爆炸框(jagged burst)用于关键词

## 改造范围
仅修改 `src/utils/comicGridComposer.ts`（纯 Canvas 绘制）以及 `DramaScriptGenerator.tsx` 中的 UI 选项，不动任何业务逻辑/数据。

## 新的 textStyle 选项
将原 `"banner" | "bubble"` 扩展为 5 种风格，下拉选择：

| 值 | 视觉效果 | 适用 |
|---|---|---|
| `caption` | 米黄/白色叙事框，左上或右上贴角，带细黑边+折角阴影 | 旁白 |
| `speech` | 椭圆白底气泡，黑边，底部带尖角(tail)指向画格中央/人物侧 | 对白 |
| `thought` | 云朵状气泡(多段弧线)，底部小圆泡链 | 内心独白 |
| `shout` | 锯齿爆炸框，红/黄底，粗黑边 | 喊叫/拟声 |
| `mixed`(默认) | 自动：narration→caption；dialogue→speech；同时存在则上下分布 | 通用 |

## Canvas 绘制要点
1. **椭圆气泡 + 尖角**：用 `ellipse()` 画主体；根据画格中尖角朝向(下/左下/右下)用 `moveTo/lineTo` 拼出三角 tail，再 `fill+stroke` 一次性闭合。
2. **叙事框折角**：矩形左上画一个小三角"翻页"，用浅色填充模拟纸张折角。
3. **云朵气泡**：沿椭圆轨迹打 8-10 个小弧形成花边；下方再画 2 个递减小圆泡。
4. **锯齿爆炸框**：极坐标外圈半径在 0.85R~1.0R 间交替，画 16-20 个齿。
5. **位置策略**：
   - 单条文字 → 根据 `style` 默认位置；
   - 旁白+对白同时存在 → 旁白固定上方 caption，对白下方 speech，互不重叠。
6. **字体**：标题继续 PingFang；气泡内文字加大字重 700，行距 1.4，自动按现有 `wrapText` 换行；超长时缩小字号至最小 22px。
7. **颜色 token**：在文件顶部抽出 `BUBBLE_PALETTE`（米黄 #fff8e1 / 纯白 / 警示黄 #facc15 / 红 #ef4444 + 黑边），便于以后调。

## UI 改动
`DramaScriptGenerator.tsx` 第 3264 行的 Select：
- 新增 `mixed/caption/speech/thought/shout` 五个 SelectItem，默认值改为 `mixed`
- `comicTextStyle` 类型同步更新

## 验证
- 选择 `mixed`：上方米黄叙事框 + 下方白色椭圆带尖角气泡
- 选择 `shout`：单画格出现锯齿爆炸框
- 9 宫格(3×3)无溢出，气泡尖角始终在画格内
- 中文长句正确换行不裁切

## 不改动
- 数据库、edge function、生成流程、自动保存、busy guard 全部不动
- 仅是导出漫画时的视觉升级