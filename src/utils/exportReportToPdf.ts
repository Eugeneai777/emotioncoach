/**
 * 把一个 DOM 节点导出成多页 A4 PDF（jsPDF + html2canvas）。
 * 优先策略：若节点内含多个 [data-page] 子节点，则逐页截图，1 页 1 图，
 * 与设计稿 1:1 对齐，彻底避免内容跨页截断；否则回退到整体长图切片。
 */
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportPdfOptions {
  filename?: string;
  scale?: number;
}

async function snapshot(el: HTMLElement, scale: number) {
  return html2canvas(el, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });
}

export async function exportNodeToPdf(
  node: HTMLElement,
  options: ExportPdfOptions = {},
): Promise<void> {
  const { filename = `report-${Date.now()}`, scale = 2 } = options;

  // 给 layout 两个 RAF 稳定下来
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r as any)));

  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const pageNodes = Array.from(node.querySelectorAll<HTMLElement>("[data-page]"));

  if (pageNodes.length > 0) {
    // 逐页：每个 [data-page] 节点单独截图为 1 张 A4
    for (let i = 0; i < pageNodes.length; i++) {
      const canvas = await snapshot(pageNodes[i], scale);
      // 等比缩到 A4 宽度；若高度超出，按高度缩，居中
      const ratioW = pageW / canvas.width;
      const fittedH = canvas.height * ratioW;
      let drawW = pageW;
      let drawH = fittedH;
      let offsetY = 0;
      if (fittedH > pageH) {
        const ratioH = pageH / canvas.height;
        drawH = pageH;
        drawW = canvas.width * ratioH;
      } else {
        offsetY = 0; // 顶部对齐，避免拉伸
      }
      const offsetX = (pageW - drawW) / 2;
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", offsetX, offsetY, drawW, drawH);
    }
  } else {
    // 回退：整体长图 + 切片
    const canvas = await snapshot(node, scale);
    const ratio = pageW / canvas.width;
    const fullH = canvas.height * ratio;
    if (fullH <= pageH) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, fullH);
    } else {
      const pageCanvasH = pageH / ratio;
      let renderedH = 0;
      let pageIndex = 0;
      while (renderedH < canvas.height) {
        const sliceH = Math.min(pageCanvasH, canvas.height - renderedH);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context not available");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, renderedH, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, pageW, sliceH * ratio);
        renderedH += sliceH;
        pageIndex += 1;
      }
    }
  }

  pdf.save(`${filename}.pdf`);
}
