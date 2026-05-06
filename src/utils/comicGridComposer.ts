/**
 * Compose a multi-panel comic image from drama scene images + narration/dialogue.
 * Pure client-side Canvas; returns a PNG Blob.
 *
 * Supports comic-style text containers:
 *  - caption  : 米黄叙事框 + 折角，贴顶部 (旁白)
 *  - speech   : 椭圆对话气泡 + 尖角 (对白)
 *  - thought  : 云朵气泡 + 小圆泡链 (内心独白)
 *  - shout    : 锯齿爆炸框 (喊叫/拟声)
 *  - mixed    : 自动 narration→caption + dialogue→speech
 *  - banner / bubble : 旧版兼容
 */

export interface ComicPanelInput {
  sceneNumber: number;
  imageUrl: string;
  narration?: string;
  dialogue?: string;
}

export type ComicTextStyle =
  | "mixed"
  | "caption"
  | "speech"
  | "thought"
  | "shout"
  | "banner"
  | "bubble";

export interface ComicComposeOptions {
  title: string;
  panels: ComicPanelInput[];
  columns: 1 | 2 | 3;
  textMode: "narration" | "dialogue" | "both" | "none";
  textStyle: ComicTextStyle;
  showSceneNumber: boolean;
  showTitle: boolean;
  watermark?: string;
}

const CELL_WIDTH = 720;
const GUTTER = 16;
const PADDING = 32;
const TITLE_BAR_H = 96;
const FOOTER_H = 56;

const PALETTE = {
  caption: "#fff5d6",
  captionFold: "#e8d896",
  speech: "#ffffff",
  thought: "#ffffff",
  shout: "#fde047",
  shoutAlt: "#ef4444",
  ink: "#0a0a0a",
  text: "#0a0a0a",
  shoutText: "#1a1a1a",
};

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

/** Fit text inside a max box by shrinking font size. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxHeight: number,
  startSize = 30,
  minSize = 20,
  weight = 600,
): { lines: string[]; fontSize: number; lineH: number } {
  let size = startSize;
  while (size >= minSize) {
    ctx.font = `${weight} ${size}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
    const lines = wrapText(ctx, text, maxWidth);
    const lineH = size * 1.4;
    if (lines.length * lineH <= maxHeight) {
      return { lines, fontSize: size, lineH };
    }
    size -= 2;
  }
  ctx.font = `${weight} ${minSize}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
  const lines = wrapText(ctx, text, maxWidth);
  return { lines, fontSize: minSize, lineH: minSize * 1.35 };
}

/** Caption box (旁白叙事框) with folded corner */
function drawCaptionBox(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, text: string,
  maxH: number,
) {
  const padX = 22, padY = 16;
  const fit = fitText(ctx, text, w - padX * 2 - 24, maxH - padY * 2, 30, 20, 600);
  const h = Math.max(60, fit.lines.length * fit.lineH + padY * 2);
  const fold = 22;

  // Drop shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  // Main box (with cut corner top-right)
  ctx.fillStyle = PALETTE.caption;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Border
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.stroke();

  // Folded triangle
  ctx.fillStyle = PALETTE.captionFold;
  ctx.beginPath();
  ctx.moveTo(x + w - fold, y);
  ctx.lineTo(x + w, y + fold);
  ctx.lineTo(x + w - fold, y + fold);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Text
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 ${fit.fontSize}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  fit.lines.forEach((ln, i) => {
    ctx.fillText(ln, x + padX, y + padY + i * fit.lineH);
  });

  return h;
}

