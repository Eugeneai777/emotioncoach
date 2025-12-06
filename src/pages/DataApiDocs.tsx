import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Copy, Check, Lock, Unlock, BarChart3, Database, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";

const DataApiDocs = () => {
  const navigate = useNavigate();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = "https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1/data-api";

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateWordDoc = () => {
    const docContent = `
劲老师数据API接口文档
===================

一、概述
-------
本API提供劲老师应用的数据访问能力，支持公开数据、用户私有数据和聚合统计数据的访问。

基础URL: ${baseUrl}

二、认证方式
-----------
1. API密钥认证 (推荐用于后端服务)
   请求头: x-api-key: YOUR_API_KEY

2. JWT Token认证 (用于前端应用)
   请求头: Authorization: Bearer YOUR_JWT_TOKEN

三、公开数据接口 (无需认证)
-------------------------

1. 获取教练模板列表
   GET ${baseUrl}?endpoint=coach_templates
   
   返回字段:
   - id: 模板ID
   - coach_key: 教练标识
   - emoji: 图标
   - title: 标题
   - subtitle: 副标题
   - description: 描述
   - gradient: 渐变色
   - steps: 步骤配置

2. 获取训练营模板列表
   GET ${baseUrl}?endpoint=camp_templates
   
   返回字段:
   - id: 模板ID
   - camp_type: 训练营类型
   - camp_name: 名称
   - duration_days: 天数
   - price: 价格
   - benefits: 收益
   - stages: 阶段配置

3. 获取视频课程列表
   GET ${baseUrl}?endpoint=video_courses
   GET ${baseUrl}?endpoint=video_courses&category=情绪管理&limit=20
   
   参数:
   - category: 分类筛选 (可选)
   - limit: 返回数量限制 (默认50)

4. 获取套餐列表
   GET ${baseUrl}?endpoint=packages

5. 获取聚合统计数据
   GET ${baseUrl}?endpoint=statistics
   
   返回:
   - total_users: 总用户数
   - total_briefings: 总简报数
   - total_panic_sessions: 总急救会话数
   - total_community_posts: 总社区帖子数
   - total_training_camps: 总训练营数

四、用户私有数据接口 (需要认证)
-----------------------------

1. 获取用户情绪简报
   GET ${baseUrl}?endpoint=user_briefings&user_id=UUID
   GET ${baseUrl}?endpoint=user_briefings&user_id=UUID&limit=20&offset=0
   
   参数:
   - user_id: 用户ID (必需)
   - limit: 每页数量 (默认20)
   - offset: 偏移量 (默认0)

2. 获取用户情绪急救会话
   GET ${baseUrl}?endpoint=user_sessions&user_id=UUID
   
   参数:
   - user_id: 用户ID (必需)
   - limit: 每页数量 (默认20)
   - offset: 偏移量 (默认0)

3. 获取用户训练营数据
   GET ${baseUrl}?endpoint=user_camps&user_id=UUID

4. 获取用户账户信息
   GET ${baseUrl}?endpoint=user_account&user_id=UUID
   
   返回:
   - account: 账户配额信息
   - profile: 用户资料
   - active_subscription: 当前有效订阅

5. 获取用户成就
   GET ${baseUrl}?endpoint=user_achievements&user_id=UUID

五、响应格式
-----------
成功响应:
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}

错误响应:
{
  "success": false,
  "error": "错误信息",
  "message": "详细说明"
}

六、错误码
---------
- 400: 请求参数错误
- 401: 未授权 (缺少或无效的认证信息)
- 500: 服务器内部错误

七、使用示例
-----------

Python示例:
import requests

# 公开接口
response = requests.get("${baseUrl}?endpoint=statistics")
print(response.json())

# 私有接口
headers = {"x-api-key": "YOUR_API_KEY"}
response = requests.get(
    "${baseUrl}?endpoint=user_briefings&user_id=USER_UUID",
    headers=headers
)
print(response.json())

Node.js示例:
const axios = require('axios');

// 公开接口
const stats = await axios.get('${baseUrl}?endpoint=statistics');
console.log(stats.data);

// 私有接口
const briefings = await axios.get('${baseUrl}?endpoint=user_briefings&user_id=USER_UUID', {
  headers: { 'x-api-key': 'YOUR_API_KEY' }
});
console.log(briefings.data);

八、注意事项
-----------
1. 用户私有数据接口需要提供有效的API密钥或JWT Token
2. 建议在后端服务中使用API密钥，避免在前端暴露
3. 分页接口支持 limit 和 offset 参数
4. 所有时间字段使用 ISO 8601 格式 (UTC时区)

九、联系方式
-----------
如有问题，请联系技术支持。
`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>劲老师数据API接口文档</title>
<style>
body { font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.8; padding: 40px; max-width: 900px; margin: 0 auto; }
h1 { color: #0d9488; border-bottom: 3px solid #0d9488; padding-bottom: 10px; }
h2 { color: #0f766e; margin-top: 30px; border-left: 4px solid #14b8a6; padding-left: 12px; }
h3 { color: #115e59; }
code { background: #f0fdfa; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; color: #0d9488; }
pre { background: #f0fdfa; padding: 16px; border-radius: 8px; overflow-x: auto; border: 1px solid #99f6e4; }
table { border-collapse: collapse; width: 100%; margin: 16px 0; }
th, td { border: 1px solid #99f6e4; padding: 10px; text-align: left; }
th { background: #ccfbf1; color: #0d9488; }
.badge-public { background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.badge-auth { background: #f59e0b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
</style>
</head>
<body>
<pre>${docContent}</pre>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '劲老师数据API接口文档.doc';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("文档下载成功");
  };

  const publicEndpoints = [
    { endpoint: 'coach_templates', name: '教练模板列表', desc: '获取所有激活的教练模板配置' },
    { endpoint: 'camp_templates', name: '训练营模板列表', desc: '获取所有激活的训练营模板' },
    { endpoint: 'video_courses', name: '视频课程列表', desc: '获取视频课程，支持分类筛选' },
    { endpoint: 'packages', name: '套餐列表', desc: '获取所有激活的套餐配置' },
    { endpoint: 'statistics', name: '聚合统计数据', desc: '获取平台整体统计数据' },
  ];

  const authEndpoints = [
    { endpoint: 'user_briefings', name: '用户情绪简报', desc: '获取指定用户的情绪简报历史', params: 'user_id, limit, offset' },
    { endpoint: 'user_sessions', name: '用户急救会话', desc: '获取指定用户的情绪急救会话记录', params: 'user_id, limit, offset' },
    { endpoint: 'user_camps', name: '用户训练营', desc: '获取指定用户的训练营数据', params: 'user_id' },
    { endpoint: 'user_account', name: '用户账户信息', desc: '获取用户账户、资料和订阅信息', params: 'user_id' },
    { endpoint: 'user_achievements', name: '用户成就', desc: '获取用户获得的成就徽章', params: 'user_id' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
          <Button onClick={generateWordDoc} className="gap-2 bg-gradient-to-r from-teal-500 to-cyan-500">
            <Download className="h-4 w-4" />
            下载Word文档
          </Button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Database className="h-8 w-8 text-teal-600" />
            <h1 className="text-3xl font-bold text-teal-800">数据API接口文档</h1>
          </div>
          <p className="text-muted-foreground">为后端服务提供完整的数据访问能力</p>
        </div>

        {/* Base URL */}
        <Card className="mb-6 border-teal-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">基础URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 bg-teal-50 p-3 rounded-lg">
              <code className="flex-1 text-sm text-teal-700 break-all">{baseUrl}</code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(baseUrl, 'baseUrl')}
              >
                {copiedKey === 'baseUrl' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card className="mb-6 border-amber-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              认证方式
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. API密钥认证 (推荐用于后端服务)</h4>
              <div className="bg-slate-50 p-3 rounded-lg">
                <code className="text-sm">x-api-key: YOUR_API_KEY</code>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                请联系管理员获取API密钥，密钥需配置为 Supabase Secret: DATA_API_KEY
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. JWT Token认证</h4>
              <div className="bg-slate-50 p-3 rounded-lg">
                <code className="text-sm">Authorization: Bearer YOUR_JWT_TOKEN</code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Public Endpoints */}
        <Card className="mb-6 border-green-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Unlock className="h-5 w-5 text-green-600" />
              公开数据接口
              <Badge variant="secondary" className="bg-green-100 text-green-700">无需认证</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {publicEndpoints.map((ep) => (
              <div key={ep.endpoint} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ep.name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${baseUrl}?endpoint=${ep.endpoint}`, ep.endpoint)}
                  >
                    {copiedKey === ep.endpoint ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <code className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded block mb-2">
                  GET {baseUrl}?endpoint={ep.endpoint}
                </code>
                <p className="text-sm text-muted-foreground">{ep.desc}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Authenticated Endpoints */}
        <Card className="mb-6 border-amber-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" />
              用户私有数据接口
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">需要认证</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {authEndpoints.map((ep) => (
              <div key={ep.endpoint} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{ep.name}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(`${baseUrl}?endpoint=${ep.endpoint}&user_id=USER_UUID`, ep.endpoint)}
                  >
                    {copiedKey === ep.endpoint ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <code className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded block mb-2">
                  GET {baseUrl}?endpoint={ep.endpoint}&user_id=UUID
                </code>
                <p className="text-sm text-muted-foreground mb-2">{ep.desc}</p>
                <p className="text-xs text-slate-500">参数: {ep.params}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Statistics Preview */}
        <Card className="mb-6 border-blue-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              统计数据示例
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "success": true,
  "data": {
    "total_users": 1234,
    "total_briefings": 5678,
    "total_panic_sessions": 890,
    "total_community_posts": 456,
    "total_training_camps": 123,
    "updated_at": "2024-01-01T12:00:00.000Z"
  }
}`}
            </pre>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="border-purple-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">代码示例</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Python</h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`import requests

# 公开接口
response = requests.get("${baseUrl}?endpoint=statistics")
print(response.json())

# 私有接口
headers = {"x-api-key": "YOUR_API_KEY"}
response = requests.get(
    "${baseUrl}?endpoint=user_briefings&user_id=USER_UUID",
    headers=headers
)
print(response.json())`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">Node.js</h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`const axios = require('axios');

// 公开接口
const stats = await axios.get('${baseUrl}?endpoint=statistics');
console.log(stats.data);

// 私有接口
const briefings = await axios.get(
  '${baseUrl}?endpoint=user_briefings&user_id=USER_UUID',
  { headers: { 'x-api-key': 'YOUR_API_KEY' } }
);
console.log(briefings.data);`}
              </pre>
            </div>
            <div>
              <h4 className="font-medium mb-2">cURL</h4>
              <pre className="bg-slate-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
{`# 公开接口
curl "${baseUrl}?endpoint=statistics"

# 私有接口
curl -H "x-api-key: YOUR_API_KEY" \\
  "${baseUrl}?endpoint=user_briefings&user_id=USER_UUID"`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DataApiDocs;
