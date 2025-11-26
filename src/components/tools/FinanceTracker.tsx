import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinanceRecord {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  date: Date;
}

export const FinanceTracker = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const expenseCategories = ["餐饮", "交通", "购物", "娱乐", "医疗", "教育", "其他"];
  const incomeCategories = ["工资", "奖金", "投资", "副业", "其他"];

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  const loadRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("finance_records")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setRecords(
          data.map((record) => ({
            id: record.id,
            type: record.type as "income" | "expense",
            amount: record.amount,
            category: record.category,
            note: record.note || "",
            date: new Date(record.created_at),
          }))
        );
      }
    } catch (error) {
      console.error("Error loading records:", error);
      toast({
        title: "加载失败",
        description: "无法加载财务记录",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecord = async () => {
    if (!amount || !category) {
      toast({
        title: "请填写完整信息",
        description: "金额和类别为必填项",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("finance_records")
        .insert({
          user_id: user!.id,
          type,
          amount: parseFloat(amount),
          category,
          note: note || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const newRecord: FinanceRecord = {
          id: data.id,
          type: data.type as "income" | "expense",
          amount: data.amount,
          category: data.category,
          note: data.note || "",
          date: new Date(data.created_at),
        };

        setRecords([newRecord, ...records]);
      }

      setAmount("");
      setCategory("");
      setNote("");

      toast({
        title: "记录成功",
        description: `已记录${type === "income" ? "收入" : "支出"} ¥${amount}`,
      });
    } catch (error) {
      console.error("Error adding record:", error);
      toast({
        title: "添加失败",
        description: "无法添加财务记录",
        variant: "destructive",
      });
    }
  };

  const totalIncome = records
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpense = records
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + r.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            财务管理
          </CardTitle>
          <CardDescription>记录收支，掌握财务状况</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总收入</p>
                    <p className="text-2xl font-bold text-green-600">
                      ¥{totalIncome.toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">总支出</p>
                    <p className="text-2xl font-bold text-red-600">
                      ¥{totalExpense.toFixed(2)}
                    </p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">结余</p>
                    <p className={`text-2xl font-bold ${balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                      ¥{balance.toFixed(2)}
                    </p>
                  </div>
                  <Wallet className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 添加记录表单 */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={type} onValueChange={(v: "income" | "expense") => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">支出</SelectItem>
                    <SelectItem value="income">收入</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>金额</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>类别</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
                  </SelectTrigger>
                  <SelectContent>
                    {(type === "expense" ? expenseCategories : incomeCategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>备注（可选）</Label>
                <Input
                  placeholder="添加备注"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleAddRecord} className="w-full">
              添加记录
            </Button>
          </div>

          {/* 记录列表 */}
          <div className="space-y-2">
            <h3 className="font-semibold">最近记录</h3>
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                加载中...
              </p>
            ) : records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无记录，开始记录你的收支吧
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {records.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            record.type === "income"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {record.type === "income" ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{record.category}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.note || "无备注"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.date.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`text-lg font-bold ${
                          record.type === "income" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {record.type === "income" ? "+" : "-"}¥{record.amount.toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
