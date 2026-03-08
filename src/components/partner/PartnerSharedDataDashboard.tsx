import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, TrendingUp, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PartnerSharedDataDashboardProps {
  partnerId: string;
  isAdmin?: boolean;
}

const METRIC_TYPES = [
  { value: "mini_program_visits", label: "小程序访问量", color: "hsl(var(--primary))" },
  { value: "wechat_article_reads", label: "公众号阅读量", color: "hsl(200, 80%, 50%)" },
  { value: "wechat_article_shares", label: "公众号分享数", color: "hsl(150, 60%, 45%)" },
  { value: "new_followers", label: "新增关注", color: "hsl(280, 60%, 55%)" },
  { value: "consultation_count", label: "咨询量", color: "hsl(30, 80%, 55%)" },
  { value: "conversion_count", label: "转化人数", color: "hsl(340, 70%, 50%)" },
];

interface MetricRecord {
  id: string;
  partner_id: string;
  metric_date: string;
  metric_type: string;
  metric_value: number;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export function PartnerSharedDataDashboard({ partnerId, isAdmin = false }: PartnerSharedDataDashboardProps) {
  const [metrics, setMetrics] = useState<MetricRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [formType, setFormType] = useState("mini_program_visits");
  const [formValue, setFormValue] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    loadMetrics();
  }, [partnerId]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("partner_shared_metrics" as any)
        .select("*")
        .eq("partner_id", partnerId)
        .gte("metric_date", thirtyDaysAgo)
        .order("metric_date", { ascending: true });
      if (error) throw error;
      setMetrics((data as any[]) || []);
    } catch (err) {
      console.error("Load metrics error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formValue || isNaN(Number(formValue))) {
      toast.error("请输入有效数值");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("partner_shared_metrics" as any)
        .upsert({
          partner_id: partnerId,
          metric_date: formDate,
          metric_type: formType,
          metric_value: Number(formValue),
          notes: formNotes || null,
          recorded_by: userData.user?.id || null,
        } as any, { onConflict: "partner_id,metric_date,metric_type" });
      if (error) throw error;
      toast.success("数据已保存");
      setFormValue("");
      setFormNotes("");
      setShowForm(false);
      loadMetrics();
    } catch (err: any) {
      toast.error("保存失败: " + (err.message || "请重试"));
    } finally {
      setSaving(false);
    }
  };

  // Transform metrics for chart
  const chartData = useMemo(() => {
    const dateMap = new Map<string, Record<string, number>>();
    metrics.forEach((m) => {
      const existing = dateMap.get(m.metric_date) || {};
      existing[m.metric_type] = m.metric_value;
      dateMap.set(m.metric_date, existing);
    });
    return Array.from(dateMap.entries())
      .map(([date, values]) => ({ date: format(new Date(date), "MM/dd"), ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics]);

  // Summary cards
  const summaryData = useMemo(() => {
    return METRIC_TYPES.map((type) => {
      const typeMetrics = metrics.filter((m) => m.metric_type === type.value);
      const total = typeMetrics.reduce((sum, m) => sum + m.metric_value, 0);
      const latest = typeMetrics[typeMetrics.length - 1]?.metric_value || 0;
      return { ...type, total, latest };
    }).filter((s) => s.total > 0);
  }, [metrics]);

  const activeMetricTypes = useMemo(() => {
    const types = new Set(metrics.map((m) => m.metric_type));
    return METRIC_TYPES.filter((t) => types.has(t.value));
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {summaryData.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {summaryData.map((s) => (
            <Card key={s.value}>
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className="text-lg font-bold mt-1">{s.latest}</div>
                <div className="text-xs text-muted-foreground">累计 {s.total}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trend Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              数据趋势（近30天）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                {activeMetricTypes.map((type) => (
                  <Line
                    key={type.value}
                    type="monotone"
                    dataKey={type.value}
                    name={type.label}
                    stroke={type.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {metrics.length === 0 && !showForm && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>还没有运营数据</p>
            {isAdmin && <p className="text-sm mt-1">点击下方按钮录入数据</p>}
          </CardContent>
        </Card>
      )}

      {/* Admin: Add Data Form */}
      {isAdmin && (
        <>
          {!showForm ? (
            <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              录入数据
            </Button>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">录入运营数据</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">日期</Label>
                    <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">指标类型</Label>
                    <Select value={formType} onValueChange={setFormType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {METRIC_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">数值</Label>
                  <Input
                    type="number"
                    placeholder="输入数值"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">备注（可选）</Label>
                  <Textarea
                    placeholder="备注信息"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={saving} size="sm">
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    保存
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>取消</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
