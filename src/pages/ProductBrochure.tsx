import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { productCatalog, ProductCategory } from "@/data/productCatalog";
import { generateProductBrochurePdf } from "@/utils/productBrochurePdf";

const ProductBrochure = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(productCatalog.map(c => c.id))
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedCategories(new Set(productCatalog.map(c => c.id)));
  const selectNone = () => setSelectedCategories(new Set());

  const handleDownload = async () => {
    const selected = productCatalog.filter(c => selectedCategories.has(c.id));
    if (selected.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    setIsGenerating(true);
    try {
      // Use setTimeout to let UI update
      await new Promise(resolve => setTimeout(resolve, 100));
      const filename = generateProductBrochurePdf(selected);
      toast.success(`PDF generated: ${filename}`);
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const totalModules = productCatalog
    .filter(c => selectedCategories.has(c.id))
    .reduce((sum, c) => sum + c.modules.length, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">产品手册下载</h1>
          <p className="text-sm text-muted-foreground">选择要包含的产品模块，生成PDF宣传册</p>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-100">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-foreground">已选 {selectedCategories.size} 个分类</p>
                <p className="text-sm text-muted-foreground">共 {totalModules} 个产品模块</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">全选</Button>
              <Button variant="outline" size="sm" onClick={selectNone} className="text-xs">清空</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category list */}
      <div className="space-y-3 mb-6">
        {productCatalog.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card
              className={`cursor-pointer transition-all border ${
                selectedCategories.has(cat.id)
                  ? 'border-amber-400 bg-amber-50/50 shadow-sm'
                  : 'border-border bg-card'
              }`}
              onClick={() => toggleCategory(cat.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedCategories.has(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{cat.emoji}</span>
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-xs text-muted-foreground">({cat.modules.length} 个产品)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.modules.map(mod => (
                        <span
                          key={mod.id}
                          className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                        >
                          {mod.emoji} {mod.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Download button - fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Button
          onClick={handleDownload}
          disabled={isGenerating || selectedCategories.size === 0}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl shadow-lg text-base"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              正在生成PDF...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              下载产品手册 PDF ({totalModules} 个产品)
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProductBrochure;
