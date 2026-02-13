import { useState, useEffect } from "react";
import { AdminPageLayout } from "../shared/AdminPageLayout";
import { AdminStatCard } from "../shared/AdminStatCard";
import { AdminTableContainer } from "../shared/AdminTableContainer";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ProductRank {
  name: string;
  count: number;
  revenue: number;
}

export default function FlywheelRevenue() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, roi: 0, ltv: 0, orderCount: 0 });
  const [products, setProducts] = useState<ProductRank[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [ordersRes, campaignsRes, usersRes] = await Promise.all([
      supabase.from("orders").select("amount, package_name, user_id").eq("status", "paid").gte("created_at", sevenDaysAgo),
      supabase.from("campaigns" as any).select("promotion_cost").eq("status", "active"),
      supabase.from("orders").select("user_id").eq("status", "paid").gte("created_at", sevenDaysAgo),
    ]);

    const orders = (ordersRes.data || []) as any[];
    const campaigns = (campaignsRes.data || []) as any[];
    const totalRevenue = orders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const totalCost = campaigns.reduce((s, c) => s + (Number(c.promotion_cost) || 0), 0);
    const uniqueUsers = new Set(orders.map(o => o.user_id)).size;

    setStats({
      totalRevenue,
      roi: totalCost > 0 ? Number((totalRevenue / totalCost).toFixed(2)) : 0,
      ltv: uniqueUsers > 0 ? Number((totalRevenue / uniqueUsers).toFixed(0)) : 0,
      orderCount: orders.length,
    });

    // Product ranking
    const productMap: Record<string, ProductRank> = {};
    orders.forEach(o => {
      const name = o.package_name || "未知";
      if (!productMap[name]) productMap[name] = { name, count: 0, revenue: 0 };
      productMap[name].count++;
      productMap[name].revenue += Number(o.amount) || 0;
    });
    setProducts(Object.values(productMap).sort((a, b) => b.revenue - a.revenue));
    setLoading(false);
  };

  return (
    <AdminPageLayout title="收入与ROI分析" description="7天收入、ROI和产品转化排名">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminStatCard label="总收入" value={`¥${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} loading={loading} accent="bg-green-100 text-green-600" />
        <AdminStatCard label="ROI" value={stats.roi > 0 ? `${stats.roi}x` : "N/A"} icon={TrendingUp} loading={loading} accent="bg-blue-100 text-blue-600" />
        <AdminStatCard label="用户LTV" value={`¥${stats.ltv}`} icon={Users} loading={loading} accent="bg-purple-100 text-purple-600" />
        <AdminStatCard label="订单数" value={stats.orderCount} icon={ShoppingCart} loading={loading} accent="bg-amber-100 text-amber-600" />
      </div>

      <AdminTableContainer minWidth={500}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>产品</TableHead>
              <TableHead className="text-right">订单数</TableHead>
              <TableHead className="text-right">收入</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
            ) : products.map(p => (
              <TableRow key={p.name}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-right">{p.count}</TableCell>
                <TableCell className="text-right">¥{p.revenue.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableContainer>
    </AdminPageLayout>
  );
}
