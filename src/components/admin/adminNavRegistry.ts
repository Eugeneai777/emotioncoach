import { NAV_GROUPS } from "./AdminSidebar";
import type { AdminRole } from "./AdminLayout";
import type { LucideIcon } from "lucide-react";

export interface AdminCommandItem {
  key: string;
  label: string;
  path: string;
  icon: LucideIcon;
  group: string;
  groupIcon: LucideIcon;
  parentLabel?: string;
  roles: AdminRole[];
  keywords: string[];
}

// 关键词别名表：补充中文同义词、英文、业务俗称，方便搜索定位
const KEYWORDS_MAP: Record<string, string[]> = {
  // 概览
  dashboard: ["概览", "首页", "仪表板", "dashboard", "home", "总览"],

  // 用户与订单
  users: ["用户", "账户", "注册", "user", "account", "会员", "学员"],
  orders: ["订单", "支付", "购买", "order", "pay", "交易", "付款"],

  // 合伙人
  partners: ["有劲合伙人", "partner", "推广", "佣金", "渠道"],
  bloom: ["绽放", "bloom", "绽放合伙人"],
  "bloom-invitations": ["绽放邀请", "邀请", "invite", "bloom"],
  "bloom-delivery": ["绽放交付", "合伙人交付", "delivery", "bloom"],
  "bloom-single": ["单营交付", "single", "bloom"],
  "bloom-profit": ["绽放利润", "利润核算", "profit", "bloom"],
  "bloom-monthly": ["绽放月度", "月度利润", "monthly", "bloom"],
  "bloom-cashflow": ["绽放现金流", "现金流", "cashflow", "bloom"],
  "industry-partners": ["行业合伙人", "B端", "industry", "企业"],

  // 内容管理
  coaches: ["教练模板", "AI教练", "coach", "教练"],
  "human-coaches": ["真人教练", "人工教练", "导师", "human coach"],
  assessments: [
    "测评", "评估", "测试", "assessment", "test",
    "男人有劲", "男士活力", "vitality", "midlife",
    "SCL90", "scl-90", "scl",
    "亲子沟通", "家长", "parent",
    "女性竞争力", "women",
    "财富", "wealth",
    "情绪", "emotion",
    "性格", "MBTI", "SBTI",
    "测评管理", "数据洞察",
  ],
  camps: ["训练营", "训练", "camp", "营", "课程", "7天", "21天"],
  videos: ["视频", "课程", "video", "录播"],
  knowledge: ["知识库", "knowledge", "文档", "kb"],
  tools: ["工具", "生活馆", "tools", "energy"],
  "community-posts": ["社区", "动态", "帖子", "community", "post"],
  "drama-script": ["短剧", "剧本", "drama", "script", "AI短剧"],

  // 转化飞轮
  flywheel: ["飞轮", "flywheel", "增长"],
  "flywheel-campaigns": ["Campaign", "活动", "实验", "campaign", "实验室"],
  "flywheel-funnel": ["漏斗", "行为追踪", "funnel", "track"],
  "flywheel-revenue": ["收入", "ROI", "revenue", "营收"],
  "flywheel-referral": ["裂变", "推荐", "分享", "referral", "share"],
  "flywheel-ai": ["AI策略", "策略中心", "AI"],

  // 运营数据
  usage: ["使用记录", "usage", "调用", "log", "记录"],
  "activation-codes": ["激活码", "兑换码", "code", "activation"],
  funnel: ["转化漏斗", "conversion", "funnel"],
  reports: ["举报", "report", "投诉"],
  "wechat-broadcast": ["微信群发", "群发", "broadcast", "推送", "模板消息"],
  "wechat-articles": ["公众号", "文章", "article", "wechat"],
  "xhs-analysis": ["小红书", "xhs", "xiaohongshu", "种草"],

  // 系统安全
  "api-monitor": ["调用监控", "API监控", "monitor", "api"],
  "cost-monitor": ["成本", "费用", "cost", "money"],
  "user-anomaly": ["用户异常", "异常", "anomaly"],
  "ux-monitoring-coverage": ["体验监控", "UX", "coverage", "范围"],
  stability: ["稳定性", "stability", "错误"],
  "risk-content": ["风险内容", "风控", "risk", "审核"],
  "emergency-contacts": ["紧急联系人", "紧急", "emergency", "contact"],

  // 系统配置
  packages: ["套餐", "权益", "package", "会员套餐"],
  "partner-levels": ["合伙人等级", "等级", "level", "分级"],
  "share-cards": ["分享卡片", "share", "card", "海报"],
  "og-preview": ["OG", "预览", "og preview", "外链卡片"],
  sync: ["同步", "同步状态", "sync"],
  service: ["客服", "service", "工单"],
  "experience-items": ["体验包", "experience", "试用"],
};

function makeKeywords(key: string, label: string, parentLabel?: string): string[] {
  const base = KEYWORDS_MAP[key] || [];
  return [
    label,
    parentLabel || "",
    key,
    ...base,
  ].filter(Boolean);
}

export function buildAdminCommands(): AdminCommandItem[] {
  const list: AdminCommandItem[] = [];
  NAV_GROUPS.forEach((group: any) => {
    group.items.forEach((item: any) => {
      if (item.children && Array.isArray(item.children)) {
        item.children.forEach((child: any) => {
          list.push({
            key: `${group.title}-${child.key}`,
            label: child.label,
            path: child.path,
            icon: child.icon,
            group: group.title,
            groupIcon: group.icon,
            parentLabel: item.label,
            roles: group.roles,
            keywords: makeKeywords(child.key, child.label, item.label),
          });
        });
      } else if (item.path) {
        list.push({
          key: `${group.title}-${item.key}`,
          label: item.label,
          path: item.path,
          icon: item.icon,
          group: group.title,
          groupIcon: group.icon,
          roles: group.roles,
          keywords: makeKeywords(item.key, item.label),
        });
      }
    });
  });
  return list;
}
