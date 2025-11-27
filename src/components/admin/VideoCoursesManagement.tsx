import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ExternalLink, Search, Loader2, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface VideoCourse {
  id: string;
  title: string;
  video_url: string;
  description?: string;
  keywords?: string[];
  tags?: string[];
  source: string;
  category?: string;
  created_at: string;
}

interface ParsedCourse {
  title: string;
  video_url: string;
  description: string;
  tags: string[];
  category: string;
  keywords: string[];
  isValid: boolean;
  errorMessage?: string;
}

export const VideoCoursesManagement = () => {
  const [courses, setCourses] = useState<VideoCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCourse, setEditingCourse] = useState<VideoCourse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [importSource, setImportSource] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    description: "",
    keywords: "",
    tags: "",
    category: "",
    source: "manual"
  });
  const { toast } = useToast();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("video_courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "加载失败",
        description: "无法加载视频课程列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const courseData = {
        title: formData.title,
        video_url: formData.video_url,
        description: formData.description || null,
        keywords: formData.keywords ? formData.keywords.split(",").map(k => k.trim()) : [],
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        category: formData.category || null,
        source: formData.source
      };

      if (editingCourse) {
        const { error } = await supabase
          .from("video_courses")
          .update(courseData)
          .eq("id", editingCourse.id);

        if (error) throw error;
        
        toast({
          title: "更新成功",
          description: "视频课程已更新",
        });
      } else {
        const { error } = await supabase
          .from("video_courses")
          .insert(courseData);

        if (error) throw error;
        
        toast({
          title: "添加成功",
          description: "新视频课程已添加",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "保存失败",
        description: "无法保存视频课程",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个视频课程吗？")) return;

    try {
      const { error } = await supabase
        .from("video_courses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: "视频课程已删除",
      });
      loadCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "删除失败",
        description: "无法删除视频课程",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (course: VideoCourse) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      video_url: course.video_url,
      description: course.description || "",
      keywords: course.keywords?.join(", ") || "",
      tags: course.tags?.join(", ") || "",
      category: course.category || "",
      source: course.source
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      video_url: "",
      description: "",
      keywords: "",
      tags: "",
      category: "",
      source: "manual"
    });
  };

  const inferCategory = (tags: string[]): string => {
    const tagText = tags.join(" ").toLowerCase();
    if (tagText.includes("领导力") || tagText.includes("管理")) return "领导力";
    if (tagText.includes("情绪") || tagText.includes("心理")) return "情绪管理";
    if (tagText.includes("关系") || tagText.includes("人际")) return "人际关系";
    if (tagText.includes("成长") || tagText.includes("自我")) return "个人成长";
    return "其他";
  };

  const parseMarkdownFile = (content: string): ParsedCourse[] => {
    const courses: ParsedCourse[] = [];
    const sections = content.split(/(?=^##\s+\d+\.)/gm);
    
    // Extract source from title (first line)
    const firstLine = content.split('\n')[0];
    const sourceMatch = firstLine.match(/^#\s+视频知识库:\s*(.+)$/);
    if (sourceMatch && !importSource) {
      setImportSource(sourceMatch[1].trim());
    }

    sections.forEach(section => {
      if (!section.trim() || !section.startsWith('##')) return;

      const lines = section.split('\n').map(l => l.trim()).filter(l => l);
      
      // Parse title
      const titleMatch = lines[0].match(/^##\s+\d+\.\s*(.+)$/);
      if (!titleMatch) return;
      const title = titleMatch[1].trim();

      // Parse video link
      const videoLine = lines.find(l => l.startsWith('- 视频链接:'));
      const videoMatch = videoLine?.match(/- 视频链接:\s*(.+)$/);
      const video_url = videoMatch?.[1].trim() || "";

      // Parse description
      const descLine = lines.find(l => l.startsWith('- 视频介绍:'));
      const descMatch = descLine?.match(/- 视频介绍:\s*(.+)$/);
      const description = descMatch?.[1].trim() || "";

      // Parse tags
      const tagsLine = lines.find(l => l.startsWith('- 建议标签:'));
      const tagsMatch = tagsLine?.match(/- 建议标签:\s*(.+)$/);
      const tagsText = tagsMatch?.[1] || "";
      const tags = tagsText
        .split(/\s+/)
        .filter(t => t.startsWith('#'))
        .map(t => t.replace(/^#/, '').trim())
        .filter(t => t.length > 0);

      // Extract keywords from description and tags
      const keywords = [...new Set([
        ...tags.slice(0, 5),
        ...description.split(/[，。！？\s]+/).slice(0, 3)
      ])].slice(0, 8);

      // Infer category
      const category = inferCategory(tags);

      // Validate
      const isValid = !!(title && video_url);
      const errorMessage = !title ? "缺少标题" : !video_url ? "缺少视频链接" : undefined;

      courses.push({
        title,
        video_url,
        description,
        tags,
        keywords,
        category,
        isValid,
        errorMessage
      });
    });

    return courses;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      toast({
        title: "文件格式错误",
        description: "请上传 .md 格式的 Markdown 文件",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseMarkdownFile(content);
      setParsedCourses(parsed);
      
      // Select all valid courses by default
      const validIndices = new Set(
        parsed.map((_, idx) => idx).filter(idx => parsed[idx].isValid)
      );
      setSelectedCourses(validIndices);

      toast({
        title: "解析成功",
        description: `成功解析 ${parsed.length} 个课程，其中 ${parsed.filter(c => c.isValid).length} 个有效`,
      });
    };
    reader.readAsText(file);
  };

  const handleBatchImport = async () => {
    if (selectedCourses.size === 0) {
      toast({
        title: "请选择课程",
        description: "请至少选择一个课程进行导入",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const coursesToImport = Array.from(selectedCourses)
      .map(idx => parsedCourses[idx])
      .filter(c => c.isValid);

    const batchSize = 50;
    let successCount = 0;
    let failCount = 0;

    try {
      for (let i = 0; i < coursesToImport.length; i += batchSize) {
        const batch = coursesToImport.slice(i, i + batchSize);
        const insertData = batch.map(course => ({
          title: course.title,
          video_url: course.video_url,
          description: course.description || null,
          keywords: course.keywords,
          tags: course.tags,
          category: course.category || null,
          source: importSource || "批量导入"
        }));

        const { error } = await supabase
          .from("video_courses")
          .insert(insertData);

        if (error) {
          console.error("Batch insert error:", error);
          failCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      toast({
        title: "导入完成",
        description: `成功导入 ${successCount} 个课程${failCount > 0 ? `，失败 ${failCount} 个` : ""}`,
      });

      setIsImportDialogOpen(false);
      setParsedCourses([]);
      setSelectedCourses(new Set());
      setImportSource("");
      loadCourses();
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "导入失败",
        description: "批量导入过程中出现错误",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const toggleCourseSelection = (index: number) => {
    const newSelection = new Set(selectedCourses);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedCourses(newSelection);
  };

  const toggleAllCourses = () => {
    if (selectedCourses.size === parsedCourses.filter(c => c.isValid).length) {
      setSelectedCourses(new Set());
    } else {
      const allValid = new Set(
        parsedCourses.map((_, idx) => idx).filter(idx => parsedCourses[idx].isValid)
      );
      setSelectedCourses(allValid);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">视频课程管理</h2>
            <p className="text-sm text-muted-foreground mt-1">
              共 {courses.length} 个课程
            </p>
          </div>
          
          <div className="flex gap-2">
            <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
              setIsImportDialogOpen(open);
              if (!open) {
                setParsedCourses([]);
                setSelectedCourses(new Set());
                setImportSource("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  批量导入
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>批量导入视频课程</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {parsedCourses.length === 0 ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium mb-2">上传 Markdown 文件</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          支持 .md 格式，文件将被解析为视频课程列表
                        </p>
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                            <Upload className="w-4 h-4" />
                            选择文件
                          </div>
                        </Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".md"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm font-medium mb-2">文件格式示例：</p>
                        <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
{`# 视频知识库: 绽放公开课

## 1. 课程标题
- 视频链接: https://example.com/video1
- 视频介绍: 课程描述内容...
- 建议标签: #标签1 #标签2 #标签3`}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="source">来源名称</Label>
                        <Input
                          id="source"
                          value={importSource}
                          onChange={(e) => setImportSource(e.target.value)}
                          placeholder="例如：绽放公开课"
                        />
                      </div>

                      <div className="border rounded-lg">
                        <div className="bg-muted px-4 py-3 flex items-center justify-between border-b">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedCourses.size === parsedCourses.filter(c => c.isValid).length && parsedCourses.filter(c => c.isValid).length > 0}
                              onCheckedChange={toggleAllCourses}
                            />
                            <span className="font-medium">
                              解析预览 (共 {parsedCourses.length} 个课程，
                              已选择 {selectedCourses.size} 个)
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setParsedCourses([]);
                              setSelectedCourses(new Set());
                            }}
                          >
                            重新上传
                          </Button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead className="w-12">状态</TableHead>
                                <TableHead>标题</TableHead>
                                <TableHead>分类</TableHead>
                                <TableHead>标签数</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {parsedCourses.map((course, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedCourses.has(index)}
                                      onCheckedChange={() => toggleCourseSelection(index)}
                                      disabled={!course.isValid}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    {course.isValid ? (
                                      <CheckCircle className="w-4 h-4 text-success" />
                                    ) : (
                                      <XCircle className="w-4 h-4 text-destructive" title={course.errorMessage} />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-md">
                                      <p className={`font-medium truncate ${!course.isValid ? 'text-muted-foreground' : ''}`}>
                                        {course.title || "（无标题）"}
                                      </p>
                                      {course.errorMessage && (
                                        <p className="text-xs text-destructive">{course.errorMessage}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{course.category}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">{course.tags.length}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={handleBatchImport}
                          disabled={isImporting || selectedCourses.size === 0}
                          className="flex-1"
                        >
                          {isImporting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              导入中...
                            </>
                          ) : (
                            `导入选中的课程 (${selectedCourses.size})`
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsImportDialogOpen(false)}
                          disabled={isImporting}
                        >
                          取消
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  添加课程
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? "编辑视频课程" : "添加新视频课程"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">课程标题 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="输入课程标题"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="video_url">视频链接 *</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">课程描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="输入课程描述"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">分类</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="例如：情绪管理、领导力"
                  />
                </div>
                
                <div>
                  <Label htmlFor="keywords">关键词（用逗号分隔）</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="例如：焦虑, 压力, 情绪"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags">标签（用逗号分隔）</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="例如：情绪管理, 个人成长"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCourse ? "更新" : "添加"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    取消
                  </Button>
                </div>
              </form>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索课程标题、描述或分类..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>标签</TableHead>
                <TableHead>来源</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchTerm ? "没有找到匹配的课程" : "还没有添加任何课程"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="max-w-md">
                        <p className="font-medium text-foreground truncate">
                          {course.title}
                        </p>
                        {course.description && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {course.category && (
                        <Badge variant="secondary">{course.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {course.tags?.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {course.tags && course.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{course.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={course.source === "manual" ? "default" : "secondary"}>
                        {course.source === "manual" ? "手动添加" : course.source}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(course.video_url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};