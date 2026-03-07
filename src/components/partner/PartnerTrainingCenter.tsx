import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, MessageSquare, Target, Lightbulb, ChevronDown, ChevronUp, Loader2, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PartnerTrainingCenterProps {
  partnerId?: string;
}

interface Resource {
  id: string;
  title: string;
  category: string;
  content: string | null;
  tags: string[];
  view_count: number;
  created_at: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  guide: { label: "运营指南", icon: <BookOpen className="h-4 w-4" />, color: "text-blue-600" },
  script: { label: "话术模板", icon: <MessageSquare className="h-4 w-4" />, color: "text-emerald-600" },
  case_study: { label: "成功案例", icon: <Target className="h-4 w-4" />, color: "text-amber-600" },
  best_practice: { label: "最佳实践", icon: <Lightbulb className="h-4 w-4" />, color: "text-purple-600" },
};

// Built-in resources for when DB is empty
const BUILTIN_RESOURCES: Omit<Resource, "id" | "created_at" | "view_count">[] = [
  {
    title: "新合伙人快速上手指南",
    category: "guide",
    tags: ["入门", "必读"],
    content: `## 🚀 快速上手

### 第一步：完善个人信息
- 设置公司名称和展示信息
- 上传品牌Logo和介绍

### 第二步：生成推广链接
- 前往「推广链接」创建你的专属推广码
- 分享给潜在学员，自动追踪归属

### 第三步：创建营销活动
- 使用「创建活动」模块发布推广内容
- 利用「AI文案」一键生成各平台文案

### 第四步：跟进学员转化
- 查看「学员管理」了解转化情况
- 开启「跟进提醒」不错过任何转化机会

> 💡 建议：先体验所有AI工具的功能，再制定推广策略`,
  },
  {
    title: "朋友圈推广话术集锦",
    category: "script",
    tags: ["朋友圈", "文案"],
    content: `## 📱 朋友圈推广话术

### 场景一：痛点共鸣型
> 你有没有过这样的时刻——明明很努力，却总觉得差了点什么？
> 
> 也许不是你不够好，而是还没找到那个"关键开关"。
> 
> 👉 试试这个情绪管理工具，帮你找到答案

### 场景二：成果展示型
> 又一位学员反馈："坚持打卡21天，和家人的关系真的改善了！"
> 
> 改变不需要翻天覆地，从每天5分钟开始 🌱
> 
> 扫码体验 👇

### 场景三：限时福利型
> 🎁 本周限时福利！
> 
> 情绪管理21天训练营，原价¥399，前20名仅需¥199
> 
> 名额有限，扫码抢位 ⏰

### 发布建议
- 频率：每天1-2条，不要刷屏
- 时间：早8-9点、午12-1点、晚8-10点效果最佳
- 配图：真实感受 > 精美海报`,
  },
  {
    title: "学员转化最佳实践",
    category: "best_practice",
    tags: ["转化", "策略"],
    content: `## 🎯 转化率提升指南

### 黄金48小时法则
学员注册后的48小时是转化黄金期：
1. **第1小时**：发送欢迎消息，引导体验核心功能
2. **第24小时**：分享一个简短的成功案例
3. **第48小时**：提供限时体验优惠

### 标签分层管理
- 🔵 潜客：关注但未注册
- 🟡 体验：已注册未付费
- 🟢 付费：已购买基础产品
- ⭐ 忠实：复购或推荐他人

### 复购策略
- 基础包到期前7天主动跟进
- 提供升级套餐优惠
- 利用社群建立持续连接

### 数据驱动
- 每周查看渠道数据，优化投放
- 重点关注转化率而非曝光量
- A/B测试不同话术和内容`,
  },
  {
    title: "小红书运营案例分析",
    category: "case_study",
    tags: ["小红书", "运营"],
    content: `## 📕 小红书运营案例

### 案例：合伙人A的月收入突破5万

**背景**：心理咨询师，粉丝3000+

**策略**：
1. 每周发布3篇高质量笔记
2. 选题聚焦"职场情绪管理"垂直领域
3. 每篇笔记附带体验链接

**内容模板**：
- 标题公式：数字+痛点+解决方案
- 示例："工作5年才明白的3个情绪管理技巧（附免费工具）"

**结果**：
- 月均笔记浏览量：50,000+
- 月新增学员：80+
- 月转化收入：¥52,000

**关键经验**：
> "不要硬推产品，而是分享真实的改变。读者能感受到真诚。"`,
  },
];

export function PartnerTrainingCenter({ partnerId }: PartnerTrainingCenterProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("partner_training_resources")
        .select("*")
        .eq("is_published", true)
        .order("display_order", { ascending: true });

      if (data && data.length > 0) {
        setResources(data as Resource[]);
      } else {
        // Use built-in resources
        setResources(
          BUILTIN_RESOURCES.map((r, i) => ({
            ...r,
            id: `builtin-${i}`,
            created_at: new Date().toISOString(),
            view_count: 0,
          }))
        );
      }
    } catch (err) {
      console.error("Load resources error:", err);
      // Fallback to built-in
      setResources(
        BUILTIN_RESOURCES.map((r, i) => ({
          ...r,
          id: `builtin-${i}`,
          created_at: new Date().toISOString(),
          view_count: 0,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Track view
      if (!id.startsWith("builtin-")) {
        await supabase
          .from("partner_training_resources")
          .update({ view_count: resources.find((r) => r.id === id)?.view_count ?? 0 + 1 })
          .eq("id", id);
      }
    }
  };

  const filteredResources = activeCategory === "all" ? resources : resources.filter((r) => r.category === activeCategory);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">📚 合伙人培训中心</h3>

      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1 text-xs">全部</TabsTrigger>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
            <TabsTrigger key={key} value={key} className="flex-1 text-xs gap-1">
              {cfg.icon}
              <span className="hidden sm:inline">{cfg.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filteredResources.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">暂无内容</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredResources.map((resource) => {
            const cfg = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.guide;
            const isExpanded = expandedId === resource.id;

            return (
              <Card key={resource.id} className="overflow-hidden">
                <button
                  className="w-full text-left p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(resource.id)}
                >
                  <div className={`mt-0.5 ${cfg.color}`}>{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{resource.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {cfg.label}
                      </Badge>
                    </div>
                    {resource.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {resource.tags.map((tag) => (
                          <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {resource.view_count > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {resource.view_count}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && resource.content && (
                  <div className="border-t border-border px-4 py-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{resource.content}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
