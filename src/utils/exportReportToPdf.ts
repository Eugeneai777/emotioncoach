/**
 * 把一个 DOM 节点导出成多页 A4 PDF（jsPDF + html2canvas）。
 * 仅用于"保存私密完整报告"场景；微信内不应调用（由上层引导跳浏览器）。
 */
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ExportPdfOptions {
  /** 文件名（不含 .pdf 后缀） */
  filename?: string;
  /** 渲染比例，默认 2 (清晰度优先；3 在低端机会爆内存) */
  scale?: number;
}

/**
 * 把节点导出为 A4 PDF 并触发下载。
 * 浏览器环境直接 pdf.save 触发下载；微信环境不应调用此函数。
 */
export async function exportNodeToPdf(
  node: HTMLElement,
  options: ExportPdfOptions = {},
): Promise<void> {
  const { filename = `report-${Date.now()}`, scale = 2 } = options;

  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    // 保留隐藏定位的节点
    onclone: (doc) => {
      const all = doc.querySelectorAll<HTMLElement>("[data-export-root]");
      all.forEach((el) => {
        el.style.position = "static";
        el.style.left = "0";
        el.style.top = "0";
      });
    },
  });

  // A4 595.28pt × 841.89pt（jsPDF 默认 pt 单位）
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // 将 canvas 等比缩放到页面宽度
  const ratio = pageW / canvas.width;
  const fullH = canvas.height * ratio;

  if (fullH <= pageH) {
    // 单页
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, fullH);
  } else {
    // 多页切割：每页对应 canvas 上的一段像素高度
    const pageCanvasH = pageH / ratio; // 在原始 canvas 像素中的每页高度
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
      ctx.drawImage(
        canvas,
        0, renderedH, canvas.width, sliceH,
        0, 0, canvas.width, sliceH,
      );
      const imgData = sliceCanvas.toDataURL("image/jpeg", 0.92);
      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, pageW, sliceH * ratio);
      renderedH += sliceH;
      pageIndex += 1;
    }
  }

  pdf.save(`${filename}.pdf`);
}
