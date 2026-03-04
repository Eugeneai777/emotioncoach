import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ProductCategory, ProductModule } from '@/data/productCatalog';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`You Jin Life | Product Brochure`, MARGIN, PAGE_H - 10);
  doc.text(`${pageNum} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: 'right' });
  doc.setTextColor(0, 0, 0);
}

function drawCoverPage(doc: jsPDF) {
  // Background gradient effect with rectangles
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  
  doc.setFillColor(251, 191, 36); // amber-400
  doc.rect(0, 0, PAGE_W, PAGE_H * 0.6, 'F');

  // Brand name
  doc.setFontSize(48);
  doc.setTextColor(255, 255, 255);
  doc.text('You Jin Life', PAGE_W / 2, 80, { align: 'center' });

  // Chinese brand name
  doc.setFontSize(28);
  doc.text('You Jin Sheng Huo', PAGE_W / 2, 100, { align: 'center' });

  // Tagline
  doc.setFontSize(16);
  doc.text('AI Coach Platform - Product Brochure', PAGE_W / 2, 130, { align: 'center' });

  // Subtitle
  doc.setFontSize(12);
  doc.text('Emotional Growth | AI Coaching | Training Camps | Assessment Tools', PAGE_W / 2, 150, { align: 'center' });

  // Date
  doc.setFontSize(10);
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  doc.text(`Generated: ${dateStr}`, PAGE_W / 2, PAGE_H - 40, { align: 'center' });

  // Version
  doc.text('Version 1.0', PAGE_W / 2, PAGE_H - 30, { align: 'center' });
}

function drawTableOfContents(doc: jsPDF, categories: ProductCategory[]) {
  doc.addPage();
  
  doc.setFontSize(24);
  doc.setTextColor(30, 30, 30);
  doc.text('Table of Contents', PAGE_W / 2, 40, { align: 'center' });

  let y = 65;
  let moduleIndex = 1;

  categories.forEach((cat) => {
    // Category header
    doc.setFontSize(14);
    doc.setTextColor(245, 158, 11);
    doc.text(`${cat.emoji}  ${cat.name}`, MARGIN, y);
    y += 10;

    // Module list
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    cat.modules.forEach((mod) => {
      doc.text(`${moduleIndex}. ${mod.emoji} ${mod.name} - ${mod.tagline}`, MARGIN + 8, y);
      y += 7;
      moduleIndex++;

      if (y > PAGE_H - 40) {
        doc.addPage();
        y = 30;
      }
    });

    y += 6;
  });
}

function drawModulePage(doc: jsPDF, mod: ProductModule, index: number) {
  doc.addPage();

  // Module header with colored bar
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, PAGE_W, 8, 'F');

  // Module number and emoji
  doc.setFontSize(36);
  doc.setTextColor(245, 158, 11);
  doc.text(mod.emoji, MARGIN, 35);

  // Module name
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(mod.name, MARGIN + 20, 35);

  // Category badge
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`${mod.category}  |  #${index + 1}`, MARGIN + 20, 44);

  // Tagline
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text(mod.tagline, MARGIN, 60);

  // Divider
  doc.setDrawColor(230, 230, 230);
  doc.line(MARGIN, 66, PAGE_W - MARGIN, 66);

  // Description
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const descLines = doc.splitTextToSize(mod.description, CONTENT_W);
  doc.text(descLines, MARGIN, 78);
  let y = 78 + descLines.length * 6 + 10;

  // Highlights section
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Core Highlights', MARGIN, y);
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [['#', 'Feature']],
    body: mod.highlights.map((h, i) => [`${i + 1}`, h]),
    theme: 'striped',
    headStyles: {
      fillColor: [245, 158, 11],
      textColor: [255, 255, 255],
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [60, 60, 60],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: CONTENT_W - 15 },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  // Target audience
  const finalY = (doc as any).lastAutoTable?.finalY || y + 50;
  let audienceY = finalY + 15;

  if (audienceY > PAGE_H - 60) {
    doc.addPage();
    audienceY = 30;
  }

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text('Target Audience', MARGIN, audienceY);
  audienceY += 10;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  mod.targetAudience.forEach((t) => {
    doc.text(`  •  ${t}`, MARGIN, audienceY);
    audienceY += 7;
  });
}

function drawBackCover(doc: jsPDF) {
  doc.addPage();

  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F');

  doc.setFontSize(36);
  doc.setTextColor(245, 158, 11);
  doc.text('You Jin Life', PAGE_W / 2, PAGE_H / 2 - 30, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(200, 200, 200);
  doc.text('AI-Powered Emotional Growth Platform', PAGE_W / 2, PAGE_H / 2, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(150, 150, 150);
  doc.text('Start your growth journey today', PAGE_W / 2, PAGE_H / 2 + 20, { align: 'center' });
  doc.text('feel-name-transform-coach.lovable.app', PAGE_W / 2, PAGE_H / 2 + 35, { align: 'center' });
}

export function generateProductBrochurePdf(categories: ProductCategory[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // 1. Cover
  drawCoverPage(doc);

  // 2. Table of Contents
  drawTableOfContents(doc, categories);

  // 3. Module pages
  let moduleIndex = 0;
  categories.forEach((cat) => {
    cat.modules.forEach((mod) => {
      drawModulePage(doc, mod, moduleIndex);
      moduleIndex++;
    });
  });

  // 4. Back cover
  drawBackCover(doc);

  // Add page numbers (skip cover)
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages - 1; i++) {
    doc.setPage(i);
    addPageFooter(doc, i - 1, totalPages - 2);
  }

  // Save
  const filename = `YouJinLife_Product_Brochure_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(filename);
  return filename;
}
