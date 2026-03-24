import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceLink {
  platform: string;
  description: string;
  url: string;
  category: string;
}

const categoryIcons: Record<string, string> = {
  cleaning: "🧹",
  repair: "🔧",
  moving: "🚚",
  food: "🍜",
  errand: "📦",
  domestic: "🏠",
};

const platformMap: Record<string, { name: string; url: string; desc: string; icon: string }> = {
  "58daojia": { name: "58到家", url: "https://daojia.58.com", desc: "找附近保洁/家政", icon: "🧹" },
  zmn: { name: "啄木鸟家庭维修", url: "https://www.zmn.cn", desc: "专业维修上门服务", icon: "🔧" },
  huolala: { name: "货拉拉", url: "https://www.huolala.cn", desc: "搬家拉货一键下单", icon: "🚚" },
  meituan: { name: "美团", url: "https://www.meituan.com", desc: "美食外卖随心选", icon: "🍜" },
  shansong: { name: "闪送", url: "https://www.ishansong.com", desc: "同城急送1小时达", icon: "📦" },
};

export function ServiceLinkCard({ services }: { services: ServiceLink[] }) {
  // If AI returns category keys, map to known platforms
  const resolvedServices = services.map((s) => {
    const mapped = platformMap[s.platform];
    return mapped
      ? { ...s, url: mapped.url, platform: mapped.name, description: mapped.desc, icon: mapped.icon }
      : { ...s, icon: categoryIcons[s.category] || "🔗" };
  });

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
      <p className="text-sm font-medium text-gray-700 mb-3">🔗 推荐平台</p>
      <div className="space-y-2">
        {resolvedServices.map((service, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => window.open(service.url, "_blank", "noopener,noreferrer")}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white border border-emerald-100 hover:bg-emerald-50 transition-colors active:scale-[0.98] text-left"
          >
            <span className="text-xl">{service.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{service.platform}</p>
              <p className="text-xs text-gray-500 truncate">{service.description}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-500 shrink-0" />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
