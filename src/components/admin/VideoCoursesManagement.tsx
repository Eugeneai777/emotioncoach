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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, ExternalLink, Search, Loader2, Upload, FileText, CheckCircle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
  description?: string;
  tags: string[];
  keywords: string[];
  category: string;
  customCategory?: string;
  isValid: boolean;
  error?: string;
}

const COURSE_CATEGORIES = [
  { value: "领导力", label: "领导力", keywords: ["领导", "管理", "团队", "决策"] },
  { value: "情绪管理", label: "情绪管理", keywords: ["情绪", "焦虑", "压力", "心理"] },
  { value: "人际关系", label: "人际关系", keywords: ["人际", "关系", "沟通", "社交"] },
  { value: "个人成长", label: "个人成长", keywords: ["成长", "目标", "习惯", "效率"] },
  { value: "健康生活", label: "健康生活", keywords: ["健康", "运动", "睡眠", "饮食"] },
  { value: "财务管理", label: "财务管理", keywords: ["财务", "理财", "投资", "金钱"] },
];

export const VideoCoursesManagement = () => {
  const [courses, setCourses] = useState<VideoCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingCourse, setEditingCourse] = useState<VideoCourse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    video_url: "",
    description: "",
    keywords: "",
    tags: "",
    category: "",
    source: "manual"
  });
  
  // Batch import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(new Set());
  const [importSource, setImportSource] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [globalCategory, setGlobalCategory] = useState<string>("");
  
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

  // Infer category from tags
  const inferCategory = (tags: string[]): string => {
    const tagText = tags.join(" ").toLowerCase();
    if (tagText.includes("领导") || tagText.includes("管理") || tagText.includes("团队")) {
      return "领导力";
    }
    if (tagText.includes("情绪") || tagText.includes("焦虑") || tagText.includes("压力")) {
      return "情绪管理";
    }
    if (tagText.includes("人际") || tagText.includes("关系") || tagText.includes("沟通")) {
      return "人际关系";
    }
    return "个人成长";
  };

  // Parse markdown file
  const parseMarkdownFile = (content: string): ParsedCourse[] => {
    const courses: ParsedCourse[] = [];
    const lines = content.split("\n");
    let currentCourse: Partial<ParsedCourse> | null = null;
    
    // Extract source from first line if it contains title
    if (lines[0]?.startsWith("#")) {
      const sourceMatch = lines[0].match(/(?:视频知识库|课程列表)[_\s]*(.+)/i);
      if (sourceMatch) {
        setImportSource(sourceMatch[1].trim());
      }
    }
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // New course starts with ## followed by number and title
      if (line.match(/^##\s*\d+\.\s*.+/)) {
        // Save previous course
        if (currentCourse) {
          const isValid = !!(currentCourse.title && currentCourse.video_url);
          courses.push({
            ...currentCourse as ParsedCourse,
            isValid,
            error: isValid ? undefined : "缺少标题或视频链接",
          });
        }
        
        // Start new course
        const title = line.replace(/^##\s*\d+\.\s*/, "").trim();
        currentCourse = {
          title,
          tags: [],
          keywords: [],
        };
      }
      // Extract video link
      else if (line.startsWith("- 视频链接:") || line.startsWith("- **视频链接**:")) {
        if (currentCourse) {
          const urlMatch = line.match(/https?:\/\/[^\s)]+/);
          if (urlMatch) {
            currentCourse.video_url = urlMatch[0];
          }
        }
      }
      // Extract description
      else if (line.startsWith("- 视频介绍:") || line.startsWith("- **视频介绍**:")) {
        if (currentCourse) {
          currentCourse.description = line.replace(/^- \*?\*?视频介绍\*?\*?:\s*/, "").trim();
        }
      }
      // Extract tags
      else if (line.startsWith("- 建议标签:") || line.startsWith("- **建议标签**:")) {
        if (currentCourse) {
          const tagsText = line.replace(/^- \*?\*?建议标签\*?\*?:\s*/, "");
          const tags = tagsText.match(/#[^\s#]+/g)?.map(t => t.replace("#", "")) || [];
          currentCourse.tags = tags;
          currentCourse.keywords = tags;
          currentCourse.category = inferCategory(tags);
        }
      }
    }
    
    // Save last course
    if (currentCourse) {
      const isValid = !!(currentCourse.title && currentCourse.video_url);
      courses.push({
        ...currentCourse as ParsedCourse,
        isValid,
        error: isValid ? undefined : "缺少标题或视频链接",
      });
    }
    
    return courses;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".md")) {
      toast({
        title: "文件格式错误",
        description: "请上传 .md 格式的文件",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const content = await file.text();
      const parsed = parseMarkdownFile(content);
      setParsedCourses(parsed);
      
      // Auto-select all valid courses
      const validIndices = parsed
        .map((_, index) => index)
        .filter(index => parsed[index].isValid);
      setSelectedCourses(new Set(validIndices));
      
      toast({
        title: "解析成功",
        description: `成功解析 ${parsed.length} 个课程，其中 ${validIndices.length} 个有效`,
      });
    } catch (error) {
      console.error("Error parsing file:", error);
      toast({
        title: "解析失败",
        description: "无法解析文件内容",
        variant: "destructive",
      });
    }
  };

  // Handle batch import
  const handleBatchImport = async () => {
    const selectedParsed = parsedCourses
      .filter((_, index) => selectedCourses.has(index) && parsedCourses[index].isValid);
    
    if (selectedParsed.length === 0) {
      toast({
        title: "没有选中课程",
        description: "请至少选择一个有效的课程",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      const coursesToInsert = selectedParsed.map(course => ({
        title: course.title,
        video_url: course.video_url,
        description: course.description || null,
        keywords: course.keywords,
        tags: course.tags,
        category: course.customCategory || course.category,
        source: importSource || "批量导入",
      }));
      
      // Batch insert in chunks of 50 to avoid timeouts
      const chunkSize = 50;
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < coursesToInsert.length; i += chunkSize) {
        const chunk = coursesToInsert.slice(i, i + chunkSize);
        const { error } = await supabase
          .from("video_courses")
          .insert(chunk);
        
        if (error) {
          console.error("Error inserting chunk:", error);
          errorCount += chunk.length;
        } else {
          successCount += chunk.length;
        }
      }
      
      toast({
        title: "导入完成",
        description: `成功导入 ${successCount} 个课程${errorCount > 0 ? `，失败 ${errorCount} 个` : ""}`,
      });
      
      setIsImportDialogOpen(false);
      setParsedCourses([]);
      setSelectedCourses(new Set());
      setImportSource("");
      setGlobalCategory("");
      loadCourses();
    } catch (error) {
      console.error("Error batch importing:", error);
      toast({
        title: "导入失败",
        description: "批量导入过程中发生错误",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Toggle course selection
  const toggleCourseSelection = (index: number) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCourses(newSelected);
  };

  // Toggle all courses
  const toggleAllCourses = () => {
    if (selectedCourses.size === parsedCourses.filter(c => c.isValid).length) {
      setSelectedCourses(new Set());
    } else {
      const allValid = parsedCourses
        .map((_, index) => index)
        .filter(index => parsedCourses[index].isValid);
      setSelectedCourses(new Set(allValid));
    }
  };

  // Update course category
  const updateCourseCategory = (index: number, category: string) => {
    const updated = [...parsedCourses];
    updated[index].customCategory = category;
    setParsedCourses(updated);
  };

  // Batch set category for selected courses
  const batchSetCategory = (category: string) => {
    const updated = [...parsedCourses];
    selectedCourses.forEach(index => {
      updated[index].customCategory = category;
    });
    setParsedCourses(updated);
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
            <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  批量导入
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>批量导入视频课程</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* File upload area */}
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept=".md"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-foreground font-medium mb-2">
                        拖拽 .md 文件到这里
                      </p>
                      <p className="text-sm text-muted-foreground">
                        或点击选择文件
                      </p>
                    </label>
                  </div>
                  
                  {/* Source name input */}
                  {parsedCourses.length > 0 && (
                    <>
                      <div>
                        <Label htmlFor="import-source">来源名称</Label>
                        <Input
                          id="import-source"
                          value={importSource}
                          onChange={(e) => setImportSource(e.target.value)}
                          placeholder="自动提取或手动输入"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="global-category">批量覆盖分类（可选）</Label>
                          <Select value={globalCategory} onValueChange={setGlobalCategory}>
                            <SelectTrigger id="global-category">
                              <SelectValue placeholder="使用自动推断" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">使用自动推断</SelectItem>
                              {COURSE_CATEGORIES.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedCourses.size > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => batchSetCategory(globalCategory || "")}
                            disabled={!globalCategory}
                            className="mt-6"
                          >
                            应用到已选
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                  
                  {/* Parsed courses preview */}
                  {parsedCourses.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">
                          解析预览（共 {parsedCourses.length} 个课程）
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleAllCourses}
                        >
                          {selectedCourses.size === parsedCourses.filter(c => c.isValid).length
                            ? "取消全选"
                            : "全选"}
                        </Button>
                      </div>
                      
                      <div className="border rounded-lg max-h-96 overflow-y-auto">
                          <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={selectedCourses.size === parsedCourses.filter(c => c.isValid).length && selectedCourses.size > 0}
                                  onCheckedChange={toggleAllCourses}
                                />
                              </TableHead>
                              <TableHead className="w-12">状态</TableHead>
                              <TableHead>标题</TableHead>
                              <TableHead className="w-48">分类</TableHead>
                              <TableHead className="text-right">标签数</TableHead>
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
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <div title={course.error}>
                                      <XCircle className="w-4 h-4 text-destructive" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-md truncate">
                                  {course.title}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={course.customCategory || course.category}
                                    onValueChange={(value) => updateCourseCategory(index, value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {COURSE_CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                          {cat.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-right">
                                  {course.tags.length}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          已选择: {selectedCourses.size} 个课程
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsImportDialogOpen(false);
                              setParsedCourses([]);
                              setSelectedCourses(new Set());
                              setImportSource("");
                              setGlobalCategory("");
                            }}
                          >
                            取消
                          </Button>
                          <Button
                            onClick={handleBatchImport}
                            disabled={selectedCourses.size === 0 || isImporting}
                          >
                            {isImporting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                导入中...
                              </>
                            ) : (
                              "导入选中的课程"
                            )}
                          </Button>
                        </div>
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