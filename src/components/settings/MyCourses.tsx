import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Purchase {
  id: string;
  camp_name: string;
  camp_type: string;
  payment_status: string | null;
  purchased_at: string | null;
  purchase_price: number;
}

export function MyCourses({ userId }: { userId: string }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("user_camp_purchases")
      .select("id, camp_name, camp_type, payment_status, purchased_at, purchase_price")
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false })
      .then(({ data }) => {
        if (data) setPurchases(data);
        setLoading(false);
      });
  }, [userId]);

  if (loading || purchases.length === 0) return null;

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          我的训练营
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {purchases.map((p) => {
          const isPaid = p.payment_status === "paid";
          return (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                {isPaid ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <BookOpen className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{p.camp_name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {p.purchased_at ? format(new Date(p.purchased_at), "yyyy-MM-dd") : "—"}
                  <span className={`font-medium ${isPaid ? "text-green-600" : "text-amber-600"}`}>
                    {isPaid ? "已购买" : p.payment_status || "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