/** Rounded ellipse-ish speech bubble with tail */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  cellX: number, cellY: number, cellW: number, cellH: number,
  text: string,
  tailDirection: "down" | "down-left" | "down-right" = "down",
) {
  const maxW = cellW - 64;
  const maxH = cellH * 0.42;
  const padX = 28, padY = 22;
  const fit = fitText(ctx, text, maxW - padX * 2, maxH - padY * 2, 30, 20, 700);
  const w = Math.min(maxW, Math.max(...fit.lines.map(l => ctx.measureText(l).width)) + padX * 2);
  const h = Math.max(70, fit.lines.length * fit.lineH + padY * 2);

  // Position bubble in lower 1/2 of cell, centered
  const bx = cellX + (cellW - w) / 2;
  const by = cellY + cellH - h - 40;
  const r = Math.min(28, h / 2);

  // Tail
  const tailW = 28, tailH = 28;
  let tailBaseX = bx + w / 2;
  let tailTipX = tailBaseX;
  if (tailDirection === "down-left") {
    tailBaseX = bx + w * 0.3;
    tailTipX = tailBaseX - 10;
  } else if (tailDirection === "down-right") {
    tailBaseX = bx + w * 0.7;
    tailTipX = tailBaseX + 10;
  }
  const tailBaseY = by + h - 1;
  const tailTipY = by + h + tailH;

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = PALETTE.speech;
  ctx.beginPath();
  // Rounded rect
  ctx.moveTo(bx + r, by);
  ctx.arcTo(bx + w, by, bx + w, by + h, r);
  ctx.arcTo(bx + w, by + h, bx, by + h, r);
  // Insert tail along bottom
  ctx.lineTo(tailBaseX + tailW / 2, by + h);
  ctx.lineTo(tailTipX, tailTipY);
  ctx.lineTo(tailBaseX - tailW / 2, by + h);
  ctx.arcTo(bx, by + h, bx, by, r);
  ctx.arcTo(bx, by, bx + w, by, r);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Stroke
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Text
  ctx.fillStyle = PALETTE.text;
  ctx.font = `700 ${fit.fontSize}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  fit.lines.forEach((ln, i) => {
    ctx.fillText(ln, bx + w / 2, by + padY + i * fit.lineH);
  });
}

/** Cloud-style thought bubble */
function drawThoughtBubble(
  ctx: CanvasRenderingContext2D,
  cellX: number, cellY: number, cellW: number, cellH: number,
  text: string,
) {
  const maxW = cellW - 80;
  const maxH = cellH * 0.42;
  const padX = 32, padY = 26;
  const fit = fitText(ctx, text, maxW - padX * 2, maxH - padY * 2, 28, 20, 600);
  const w = Math.min(maxW, Math.max(...fit.lines.map(l => ctx.measureText(l).width)) + padX * 2);
  const h = Math.max(80, fit.lines.length * fit.lineH + padY * 2);
  const bx = cellX + (cellW - w) / 2;
  const by = cellY + cellH - h - 60;

  // Cloud bumps around perimeter
  const cx = bx + w / 2, cy = by + h / 2;
  const rx = w / 2, ry = h / 2;
  const bumps = 14;
  const bumpR = Math.min(w, h) * 0.11;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = PALETTE.thought;
  ctx.beginPath();
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2;
    const px = cx + Math.cos(t) * (rx - bumpR * 0.4);
    const py = cy + Math.sin(t) * (ry - bumpR * 0.4);
    ctx.moveTo(px + bumpR, py);
    ctx.arc(px, py, bumpR, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2;
    const px = cx + Math.cos(t) * (rx - bumpR * 0.4);
    const py = cy + Math.sin(t) * (ry - bumpR * 0.4);
    ctx.beginPath();
    ctx.arc(px, py, bumpR, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Trailing bubbles
  for (let i = 0; i < 3; i++) {
    const r = 14 - i * 4;
    const px = bx + w * 0.35;
    const py = by + h + 18 + i * (r * 2 + 6);
    ctx.fillStyle = PALETTE.thought;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Text
  ctx.fillStyle = PALETTE.text;
  ctx.font = `600 ${fit.fontSize}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  fit.lines.forEach((ln, i) => {
    ctx.fillText(ln, bx + w / 2, by + padY + i * fit.lineH);
  });
}

