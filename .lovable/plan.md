
# 彻底修复分享卡片下载显示问题 — 全量 Inline Style 方案

## 为什么这个问题反复出现

html2canvas 在生成图片时会克隆 DOM 到一个离屏容器中渲染。Tailwind CSS 的类名依赖于样式表的计算，在克隆环境中经常丢失或计算错误。每次修补 shareCardConfig.ts 的渲染逻辑只是治标，卡片组件本身用 Tailwind 写样式才是根本原因。

对比项目中两张卡片：
- WealthCampShareCard（橙色）：100% inline style — 稳定
- AssessmentValueShareCard（紫色）：Tailwind 类名 — 反复出错

## 方案：一劳永逸

将 `AssessmentValueShareCard.tsx` 的所有 Tailwind 类名替换为 inline style，与 WealthCampShareCard 保持一致。这样 html2canvas 直接读取元素上的 style 属性，不再依赖 CSS 样式表计算。

## 具体改动

### 文件：`src/components/wealth-block/AssessmentValueShareCard.tsx`

全量重写样式，所有视觉属性使用 inline style：

1. **根容器**：`className="w-[320px] rounded-2xl overflow-hidden shadow-2xl"` 改为 `style={{ width: '320px', borderRadius: '16px', overflow: 'hidden' }}`（保留已有的 background gradient inline style）

2. **布局**：所有 `flex`、`items-center`、`gap-*`、`justify-between` 改为对应的 `display: 'flex'`、`alignItems: 'center'`、`gap: 'Xpx'`

3. **间距**：所有 `p-5`、`mb-4`、`space-y-3` 改为 `padding`、`marginBottom`、`gap`

4. **颜色与透明度**：
   - `text-white/90` 改为 `color: 'rgba(255,255,255,0.9)'`
   - `text-amber-300/80` 改为 `color: 'rgba(252,211,77,0.8)'`
   - `bg-white/10` 改为 `background: 'rgba(255,255,255,0.1)'`
   - `bg-amber-500/30` 改为 `background: 'rgba(245,158,11,0.3)'`
   - `border-amber-400/50` 改为 `border: '2px solid rgba(251,191,35,0.5)'`

5. **CTA 区域渐变**：`bg-gradient-to-r from-amber-500/20 to-orange-500/20` 改为 `background: 'linear-gradient(to right, rgba(245,158,11,0.2), rgba(249,115,22,0.2))'`

6. **Footer**：`bg-black/30` 改为 `background: 'rgba(0,0,0,0.3)'`

7. **文字样式**：所有 `text-sm`、`text-xs`、`font-bold`、`text-center` 改为 `fontSize`、`fontWeight`、`textAlign`

8. **移除 `backdrop-blur-sm`**：html2canvas 不支持 backdrop-filter，直接删除

### 不需要改动的文件

- `shareCardConfig.ts` — 之前的 onclone 修复保留作为兜底，但不再需要依赖它
- `WealthCampShareCard.tsx` — 已经是 inline style，无需改动

## 预期效果

- 所有分享卡片下载后背景、文字、布局完全正确
- 不再依赖 html2canvas 对 Tailwind 类名的解析
- 与 WealthCampShareCard 保持统一的编码规范，后续维护更简单
