import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Copy, Check, FileText, Code, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const EmotionButtonApiDocs = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/emotion-button-api`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopied(null), 2000);
  };

  const generateWordDoc = () => {
    const docContent = `
情绪按钮 API 接口文档
====================

版本: 1.0.0
更新日期: ${new Date().toLocaleDateString('zh-CN')}

一、接口概述
-----------

情绪按钮系统提供基于神经科学的即时情绪稳定工具，包含9种情绪类型，每种情绪配有32条专业认知提醒（分为4个阶段），共计288条提醒。

科学理论基础：
• 多迷走神经理论 (Stephen Porges) - 解释身体安全感与神经调节
• 认知行为疗法 CBT (Aaron Beck) - 认知重构改变情绪反应
• 自我效能理论 (Albert Bandura) - 自我肯定语句增强信心
• 安全学习理论 (Michelle Craske) - 重复安全体验重塑神经通路

二、接口地址
-----------

基础URL: ${baseUrl}

三、请求方式
-----------

GET 请求，无需认证

四、接口列表
-----------

1. 获取全部情绪数据
   请求: GET ${baseUrl}
   
2. 获取单个情绪数据
   请求: GET ${baseUrl}?emotion_id={emotion_id}
   可用的 emotion_id: panic, worry, negative, fear, irritable, stress, powerless, collapse, lost

3. 数据格式参数
   参数: format
   可选值:
   • full (默认) - 完整数据，包含颜色、阶段、提醒
   • simple - 简化数据，仅基本信息和颜色
   • reminders_only - 仅提醒文本

五、响应数据结构
---------------

{
  "api_version": "1.0.0",
  "total_emotions": 9,
  "total_reminders": 288,
  "stages": [
    {
      "name": "觉察",
      "english_name": "Feel it",
      "description": "感受并命名情绪",
      "reminder_count": 8
    },
    ...
  ],
  "scientific_basis": {
    "theories": [
      {
        "name": "多迷走神经理论",
        "author": "Stephen Porges",
        "description": "解释身体安全感与神经调节"
      },
      ...
    ]
  },
  "emotions": [
    {
      "id": "panic",
      "title": "恐慌",
      "subtitle": "心跳快了，但你依然安全",
      "emoji": "😰",
      "colors": {
        "gradient": { "from": "#14B8A6", "to": "#059669" },
        "background": { "from": "#F0FDFA", "via": "#ECFEFF", "to": "#EFF6FF" },
        "stages": {
          "primary": "#14B8A6",
          "secondary": "#06B6D4",
          "tertiary": "#3B82F6",
          "quaternary": "#6366F1"
        }
      },
      "stages": [
        {
          "stage_number": 1,
          "name": "觉察",
          "english_name": "Feel it",
          "description": "感受并命名情绪",
          "color": "#14B8A6",
          "reminders": [
            "我现在的身体反应是正常的警报，不是危险。",
            ...
          ]
        },
        ...
      ],
      "total_reminders": 32
    },
    ...
  ]
}

六、9种情绪类型
--------------

1. panic (恐慌) 😰 - 心跳快了，但你依然安全
2. worry (担心) 🤔 - 脑子转很快，但你不需要马上解决
3. negative (负面) 😔 - 你不是负面，你只是累了
4. fear (恐惧) 😨 - 害怕很正常，你仍然可以往前一点点
5. irritable (烦躁) 😤 - 不是你不好，是你装太多了
6. stress (压力) 😩 - 你不是弱，你是承担太多太久
7. powerless (无力) 😶 - 你不是没用，你只是耗尽了
8. collapse (崩溃) 😭 - 你到了极限，但这不是终点
9. lost (失落) 😞 - 你失去了什么，但你依然完整

七、4个阶段说明
--------------

每种情绪包含4个阶段，每阶段8条提醒：

