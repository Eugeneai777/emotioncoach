## 目标
在 `DramaScriptGenerator`（`/drama-script` 页面）已生成全部分镜图片 + 旁白后，提供「合成多宫格漫画」选项：把所有镜头图按宫格排版，叠加旁白/台词气泡，导出为一张 PNG 漫画长图（可选携带音频另出 mp3）。

## 用户操作流程
1. 完成全部镜头出图（已有功能）
2. 完成全部旁白生成（已有功能，可选）
3. 在底部操作区点击「🧩 合成多宫格漫画」按钮
4. 弹出小面板选择：
   - 布局：`2 列`（默认） / `3 列` / `1 列长条`
   - 文本来源：`旁白`（默认） / `台词` / `两者都显示` / `不显示`
   - 文本样式：`底部条幅`（默认） / `顶部气泡`
   - 是否显示镜头号 / 标题 / 页脚水印
5. 点击生成 → 前端 Canvas 合成 → 预览大图 + 「下载 PNG」+ 「下载合并旁白 mp3」（复用已有 `downloadMergedAudio`）

## 实现方案（纯前端 Canvas，不需新 edge function）

### 新建：`src/utils/comicGridComposer.ts`
- 入参：
  ```ts
  {
    title: string;
    panels: { sceneNumber: number; imageUrl: string; narration?: string; dialogue?: string; }[];
    columns: 1 | 2 | 3;
    textMode: "narration" | "dialogue" | "both" | "none";
    textStyle: "banner" | "bubble";
    showSceneNumber: boolean;
    showTitle: boolean;
    watermark?: string;
  }
  ```
- 流程：
  1. `Promise.all` 加载所有图片到 `HTMLImageElement`（`crossOrigin="anonymous"`，CDN 已是 public bucket）
  2. 计算 cell 尺寸：宽度固定 720px/列，按图片纵横比裁剪/letterbox 到统一 cell 高度（默认 9:16 → 1280px 高，可按 `imageAspectRatio` 推断）
  3. `OffscreenCanvas`（兜底 `HTMLCanvasElement`）按 `Math.ceil(panels.length / columns)` 行绘制
  4. 文本：
     - banner：底部 28% 半透明黑底 + 白字，自动换行（基于 `measureText`）
     - bubble：顶部圆角白色气泡 + 黑边 + 黑字
  5. 镜头号：左上角圆形 badge
  6. 顶部 title bar（可选）+ 底部 watermark（默认 `eugeneai.me`）
  7. `canvas.toBlob('image/png')` → 返回 Blob

### 修改：`src/components/admin/DramaScriptGenerator.tsx`
1. 新增 state：
   ```ts
   const [comicOpen, setComicOpen] = useState(false);
   const [comicColumns, setComicColumns] = useState<1|2|3>(2);
   const [comicTextMode, setComicTextMode] = useState<"narration"|"dialogue"|"both"|"none">("narration");
   const [comicTextStyle, setComicTextStyle] = useState<"banner"|"bubble">("banner");
   const [comicShowNumber, setComicShowNumber] = useState(true);
   const [comicShowTitle, setComicShowTitle] = useState(true);
   const [comicBuilding, setComicBuilding] = useState(false);
   const [comicPreviewUrl, setComicPreviewUrl] = useState<string | null>(null);
   ```
2. 新增 `handleBuildComic()`：从 `result.scenes` 收集 `sceneImages[n].imageUrl || scene.generatedImageUrl`，缺图给 toast 提示并跳过；调用 composer，得到 blob → `URL.createObjectURL` 设为预览。
3. 新增 `downloadComic()`：触发下载 `${title}-comic.png`。
4. UI：在「合并下载视频」按钮旁新增 `🧩 合成多宫格漫画` 按钮 + `Dialog`（复用 shadcn `Dialog`）承载选项面板和预览图。
5. Dialog 底部按钮：`下载漫画 PNG` / `下载合并旁白 MP3`（已存在 `downloadMergedAudio` 直接复用）。

### 不改动后端
- 图片均已上传到 `community-images` public bucket（`drama-scene-image-openai` 已生成 public URL），可直接 `crossOrigin` 加载到 canvas。
- 旁白已是独立 mp3，无需重新合成（视频合并复用 `mergeVideosClientSide`，漫画导出与音频无依赖）。

## 文件改动汇总
- 新增 `src/utils/comicGridComposer.ts`
- 修改 `src/components/admin/DramaScriptGenerator.tsx`（新 state + 按钮 + Dialog）

## 备注
- 旁白若为音频，无法"印"在静态图上；多宫格漫画里以**文字**形式展示旁白/台词。如果你要"漫画 + 一段旁白音频" 的播放体验，可以同时下载 PNG 和合并 MP3，或后续追加一个「漫画视频」方案（每格停留 N 秒 + 整段旁白）—— 如需这版本告诉我，我再追加 plan。