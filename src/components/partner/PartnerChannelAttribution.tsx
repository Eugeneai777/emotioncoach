import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Eye, MousePointerClick, DollarSign, Loader2 } from "lucide-react";

interface PartnerChannelAttributionProps {
  partnerId: string;
}

interface ChannelData {
  channel: string;
  label: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  conversionRate: string;
}

const CHANNEL_LABELS: Record<string, string> = {
  wechat_moments: "朋友圈",
  xiaohongshu: "小红书",
  landing_page: "落地页",
  douyin: "抖音",
  direct: "直接访问",
  qrcode: "扫码",
  other: "其他",
};

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#94a3b8"];

export function PartnerChannelAttribution({ partnerId }: PartnerChannelAttributionProps) {
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  useEffect(() => {
    loadChannelData();
  }, [partnerId, timeRange]);

  const loadChannelData = async () => {
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - parseInt(timeRange));

      // Get campaigns for this partner
      const { data: campaigns } = await supabase
        .from("campaigns")
        .select("id, media_channel, promotion_cost")
        .eq("partner_id", partnerId);

      if (!campaigns?.length) {
        setChannelData([]);
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map((c) => c.id);

      // Get conversion events
      const { data: events } = await supabase
        .from("conversion_events")
        .select("event_type, campaign_id, metadata, created_at")
        .in("campaign_id", campaignIds)
        .gte("created_at", since.toISOString());

      // Get orders
      const { data: orders } = await supabase
        .from("orders")
        .select("amount, campaign_id")
        .in("campaign_id", campaignIds)
        .eq("status", "paid")
        .gte("created_at", since.toISOString());

      // Aggregate by channel
      const channelMap = new Map<string, { views: number; clicks: number; conversions: number; revenue: number; cost: number }>();

      // Map campaigns to channels
      const campaignChannelMap = new Map<string, string>();
      campaigns.forEach((c) => {
        const ch = c.media_channel || "other";
        campaignChannelMap.set(c.id, ch);
        if (!channelMap.has(ch)) {
          channelMap.set(ch, { views: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 });
        }
        const existing = channelMap.get(ch)!;
        existing.cost += c.promotion_cost || 0;
      });

      // Count events by channel
      (events || []).forEach((e) => {
        const ch = campaignChannelMap.get(e.campaign_id || "") || "other";
        if (!channelMap.has(ch)) channelMap.set(ch, { views: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 });
        const data = channelMap.get(ch)!;
        if (e.event_type === "view" || e.event_type === "share_scan_landed") data.views++;
        else if (e.event_type === "click" || e.event_type === "share") data.clicks++;
        else if (e.event_type === "purchase" || e.event_type === "share_scan_converted") data.conversions++;
      });

      // Sum revenue by channel
      (orders || []).forEach((o) => {
        const ch = campaignChannelMap.get(o.campaign_id || "") || "other";
        if (!channelMap.has(ch)) channelMap.set(ch, { views: 0, clicks: 0, conversions: 0, revenue: 0, cost: 0 });
        channelMap.get(ch)!.revenue += o.amount || 0;
      });

      const result: ChannelData[] = Array.from(channelMap.entries())
        .map(([channel, data]) => ({
          channel,
          label: CHANNEL_LABELS[channel] || channel,
          views: data.views,
          clicks: data.clicks,
          conversions: data.conversions,
          revenue: data.revenue,
          roi: data.cost > 0 ? Math.round(((data.revenue - data.cost) / data.cost) * 100) : 0,
          conversionRate: data.views > 0 ? ((data.conversions / data.views) * 100).toFixed(1) : "0",
        }))
        .sort((a, b) => b.revenue - a.revenue);

      setChannelData(result);
    } catch (err) {
      console.error("Load channel data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const totalViews = channelData.reduce((s, c) => s + c.views, 0);
  const totalConversions = channelData.reduce((s, c) => s + c.conversions, 0);
  const totalRevenue = channelData.reduce((s, c) => s + c.revenue, 0);

  const pieData = channelData.filter((c) => c.revenue > 0).map((c) => ({ name: c.label, value: c.revenue }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">📊 渠道归因分析</h3>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">近7天</SelectItem>
            <SelectItem value="30">近30天</SelectItem>
            <SelectItem value="90">近90天</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Eye className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{totalViews}</p>
            <p className="text-xs text-muted-foreground">总曝光</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <MousePointerClick className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">{totalConversions}</p>
            <p className="text-xs text-muted-foreground">总转化</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
            <p className="text-xl font-bold">¥{totalRevenue.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">总收入</p>
          </CardContent>
        </Card>
      </div>

      {channelData.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            暂无渠道数据，请先创建推广活动
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Bar chart - channel comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">渠道效果对比</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="views" name="曝光" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conversions" name="转化" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue pie chart */}
          {pieData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">收入来源占比</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => `¥${val.toFixed(0)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Channel detail table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">渠道明细</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 font-medium text-muted-foreground">渠道</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">曝光</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">转化</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">转化率</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">收入</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((ch) => (
                      <tr key={ch.channel} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="p-3 font-medium">{ch.label}</td>
                        <td className="p-3 text-right">{ch.views}</td>
                        <td className="p-3 text-right font-semibold text-primary">{ch.conversions}</td>
                        <td className="p-3 text-right">{ch.conversionRate}%</td>
                        <td className="p-3 text-right font-semibold">¥{ch.revenue.toFixed(0)}</td>
                        <td className="p-3 text-right">
                          {ch.roi > 0 ? (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {ch.roi}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
