import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EarningsData {
  level: string;
  name: string;
  icon: string;
  l1Rate: number;
  l2Rate: number;
  l1Earnings: number;
  l2Earnings: number;
  totalEarnings: number;
  vsL1Multiple: number;
  isRecommended?: boolean;
}

// 场景：发展20个学员，每人消费¥500，每人再发展3人（60人二级团队）
const STUDENTS = 20;
const AVG_SPEND = 500;
const L2_MULTIPLIER = 3; // 每个学员再发展3人

const earningsData: EarningsData[] = [
  { 
    level: 'L1', 
    name: '初级', 
    icon: '💪', 
    l1Rate: 0.18, 
    l2Rate: 0, 
    l1Earnings: STUDENTS * AVG_SPEND * 0.18, // 1800
    l2Earnings: 0, 
    totalEarnings: STUDENTS * AVG_SPEND * 0.18, // 1800
    vsL1Multiple: 1 
  },
  { 
    level: 'L2', 
    name: '高级', 
    icon: '🔥', 
    l1Rate: 0.30, 
    l2Rate: 0.05, 
    l1Earnings: STUDENTS * AVG_SPEND * 0.30, // 3000
    l2Earnings: STUDENTS * L2_MULTIPLIER * AVG_SPEND * 0.05, // 1500
    totalEarnings: STUDENTS * AVG_SPEND * 0.30 + STUDENTS * L2_MULTIPLIER * AVG_SPEND * 0.05, // 4500
    vsL1Multiple: 2.5 
  },
  { 
    level: 'L3', 
    name: '钻石', 
    icon: '💎', 
    l1Rate: 0.50, 
    l2Rate: 0.12, 
    l1Earnings: STUDENTS * AVG_SPEND * 0.50, // 5000
    l2Earnings: STUDENTS * L2_MULTIPLIER * AVG_SPEND * 0.12, // 3600
    totalEarnings: STUDENTS * AVG_SPEND * 0.50 + STUDENTS * L2_MULTIPLIER * AVG_SPEND * 0.12, // 8600
    vsL1Multiple: 4.8,
    isRecommended: true
  },
];

// 价格差异
const L2_PRICE = 3217;
const L3_PRICE = 4950;
const PRICE_DIFF = L3_PRICE - L2_PRICE; // 1733
const EARNINGS_DIFF = earningsData[2].totalEarnings - earningsData[1].totalEarnings; // 4100

function formatMoney(value: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

export function PartnerEarningsComparison() {
  return (
    <Card className="overflow-hidden border-orange-200 dark:border-orange-800">
      <CardContent className="p-4 space-y-4">
        {/* 标题 */}
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h4 className="font-bold text-base">📊 收益对比</h4>
        </div>
        
        {/* 场景说明 */}
        <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          假设：发展 <strong className="text-foreground">20</strong> 名学员，每人消费 <strong className="text-foreground">¥500</strong>，每人再发展 <strong className="text-foreground">3</strong> 人
        </div>
        
        {/* 三列对比卡片 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {earningsData.map((data) => (
            <div 
              key={data.level}
              className={cn(
                "rounded-xl p-3 text-center transition-all relative",
                data.isRecommended 
                  ? "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 ring-2 ring-orange-400/50" 
                  : "bg-muted/50"
              )}
            >
              {data.isRecommended && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded-full whitespace-nowrap">
                  ⭐ 推荐
                </div>
              )}
              
              {/* 图标和名称 */}
              <div className="text-2xl mb-1">{data.icon}</div>
              <div className="text-sm font-bold">{data.name}</div>
              
              {/* 佣金比例 */}
              <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                <div>一级 {Math.round(data.l1Rate * 100)}%</div>
                {data.l2Rate > 0 && (
                  <div className="text-orange-600 dark:text-orange-400">二级 {Math.round(data.l2Rate * 100)}%</div>
                )}
              </div>
              
              {/* 分隔线 */}
              <div className="border-t border-border/50 my-2" />
              
              {/* 收益明细 */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">一级收益</span>
                  <span className="font-medium">¥{formatMoney(data.l1Earnings)}</span>
                </div>
                {data.l2Earnings > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">二级收益</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">¥{formatMoney(data.l2Earnings)}</span>
                  </div>
                )}
              </div>
              
              {/* 分隔线 */}
              <div className="border-t border-border/50 my-2" />
              
              {/* 总收益 */}
              <div className={cn(
                "text-lg font-bold",
                data.isRecommended ? "text-orange-600 dark:text-orange-400" : ""
              )}>
                ¥{formatMoney(data.totalEarnings)}
              </div>
              
              {/* 倍数对比 */}
              <div className={cn(
                "text-xs mt-1",
                data.isRecommended 
                  ? "text-orange-600 dark:text-orange-400 font-bold" 
                  : "text-muted-foreground"
              )}>
                {data.vsL1Multiple === 1 ? "基准" : `${data.vsL1Multiple}倍`}
              </div>
            </div>
          ))}
        </div>
        
        {/* 核心价值主张 */}
        <div className="bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 rounded-xl p-3 space-y-2">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-bold text-foreground">
                💡 钻石合伙人比高级只多投入 <span className="text-orange-600 dark:text-orange-400">¥{formatMoney(PRICE_DIFF)}</span>
              </p>
              <p className="text-muted-foreground mt-1">
                但年收益多赚 <strong className="text-orange-600 dark:text-orange-400">¥{formatMoney(EARNINGS_DIFF)}</strong>，
                <strong className="text-foreground">30天即可回本</strong>，之后全是净赚！
              </p>
            </div>
          </div>
          
          {/* ROI 计算 */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <span>多投入 ¥{formatMoney(PRICE_DIFF)}</span>
            <ArrowRight className="w-3 h-3" />
            <span className="font-bold text-orange-600 dark:text-orange-400">多赚 ¥{formatMoney(EARNINGS_DIFF)}</span>
            <span>=</span>
            <span className="font-bold text-green-600 dark:text-green-400">回报率 {Math.round(EARNINGS_DIFF / PRICE_DIFF * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
