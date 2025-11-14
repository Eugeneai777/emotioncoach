import { useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileText, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TagType {
  id: string;
  name: string;
  color: string;
}

interface Briefing {
  id: string;
  emotion_theme: string;
  stage_1_content: string | null;
  stage_2_content: string | null;
  stage_3_content: string | null;
  stage_4_content: string | null;
  insight: string | null;
  action: string | null;
  growth_story: string | null;
  emotion_intensity: number | null;
  intensity_reasoning: string | null;
  intensity_keywords: string[] | null;
  created_at: string;
  tags?: TagType[];
}

interface ExportDialogProps {
  briefings: Briefing[];
}

const ExportDialog = ({ briefings }: ExportDialogProps) => {
  const [exportFormat, setExportFormat] = useState<"markdown" | "pdf">("markdown");
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const generateMarkdown = () => {
    let markdown = "# 情绪日记导出\n\n";
    markdown += `导出时间: ${format(new Date(), "yyyy年MM月dd日 HH:mm", { locale: zhCN })}\n`;
    markdown += `简报数量: ${briefings.length}\n\n`;
    markdown += "---\n\n";

    briefings.forEach((briefing, index) => {
      const date = format(new Date(briefing.created_at), "yyyy年MM月dd日 HH:mm", { locale: zhCN });
      
      markdown += `## ${index + 1}. ${briefing.emotion_theme}\n\n`;
      markdown += `**日期**: ${date}\n\n`;
      
      if (briefing.tags && briefing.tags.length > 0) {
        markdown += `**标签**: ${briefing.tags.map(t => t.name).join(", ")}\n\n`;
      }

      markdown += "### 情绪四部曲旅程\n\n";
      
      if (briefing.stage_1_content) {
        markdown += `**1️⃣ 觉察 (Feel it)**\n${briefing.stage_1_content}\n\n`;
      }
      if (briefing.stage_2_content) {
        markdown += `**2️⃣ 理解 (Name it)**\n${briefing.stage_2_content}\n\n`;
      }
      if (briefing.stage_3_content) {
        markdown += `**3️⃣ 看见反应 (Recognize)**\n${briefing.stage_3_content}\n\n`;
      }
      if (briefing.stage_4_content) {
        markdown += `**4️⃣ 转化 (Transform it)**\n${briefing.stage_4_content}\n\n`;
      }

      if (briefing.insight) {
        markdown += `**💡 今日洞察**\n${briefing.insight}\n\n`;
      }
      if (briefing.action) {
        markdown += `**✅ 今日行动**\n${briefing.action}\n\n`;
      }
      if (briefing.growth_story) {
        markdown += `**🌸 今日成长故事**\n${briefing.growth_story}\n\n`;
      }

      markdown += "---\n\n";
    });

    return markdown;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    let yOffset = 20;

    // 添加中文字体支持 (使用系统默认字体)
    doc.setFont("helvetica");
    
    // 标题
    doc.setFontSize(20);
    doc.text("Emotion Journal Export", 105, yOffset, { align: "center" });
    yOffset += 10;

    doc.setFontSize(10);
    const exportDate = format(new Date(), "yyyy-MM-dd HH:mm", { locale: zhCN });
    doc.text(`Export Date: ${exportDate}`, 105, yOffset, { align: "center" });
    yOffset += 5;
    doc.text(`Total Briefings: ${briefings.length}`, 105, yOffset, { align: "center" });
    yOffset += 15;

    briefings.forEach((briefing, index) => {
      // 检查是否需要新页
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      const date = format(new Date(briefing.created_at), "yyyy-MM-dd HH:mm", { locale: zhCN });
      
      // 简报标题
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      const title = `${index + 1}. ${briefing.emotion_theme}`;
      doc.text(title, 20, yOffset);
      yOffset += 8;

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${date}`, 20, yOffset);
      yOffset += 6;

      if (briefing.tags && briefing.tags.length > 0) {
        const tags = briefing.tags.map(t => t.name).join(", ");
        doc.text(`Tags: ${tags}`, 20, yOffset);
        yOffset += 6;
      }

      yOffset += 3;

      // 四部曲内容
      const stages = [
        { label: "1. Feel it", content: briefing.stage_1_content },
        { label: "2. Name it", content: briefing.stage_2_content },
        { label: "3. Recognize", content: briefing.stage_3_content },
        { label: "4. Transform it", content: briefing.stage_4_content },
      ];

      stages.forEach((stage) => {
        if (stage.content) {
          if (yOffset > 250) {
            doc.addPage();
            yOffset = 20;
          }
          
          doc.setFont("helvetica", "bold");
          doc.text(stage.label, 20, yOffset);
          yOffset += 5;
          
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(stage.content, 170);
          doc.text(lines, 20, yOffset);
          yOffset += lines.length * 5 + 3;
        }
      });

      // 洞察和行动
      if (briefing.insight) {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Insight:", 20, yOffset);
        yOffset += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(briefing.insight, 170);
        doc.text(lines, 20, yOffset);
        yOffset += lines.length * 5 + 3;
      }

      if (briefing.action) {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Action:", 20, yOffset);
        yOffset += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(briefing.action, 170);
        doc.text(lines, 20, yOffset);
        yOffset += lines.length * 5 + 3;
      }

      if (briefing.growth_story) {
        if (yOffset > 250) {
          doc.addPage();
          yOffset = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Growth Story:", 20, yOffset);
        yOffset += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(briefing.growth_story, 170);
        doc.text(lines, 20, yOffset);
        yOffset += lines.length * 5 + 3;
      }

      yOffset += 10; // 简报之间的间距
    });

    return doc;
  };

  const handleExport = async () => {
    if (briefings.length === 0) {
      toast({
        title: "无法导出",
        description: "没有可导出的简报",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

      if (exportFormat === "markdown") {
        const markdown = generateMarkdown();
        const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `emotion_journal_${timestamp}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const doc = generatePDF();
        doc.save(`emotion_journal_${timestamp}.pdf`);
      }

      toast({
        title: "导出成功 🌿",
        description: `情绪日记已导出为 ${exportFormat === "markdown" ? "Markdown" : "PDF"} 格式`,
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "导出失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="w-4 h-4" />
          导出
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导出情绪日记</DialogTitle>
          <DialogDescription>
            选择导出格式，将你的情绪简报保存到本地
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <RadioGroup value={exportFormat} onValueChange={(value) => setExportFormat(value as "markdown" | "pdf")}>
            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="markdown" id="markdown" />
              <Label
                htmlFor="markdown"
                className="flex-1 cursor-pointer flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Markdown</div>
                  <div className="text-sm text-muted-foreground">
                    纯文本格式，易于编辑和阅读
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors">
              <RadioGroupItem value="pdf" id="pdf" />
              <Label
                htmlFor="pdf"
                className="flex-1 cursor-pointer flex items-center gap-3"
              >
                <File className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">PDF</div>
                  <div className="text-sm text-muted-foreground">
                    专业格式，适合打印和分享
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="text-sm text-muted-foreground">
            将导出 {briefings.length} 条简报记录
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "导出中..." : "确认导出"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
