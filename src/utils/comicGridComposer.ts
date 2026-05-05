/**
 * Compose a multi-panel comic image from drama scene images + narration/dialogue.
 * Pure client-side Canvas; returns a PNG Blob.
 */

export interface ComicPanelInput {
  sceneNumber: number;
  imageUrl: string;
  narration?: string;
  dialogue?: string;
}

export interface ComicComposeOptions {
  title: string;
  panels: ComicPanelInput[];
  columns: 1 | 2 | 3;
  textMode: "narration" | "dialogue" | "both" | "none";
  textStyle: "banner" | "bubble";
  showSceneNumber: boolean;
  showTitle: boolean;
  watermark?: string;
}

const CELL_WIDTH = 720; // px per column
const GUTTER = 16;
const PADDING = 32;
const TITLE_BAR_H = 96;
const FOOTER_H = 56;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`图片加载失败: ${url}`));
    img.src = url;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = "";
  // Split by manual newlines first, then char-by-char (good for CJK)
  for (const segment of text.split(/\n/)) {
    current = "";
    for (const ch of Array.from(segment)) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function getPanelText(p: ComicPanelInput, mode: ComicComposeOptions["textMode"]): string {
  if (mode === "none") return "";
  if (mode === "narration") return p.narration || "";
  if (mode === "dialogue") return p.dialogue || "";
  // both
  const parts: string[] = [];
  if (p.narration) parts.push(p.narration);
  if (p.dialogue) parts.push(`「${p.dialogue}」`);
  return parts.join("\n");
}

export async function composeComicGrid(opts: ComicComposeOptions): Promise<Blob> {
  const { panels, columns, textMode, textStyle, showSceneNumber, showTitle, title, watermark } = opts;
  if (panels.length === 0) throw new Error("没有可用的镜头图片");

  const images = await Promise.all(panels.map((p) => loadImage(p.imageUrl)));

  // Determine cell height from first image's aspect ratio
  const first = images[0];
  const aspect = first.height / first.width;
  const cellW = CELL_WIDTH;
  const cellH = Math.round(cellW * aspect);

  const rows = Math.ceil(panels.length / columns);
  const canvasW = PADDING * 2 + cellW * columns + GUTTER * (columns - 1);
  const canvasH =
    PADDING * 2 +
    (showTitle ? TITLE_BAR_H : 0) +
    cellH * rows +
    GUTTER * (rows - 1) +
    (watermark ? FOOTER_H : 0);

  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Title bar
  let cursorY = PADDING;
  if (showTitle && title) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(title, canvasW / 2, cursorY + TITLE_BAR_H / 2);
    cursorY += TITLE_BAR_H;
  }

  // Panels
  for (let i = 0; i < panels.length; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = PADDING + col * (cellW + GUTTER);
    const y = cursorY + row * (cellH + GUTTER);

    const img = images[i];
    // Draw image with object-fit: cover
    const imgAspect = img.width / img.height;
    const cellAspect = cellW / cellH;
    let sx = 0, sy = 0, sw = img.width, sh = img.height;
    if (imgAspect > cellAspect) {
      sw = img.height * cellAspect;
      sx = (img.width - sw) / 2;
    } else {
      sh = img.width / cellAspect;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, cellW, cellH);

    // Border
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

    // Scene number badge
    if (showSceneNumber) {
      const badgeR = 32;
      const bx = x + badgeR + 12;
      const by = y + badgeR + 12;
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "#000000";
      ctx.font = "bold 30px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(panels[i].sceneNumber), bx, by + 1);
    }

    // Text overlay
    const text = getPanelText(panels[i], textMode);
    if (text) {
      const fontSize = 28;
      ctx.font = `600 ${fontSize}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
      const padX = 24;
      const padY = 18;
      const lineH = fontSize * 1.35;
      const innerW = cellW - padX * 2 - 16;
      const lines = wrapText(ctx, text, innerW);
      const boxH = lines.length * lineH + padY * 2;

      if (textStyle === "banner") {
        // bottom banner
        const by = y + cellH - boxH - 8;
        ctx.fillStyle = "rgba(0,0,0,0.72)";
        ctx.fillRect(x + 8, by, cellW - 16, boxH);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, x + padX, by + padY + idx * lineH);
        });
      } else {
        // top bubble
        const bx = x + 16;
        const by = y + 16;
        const bw = cellW - 32;
        const bh = boxH;
        const r = 18;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(bx + r, by);
        ctx.arcTo(bx + bw, by, bx + bw, by + bh, r);
        ctx.arcTo(bx + bw, by + bh, bx, by + bh, r);
        ctx.arcTo(bx, by + bh, bx, by, r);
        ctx.arcTo(bx, by, bx + bw, by, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((ln, idx) => {
          ctx.fillText(ln, bx + padX - 8, by + padY + idx * lineH);
        });
      }
    }
  }

  // Footer watermark
  if (watermark) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "300 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(watermark, canvasW / 2, canvasH - FOOTER_H / 2 - PADDING / 2);
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Canvas 导出失败"))), "image/png", 0.95);
  });
}
