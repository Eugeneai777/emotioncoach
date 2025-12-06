import { useState } from "react";
import { ArrowLeft, Lock, Unlock, ChevronDown, ChevronRight, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ApiEndpoint {
  name: string;
  description: string;
  method: "POST" | "GET";
  requiresAuth: boolean;
  category: string;
  parameters?: {
    name: string;
    type: string;
    required: boolean;
    description: string;
  }[];
  requestExample?: string;
  responseExample?: string;
}

const API_BASE_URL = "https://vlsuzskvykddwrxbmcbu.supabase.co/functions/v1";

const apiEndpoints: ApiEndpoint[] = [
  // 情绪教练类
  {
    name: "emotion-coach",
    description: "情绪教练对话接口，支持四阶段情绪处理流程（觉察→理解→反应→转化）",
    method: "POST",
    requiresAuth: true,
    category: "情绪教练",
    parameters: [
      { name: "message", type: "string", required: true, description: "用户消息内容" },
      { name: "conversationId", type: "string", required: false, description: "对话ID，用于维持上下文" },
      { name: "sessionId", type: "string", required: false, description: "会话ID" }
    ],
    requestExample: `{
  "message": "我今天感到很焦虑",
  "conversationId": "uuid-xxx"
}`,
    responseExample: `{
  "reply": "我听到你说感到焦虑...",
  "stage": 1,
  "toolCalls": []
}`
  },
  {
    name: "parent-emotion-coach",
    description: "亲子情绪教练，帮助父母处理与孩子相关的情绪困扰",
    method: "POST",
    requiresAuth: true,
    category: "情绪教练",
    parameters: [
      { name: "message", type: "string", required: true, description: "用户消息" },
      { name: "conversationId", type: "string", required: false, description: "对话ID" }
    ]
  },
  {
    name: "carnegie-coach",
    description: "沟通教练对话接口，基于卡耐基人际沟通原则",
    method: "POST",
    requiresAuth: true,
    category: "情绪教练",
    parameters: [
      { name: "message", type: "string", required: true, description: "用户消息" },
      { name: "conversationId", type: "string", required: false, description: "对话ID" }
    ]
  },
  {
    name: "life-coach",
    description: "生活教练对话接口",
    method: "POST",
    requiresAuth: true,
    category: "情绪教练"
  },
  {
    name: "vibrant-life-sage-coach",
    description: "有劲生活教练，智能导航入口",
    method: "POST",
    requiresAuth: true,
    category: "情绪教练"
  },
  {
    name: "chat",
    description: "通用对话接口",
    method: "POST",
    requiresAuth: true,
    category: "情绪教练"
  },
  {
    name: "wechat-chat",
    description: "微信公众号对话接口（无需认证）",
    method: "POST",
    requiresAuth: false,
    category: "情绪教练",
    parameters: [
      { name: "message", type: "string", required: true, description: "用户消息" },
      { name: "openid", type: "string", required: true, description: "微信用户OpenID" },
      { name: "history", type: "array", required: false, description: "对话历史" }
    ]
  },

  // 分析类
  {
    name: "analyze-emotion-patterns",
    description: "分析用户情绪模式和趋势",
    method: "POST",
    requiresAuth: true,
    category: "数据分析",
    parameters: [
      { name: "userId", type: "string", required: true, description: "用户ID" },
      { name: "days", type: "number", required: false, description: "分析天数范围" }
    ]
  },
  {
    name: "analyze-communication-patterns",
    description: "分析沟通模式",
    method: "POST",
    requiresAuth: true,
    category: "数据分析"
  },
  {
    name: "analyze-parent-emotion-patterns",
    description: "分析亲子情绪模式",
    method: "POST",
    requiresAuth: true,
    category: "数据分析"
  },
  {
    name: "analyze-tag-associations",
    description: "分析标签关联性",
    method: "POST",
    requiresAuth: true,
    category: "数据分析"
  },
  {
    name: "analyze-tag-trends",
    description: "分析标签趋势变化",
    method: "POST",
    requiresAuth: true,
    category: "数据分析"
  },
  {
    name: "analyze-user-behavior",
    description: "分析用户行为数据",
    method: "POST",
    requiresAuth: false,
    category: "数据分析"
  },

  // 生成类
  {
    name: "generate-emotion-review",
    description: "生成情绪回顾报告",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-communication-review",
    description: "生成沟通回顾报告",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-tag-report",
    description: "生成标签统计报告",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-smart-notification",
    description: "生成智能通知消息",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-story-coach",
    description: "生成故事教练内容（英雄之旅框架）",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-coach-template",
    description: "AI生成教练模板配置",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-checkin-image",
    description: "生成打卡图片",
    method: "POST",
    requiresAuth: true,
    category: "内容生成"
  },
  {
    name: "generate-all-reminders",
    description: "批量生成AI语音认知提醒（32条/情绪类型）",
    method: "POST",
    requiresAuth: true,
    category: "内容生成",
    parameters: [
      { name: "emotionType", type: "string", required: true, description: "情绪类型（panic/worry/negative等）" }
    ]
  },

  // 推荐类
  {
    name: "recommend-courses",
    description: "推荐课程内容",
    method: "POST",
    requiresAuth: true,
    category: "智能推荐"
  },
  {
    name: "recommend-communication-courses",
    description: "推荐沟通相关课程",
    method: "POST",
    requiresAuth: true,
    category: "智能推荐"
  },
  {
    name: "recommend-music",
    description: "根据情绪推荐音乐频率",
    method: "POST",
    requiresAuth: true,
    category: "智能推荐"
  },
  {
    name: "recommend-posts",
    description: "推荐社区帖子",
    method: "POST",
    requiresAuth: false,
    category: "智能推荐"
  },
  {
    name: "suggest-goals",
    description: "智能目标建议",
    method: "POST",
    requiresAuth: true,
    category: "智能推荐"
  },
  {
    name: "suggest-smart-goals",
    description: "智能SMART目标建议",
    method: "POST",
    requiresAuth: true,
    category: "智能推荐"
  },

  // 比较类
  {
    name: "compare-emotions",
    description: "对比不同时期情绪状态",
    method: "POST",
    requiresAuth: true,
    category: "数据对比"
  },
  {
    name: "compare-communications",
    description: "对比沟通记录",
    method: "POST",
    requiresAuth: true,
    category: "数据对比"
  },

  // 微信支付
  {
    name: "create-wechat-order",
    description: "创建微信支付订单，返回支付二维码",
    method: "POST",
    requiresAuth: true,
    category: "微信支付",
    parameters: [
      { name: "packageKey", type: "string", required: true, description: "套餐标识" },
      { name: "packageName", type: "string", required: true, description: "套餐名称" },
      { name: "amount", type: "number", required: true, description: "支付金额（分）" }
    ],
    requestExample: `{
  "packageKey": "yearly_365",
  "packageName": "365会员年卡",
  "amount": 36500
}`,
    responseExample: `{
  "success": true,
  "orderId": "uuid-xxx",
  "orderNo": "WX20241206xxx",
  "qrCodeUrl": "weixin://wxpay/..."
}`
  },
  {
    name: "check-order-status",
    description: "查询订单支付状态",
    method: "POST",
    requiresAuth: true,
    category: "微信支付",
    parameters: [
      { name: "orderId", type: "string", required: true, description: "订单ID" }
    ]
  },
  {
    name: "wechat-pay-callback",
    description: "微信支付回调通知（微信服务器调用）",
    method: "POST",
    requiresAuth: false,
    category: "微信支付"
  },

  // 微信公众号
  {
    name: "get-wechat-config",
    description: "获取微信公众号配置（AppID）",
    method: "POST",
    requiresAuth: false,
    category: "微信公众号"
  },
  {
    name: "get-wechat-access-token",
    description: "获取微信Access Token",
    method: "POST",
    requiresAuth: false,
    category: "微信公众号"
  },
  {
    name: "wechat-callback",
    description: "微信公众号消息回调",
    method: "POST",
    requiresAuth: false,
    category: "微信公众号"
  },
  {
    name: "wechat-oauth-callback",
    description: "微信OAuth授权回调",
    method: "GET",
    requiresAuth: false,
    category: "微信公众号"
  },
  {
    name: "wechat-oauth-process",
    description: "处理微信OAuth授权流程",
    method: "POST",
    requiresAuth: false,
    category: "微信公众号"
  },
  {
    name: "send-wechat-template-message",
    description: "发送微信模板消息",
    method: "POST",
    requiresAuth: false,
    category: "微信公众号"
  },

  // 企业微信
  {
    name: "get-wecom-access-token",
    description: "获取企业微信Access Token",
    method: "POST",
    requiresAuth: false,
    category: "企业微信"
  },
  {
    name: "wecom-callback",
    description: "企业微信消息回调",
    method: "POST",
    requiresAuth: false,
    category: "企业微信"
  },
  {
    name: "send-wecom-notification",
    description: "发送企业微信通知",
    method: "POST",
    requiresAuth: false,
    category: "企业微信"
  },

  // 用户账户
  {
    name: "check-quota",
    description: "检查用户剩余配额",
    method: "POST",
    requiresAuth: false,
    category: "用户账户",
    parameters: [
      { name: "userId", type: "string", required: true, description: "用户ID" },
      { name: "source", type: "string", required: false, description: "来源标识" }
    ],
    responseExample: `{
  "allowed": true,
  "reason": "quota_available",
  "remainingQuota": 45
}`
  },
  {
    name: "deduct-quota",
    description: "扣减用户配额",
    method: "POST",
    requiresAuth: true,
    category: "用户账户",
    parameters: [
      { name: "source", type: "string", required: true, description: "使用来源" },
      { name: "amount", type: "number", required: false, description: "扣减数量，默认1" }
    ]
  },
  {
    name: "admin-recharge",
    description: "管理员充值配额",
    method: "POST",
    requiresAuth: false,
    category: "用户账户"
  },
  {
    name: "redeem-code",
    description: "兑换码核销",
    method: "POST",
    requiresAuth: false,
    category: "用户账户",
    parameters: [
      { name: "code", type: "string", required: true, description: "兑换码" },
      { name: "userId", type: "string", required: true, description: "用户ID" }
    ]
  },

  // 合伙人
  {
    name: "process-referral",
    description: "处理推荐关系",
    method: "POST",
    requiresAuth: false,
    category: "合伙人系统"
  },
  {
    name: "calculate-commission",
    description: "计算佣金",
    method: "POST",
    requiresAuth: false,
    category: "合伙人系统"
  },
  {
    name: "confirm-commissions",
    description: "确认待结算佣金",
    method: "POST",
    requiresAuth: false,
    category: "合伙人系统"
  },
  {
    name: "partner-withdrawal",
    description: "合伙人提现申请",
    method: "POST",
    requiresAuth: true,
    category: "合伙人系统"
  },
  {
    name: "generate-redemption-codes",
    description: "生成兑换码",
    method: "POST",
    requiresAuth: true,
    category: "合伙人系统"
  },

  // 语音功能
  {
    name: "text-to-speech",
    description: "文字转语音（ElevenLabs）",
    method: "POST",
    requiresAuth: true,
    category: "语音功能",
    parameters: [
      { name: "text", type: "string", required: true, description: "要转换的文本" },
      { name: "voice_id", type: "string", required: false, description: "语音ID" }
    ],
    responseExample: `{
  "audio": "base64_encoded_audio_data..."
}`
  },
  {
    name: "clone-voice",
    description: "克隆用户语音",
    method: "POST",
    requiresAuth: true,
    category: "语音功能"
  },
  {
    name: "create-voice-clone",
    description: "创建语音克隆",
    method: "POST",
    requiresAuth: true,
    category: "语音功能"
  },

  // 其他
  {
    name: "classify-tag-sentiment",
    description: "标签情感分类",
    method: "POST",
    requiresAuth: true,
    category: "其他功能"
  },
  {
    name: "tag-goal-coach",
    description: "标签目标教练",
    method: "POST",
    requiresAuth: true,
    category: "其他功能"
  },
  {
    name: "goal-completion-feedback",
    description: "目标完成反馈",
    method: "POST",
    requiresAuth: true,
    category: "其他功能"
  },
  {
    name: "emotion-alert-suggestions",
    description: "情绪预警建议",
    method: "POST",
    requiresAuth: true,
    category: "其他功能"
  },
  {
    name: "check-streak-achievements",
    description: "检查连续打卡成就",
    method: "POST",
    requiresAuth: false,
    category: "其他功能"
  },
  {
    name: "trigger-notifications",
    description: "触发通知推送",
    method: "POST",
    requiresAuth: false,
    category: "其他功能"
  },
  {
    name: "push-weekly-courses",
    description: "推送每周课程",
    method: "POST",
    requiresAuth: false,
    category: "其他功能"
  },
  {
    name: "import-video-courses",
    description: "导入视频课程数据",
    method: "POST",
    requiresAuth: false,
    category: "其他功能"
  },
  {
    name: "mysql-sync",
    description: "MySQL数据同步",
    method: "POST",
    requiresAuth: false,
    category: "其他功能"
  }
];

const categories = [...new Set(apiEndpoints.map(e => e.category))];

const ApiDocs = () => {
  const navigate = useNavigate();
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const toggleEndpoint = (name: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
    } else {
      newExpanded.add(name);
    }
    setExpandedEndpoints(newExpanded);
  };

  const copyEndpoint = (name: string) => {
    const url = `${API_BASE_URL}/${name}`;
    navigator.clipboard.writeText(url);
    setCopiedEndpoint(name);
    toast.success("已复制接口地址");
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getEndpointsByCategory = (category: string) => {
    return apiEndpoints.filter(e => e.category === category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">有劲应用 API 文档</h1>
                <p className="text-sm text-slate-500">Supabase Edge Functions</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              v1.0
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* API Base URL */}
        <Card className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80 mb-1">API Base URL</p>
                <code className="text-lg font-mono">{API_BASE_URL}</code>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(API_BASE_URL);
                  toast.success("已复制Base URL");
                }}
              >
                <Copy className="w-4 h-4 mr-1" />
                复制
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-white/60 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-indigo-600">{apiEndpoints.length}</p>
              <p className="text-sm text-slate-500">接口总数</p>
            </CardContent>
          </Card>
          <Card className="bg-white/60 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {apiEndpoints.filter(e => !e.requiresAuth).length}
              </p>
              <p className="text-sm text-slate-500">公开接口</p>
            </CardContent>
          </Card>
          <Card className="bg-white/60 backdrop-blur">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">
                {apiEndpoints.filter(e => e.requiresAuth).length}
              </p>
              <p className="text-sm text-slate-500">需认证</p>
            </CardContent>
          </Card>
        </div>

        {/* Authentication Info */}
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-2">🔐 认证说明</h3>
            <p className="text-sm text-amber-700 mb-2">
              需要认证的接口请在请求头中添加 JWT Token：
            </p>
            <code className="block bg-amber-100 p-2 rounded text-xs font-mono text-amber-900">
              Authorization: Bearer &lt;your_jwt_token&gt;
            </code>
          </CardContent>
        </Card>

        {/* API Endpoints by Category */}
        {categories.map(category => (
          <Card key={category} className="mb-4 bg-white/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {category}
                <Badge variant="secondary" className="text-xs">
                  {getEndpointsByCategory(category).length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {getEndpointsByCategory(category).map(endpoint => (
                <Collapsible
                  key={endpoint.name}
                  open={expandedEndpoints.has(endpoint.name)}
                  onOpenChange={() => toggleEndpoint(endpoint.name)}
                >
                  <div className="border rounded-lg overflow-hidden">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              endpoint.method === "POST"
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-blue-500 hover:bg-blue-600"
                            }
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="text-sm font-mono text-slate-700">
                            /{endpoint.name}
                          </code>
                          {endpoint.requiresAuth ? (
                            <Lock className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 hidden sm:block">
                            {endpoint.description.slice(0, 30)}...
                          </span>
                          {expandedEndpoints.has(endpoint.name) ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t p-4 bg-slate-50 space-y-4">
                        <div>
                          <p className="text-sm text-slate-600">{endpoint.description}</p>
                        </div>

                        {/* Endpoint URL */}
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">接口地址</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-xs bg-white p-2 rounded border font-mono">
                              {API_BASE_URL}/{endpoint.name}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyEndpoint(endpoint.name);
                              }}
                            >
                              {copiedEndpoint === endpoint.name ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Parameters */}
                        {endpoint.parameters && endpoint.parameters.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-2">请求参数</p>
                            <div className="bg-white rounded border overflow-hidden">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="text-left p-2">参数名</th>
                                    <th className="text-left p-2">类型</th>
                                    <th className="text-left p-2">必填</th>
                                    <th className="text-left p-2">说明</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.parameters.map(param => (
                                    <tr key={param.name} className="border-t">
                                      <td className="p-2 font-mono">{param.name}</td>
                                      <td className="p-2 text-blue-600">{param.type}</td>
                                      <td className="p-2">
                                        {param.required ? (
                                          <Badge variant="destructive" className="text-xs">是</Badge>
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">否</Badge>
                                        )}
                                      </td>
                                      <td className="p-2 text-slate-600">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Request Example */}
                        {endpoint.requestExample && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">请求示例</p>
                            <pre className="bg-slate-800 text-green-400 p-3 rounded text-xs overflow-x-auto">
                              {endpoint.requestExample}
                            </pre>
                          </div>
                        )}

                        {/* Response Example */}
                        {endpoint.responseExample && (
                          <div>
                            <p className="text-xs font-medium text-slate-500 mb-1">响应示例</p>
                            <pre className="bg-slate-800 text-blue-400 p-3 rounded text-xs overflow-x-auto">
                              {endpoint.responseExample}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Footer */}
        <div className="text-center py-8 text-sm text-slate-500">
          <p>有劲应用 API 文档 · 共 {apiEndpoints.length} 个接口</p>
          <p className="mt-1">最后更新: 2024年12月</p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