1. 觉察 (Feel it) - 感受并命名情绪，提醒索引 0-7
2. 理解 (Understand) - 理解情绪背后的原因，提醒索引 8-15
3. 稳定 (Stabilize) - 通过呼吸和行动稳定身心，提醒索引 16-23
4. 转化 (Transform) - 转化情绪为成长力量，提醒索引 24-31

八、使用示例
-----------

JavaScript:
\`\`\`javascript
// 获取全部数据
const response = await fetch('${baseUrl}');
const data = await response.json();

// 获取单个情绪
const panic = await fetch('${baseUrl}?emotion_id=panic');
const panicData = await panic.json();

// 仅获取提醒文本
const reminders = await fetch('${baseUrl}?format=reminders_only');
const reminderData = await reminders.json();
\`\`\`

九、注意事项
-----------

• 所有认知提醒使用第一人称"我"进行自我对话
• 颜色值为HEX格式，可直接用于CSS
• 接口无需认证，可直接调用
• 建议缓存数据，减少重复请求

十、联系方式
-----------

如有问题，请联系开发团队。

---
© ${new Date().getFullYear()} 情绪按钮系统 - 基于神经科学的即时情绪稳定工具
    `.trim();

    // 创建 Word 文档（使用简单的 HTML 转 Word 方式）
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>情绪按钮 API 接口文档</title>
<style>
body { font-family: 'Microsoft YaHei', SimSun, sans-serif; line-height: 1.8; padding: 40px; }
h1 { color: #0D9488; border-bottom: 2px solid #0D9488; padding-bottom: 10px; }
h2 { color: #0891B2; margin-top: 30px; }
pre { background: #F1F5F9; padding: 15px; border-radius: 8px; overflow-x: auto; }
code { background: #E2E8F0; padding: 2px 6px; border-radius: 4px; }
table { border-collapse: collapse; width: 100%; margin: 20px 0; }
th, td { border: 1px solid #CBD5E1; padding: 10px; text-align: left; }
th { background: #F1F5F9; }
.badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; margin: 2px; }
</style>
</head>
<body>
<h1>🆘 情绪按钮 API 接口文档</h1>
<p><strong>版本:</strong> 1.0.0 | <strong>更新日期:</strong> ${new Date().toLocaleDateString('zh-CN')}</p>

<h2>一、接口概述</h2>
<p>情绪按钮系统提供基于神经科学的即时情绪稳定工具，包含<strong>9种情绪类型</strong>，每种情绪配有<strong>32条专业认知提醒</strong>（分为4个阶段），共计<strong>288条提醒</strong>。</p>

<h3>科学理论基础</h3>
<ul>
<li><strong>多迷走神经理论</strong> (Stephen Porges) - 解释身体安全感与神经调节</li>
<li><strong>认知行为疗法 CBT</strong> (Aaron Beck) - 认知重构改变情绪反应</li>
<li><strong>自我效能理论</strong> (Albert Bandura) - 自我肯定语句增强信心</li>
<li><strong>安全学习理论</strong> (Michelle Craske) - 重复安全体验重塑神经通路</li>
</ul>

<h2>二、接口地址</h2>
<p><code>${baseUrl}</code></p>

<h2>三、请求方式</h2>
<p>GET 请求，无需认证</p>

<h2>四、接口列表</h2>
<table>
<tr><th>功能</th><th>请求地址</th><th>说明</th></tr>
<tr><td>获取全部数据</td><td><code>GET ${baseUrl}</code></td><td>返回9种情绪的完整数据</td></tr>
<tr><td>获取单个情绪</td><td><code>GET ${baseUrl}?emotion_id={id}</code></td><td>id可选: panic, worry, negative, fear, irritable, stress, powerless, collapse, lost</td></tr>
<tr><td>简化格式</td><td><code>GET ${baseUrl}?format=simple</code></td><td>仅返回基本信息和颜色</td></tr>
<tr><td>仅提醒文本</td><td><code>GET ${baseUrl}?format=reminders_only</code></td><td>仅返回提醒内容</td></tr>
</table>

<h2>五、9种情绪类型</h2>
<table>
<tr><th>ID</th><th>名称</th><th>Emoji</th><th>副标题</th></tr>
<tr><td>panic</td><td>恐慌</td><td>😰</td><td>心跳快了，但你依然安全</td></tr>
<tr><td>worry</td><td>担心</td><td>🤔</td><td>脑子转很快，但你不需要马上解决</td></tr>
<tr><td>negative</td><td>负面</td><td>😔</td><td>你不是负面，你只是累了</td></tr>
<tr><td>fear</td><td>恐惧</td><td>😨</td><td>害怕很正常，你仍然可以往前一点点</td></tr>
<tr><td>irritable</td><td>烦躁</td><td>😤</td><td>不是你不好，是你装太多了</td></tr>
<tr><td>stress</td><td>压力</td><td>😩</td><td>你不是弱，你是承担太多太久</td></tr>
<tr><td>powerless</td><td>无力</td><td>😶</td><td>你不是没用，你只是耗尽了</td></tr>
<tr><td>collapse</td><td>崩溃</td><td>😭</td><td>你到了极限，但这不是终点</td></tr>
<tr><td>lost</td><td>失落</td><td>😞</td><td>你失去了什么，但你依然完整</td></tr>
</table>

<h2>六、4个阶段说明</h2>
<table>
<tr><th>阶段</th><th>英文名</th><th>描述</th><th>提醒索引</th></tr>
<tr><td>觉察</td><td>Feel it</td><td>感受并命名情绪</td><td>0-7</td></tr>
<tr><td>理解</td><td>Understand</td><td>理解情绪背后的原因</td><td>8-15</td></tr>
<tr><td>稳定</td><td>Stabilize</td><td>通过呼吸和行动稳定身心</td><td>16-23</td></tr>
<tr><td>转化</td><td>Transform</td><td>转化情绪为成长力量</td><td>24-31</td></tr>
</table>

<h2>七、响应数据示例</h2>
<pre>
{
  "api_version": "1.0.0",
  "total_emotions": 9,
  "total_reminders": 288,
  "emotions": [
    {
      "id": "panic",
      "title": "恐慌",
      "emoji": "😰",
      "colors": {
        "gradient": { "from": "#14B8A6", "to": "#059669" }
      },
      "stages": [
        {
          "name": "觉察",
          "reminders": ["我现在的身体反应是正常的警报...", ...]
        }
      ]
    }
  ]
}
</pre>

<h2>八、使用示例</h2>
<h3>JavaScript</h3>
<pre>
// 获取全部数据
const response = await fetch('${baseUrl}');
const data = await response.json();

// 获取单个情绪
const panic = await fetch('${baseUrl}?emotion_id=panic');
const panicData = await panic.json();
</pre>

<h2>九、注意事项</h2>
<ul>
<li>所有认知提醒使用<strong>第一人称"我"</strong>进行自我对话</li>
<li>颜色值为<strong>HEX格式</strong>，可直接用于CSS</li>
<li>接口<strong>无需认证</strong>，可直接调用</li>
<li>建议缓存数据，减少重复请求</li>
</ul>

<hr>
<p style="text-align: center; color: #64748B;">© ${new Date().getFullYear()} 情绪按钮系统 - 基于神经科学的即时情绪稳定工具</p>
</body>
</html>
    `;

    // 创建 Blob 并下载
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '情绪按钮API接口文档.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("文档下载成功");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <Button
            onClick={generateWordDoc}
            className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
          >
            <Download className="h-4 w-4" />
            下载 Word 文档
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            🆘 情绪按钮 API 接口文档
          </h1>
          <p className="text-muted-foreground">
            基于神经科学的即时情绪稳定系统 · 开放数据接口
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="secondary">288 条认知提醒</Badge>
            <Badge variant="secondary">9 种情绪场景</Badge>
            <Badge variant="secondary">4 阶段科学设计</Badge>
            <Badge variant="secondary">无需认证</Badge>
          </div>
        </div>

        {/* Quick Download Card */}
        <Card className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-200">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-teal-600" />
              <div>
                <h3 className="font-semibold">下载完整文档</h3>
                <p className="text-sm text-muted-foreground">Word 格式，包含所有接口说明和示例</p>
              </div>
            </div>
            <Button
              onClick={generateWordDoc}
              size="lg"
              className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
            >
              <Download className="h-5 w-5" />
              下载 .doc 文档
            </Button>
          </CardContent>
        </Card>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-teal-600" />
              接口地址
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm break-all">{baseUrl}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(baseUrl, 'base')}
              >
                {copied === 'base' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-cyan-600" />
              接口列表
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "获取全部数据", url: baseUrl, desc: "返回9种情绪的完整数据" },
              { name: "获取单个情绪", url: `${baseUrl}?emotion_id=panic`, desc: "可选: panic, worry, negative, fear, irritable, stress, powerless, collapse, lost" },
              { name: "简化格式", url: `${baseUrl}?format=simple`, desc: "仅返回基本信息和颜色" },
              { name: "仅提醒文本", url: `${baseUrl}?format=reminders_only`, desc: "仅返回提醒内容" }
            ].map((endpoint, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{endpoint.name}</h4>
                  <Badge>GET</Badge>
                </div>
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <code className="flex-1 text-xs break-all">{endpoint.url}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(endpoint.url, `endpoint-${index}`)}
                  >
                    {copied === `endpoint-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{endpoint.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Emotion Types */}
        <Card>
          <CardHeader>
            <CardTitle>9种情绪类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "panic", title: "恐慌", emoji: "😰" },
                { id: "worry", title: "担心", emoji: "🤔" },
                { id: "negative", title: "负面", emoji: "😔" },
                { id: "fear", title: "恐惧", emoji: "😨" },
                { id: "irritable", title: "烦躁", emoji: "😤" },
                { id: "stress", title: "压力", emoji: "😩" },
                { id: "powerless", title: "无力", emoji: "😶" },
                { id: "collapse", title: "崩溃", emoji: "😭" },
                { id: "lost", title: "失落", emoji: "😞" }
              ].map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">{e.emoji}</span>
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <code className="text-xs text-muted-foreground">{e.id}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stages */}
        <Card>
          <CardHeader>
            <CardTitle>4个阶段说明</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "觉察", en: "Feel it", desc: "感受并命名情绪", range: "0-7" },
                { name: "理解", en: "Understand", desc: "理解情绪背后的原因", range: "8-15" },
                { name: "稳定", en: "Stabilize", desc: "通过呼吸和行动稳定身心", range: "16-23" },
                { name: "转化", en: "Transform", desc: "转化情绪为成长力量", range: "24-31" }
              ].map((stage, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{stage.name}</span>
                    <Badge variant="outline">{stage.en}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{stage.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">提醒索引: {stage.range}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Example */}
        <Card>
          <CardHeader>
            <CardTitle>使用示例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-sm">
{`// 获取全部数据
const response = await fetch('${baseUrl}');
const data = await response.json();

// 获取单个情绪
const panic = await fetch('${baseUrl}?emotion_id=panic');
const panicData = await panic.json();

// 仅获取提醒文本
const reminders = await fetch('${baseUrl}?format=reminders_only');
const reminderData = await reminders.json();`}
              </pre>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(`const response = await fetch('${baseUrl}');
const data = await response.json();`, 'code')}
              >
                {copied === 'code' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>注意事项</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 所有认知提醒使用<strong className="text-foreground">第一人称"我"</strong>进行自我对话</li>
              <li>• 颜色值为<strong className="text-foreground">HEX格式</strong>，可直接用于CSS</li>
              <li>• 接口<strong className="text-foreground">无需认证</strong>，可直接调用</li>
              <li>• 建议缓存数据，减少重复请求</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmotionButtonApiDocs;