/** Jagged starburst shout box */
function drawShoutBurst(
  ctx: CanvasRenderingContext2D,
  cellX: number, cellY: number, cellW: number, cellH: number,
  text: string,
) {
  const maxW = cellW * 0.7;
  const maxH = cellH * 0.4;
  const padX = 28, padY = 22;
  const fit = fitText(ctx, text, maxW - padX * 2, maxH - padY * 2, 36, 22, 800);
  const w = Math.min(maxW, Math.max(...fit.lines.map(l => ctx.measureText(l).width)) + padX * 2);
  const h = Math.max(80, fit.lines.length * fit.lineH + padY * 2);
  const cx = cellX + cellW / 2;
  const cy = cellY + cellH - h / 2 - 40;
  const rx = w / 2 + 16;
  const ry = h / 2 + 16;

  const spikes = 22;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = PALETTE.shout;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const t = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? 1.0 : 0.78;
    const px = cx + Math.cos(t) * rx * r;
    const py = cy + Math.sin(t) * ry * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = PALETTE.shoutText;
  ctx.font = `800 ${fit.fontSize}px 'PingFang SC', 'Hiragino Sans GB', system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const totalH = fit.lines.length * fit.lineH;
  fit.lines.forEach((ln, i) => {
    ctx.fillText(ln, cx, cy - totalH / 2 + i * fit.lineH + fit.lineH / 2);
  });
}

function getTexts(p: ComicPanelInput, mode: ComicComposeOptions["textMode"]) {
  const narration = (mode === "narration" || mode === "both") ? (p.narration || "") : "";
  const dialogue = (mode === "dialogue" || mode === "both") ? (p.dialogue || "") : "";
  return { narration, dialogue };
}

export async function composeComicGrid(opts: ComicComposeOptions): Promise<Blob> {
  const { panels, columns, textMode, textStyle, showSceneNumber, showTitle, title, watermark } = opts;
  if (panels.length === 0) throw new Error("没有可用的镜头图片");

  const images = await Promise.all(panels.map((p) => loadImage(p.imageUrl)));

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

  // Background — subtle paper texture
  const bg = ctx.createLinearGradient(0, 0, 0, canvasH);
  bg.addColorStop(0, "#1a1a1a");
  bg.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = bg;
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

  for (let i = 0; i < panels.length; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const x = PADDING + col * (cellW + GUTTER);
    const y = cursorY + row * (cellH + GUTTER);

    const img = images[i];
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

    if (textMode === "none") continue;

    const { narration, dialogue } = getTexts(panels[i], textMode);

    // Decide rendering
    if (textStyle === "mixed") {
      // narration → caption (top), dialogue → speech (bottom)
      if (narration) {
        drawCaptionBox(ctx, x + 16, y + 16, cellW - 32, narration, cellH * 0.35);
      }
      if (dialogue) {
        const tail = i % 3 === 0 ? "down-left" : i % 3 === 1 ? "down" : "down-right";
        drawSpeechBubble(ctx, x, y, cellW, cellH, dialogue, tail);
      }
    } else if (textStyle === "caption") {
      const text = [narration, dialogue].filter(Boolean).join("\n");
      if (text) drawCaptionBox(ctx, x + 16, y + 16, cellW - 32, text, cellH * 0.45);
    } else if (textStyle === "speech") {
      const text = [narration, dialogue && `「${dialogue}」`].filter(Boolean).join("\n");
      if (text) drawSpeechBubble(ctx, x, y, cellW, cellH, text);
    } else if (textStyle === "thought") {
      const text = [narration, dialogue].filter(Boolean).join("\n");
      if (text) drawThoughtBubble(ctx, x, y, cellW, cellH, text);
    } else if (textStyle === "shout") {
      const text = [narration, dialogue].filter(Boolean).join(" ");
      if (text) drawShoutBurst(ctx, x, y, cellW, cellH, text);
    } else {
      // Legacy banner / bubble — fall back to mixed-ish behavior
      const text = [narration, dialogue && `「${dialogue}」`].filter(Boolean).join("\n");
      if (!text) continue;
      if (textStyle === "banner") {
        drawCaptionBox(ctx, x + 16, y + cellH - 16 - cellH * 0.3, cellW - 32, text, cellH * 0.3);
      } else {
        drawSpeechBubble(ctx, x, y, cellW, cellH, text);
      }
    }
  }

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
