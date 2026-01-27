import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, History, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCoachingPrepaid } from "@/hooks/useCoachingPrepaid";
import { PrepaidRechargeDialog } from "./PrepaidRechargeDialog";
import { PrepaidTransactionList } from "./PrepaidTransactionList";

export function PrepaidBalanceCard() {
  const { currentBalance, totalRecharged, totalSpent, isLoading, refreshBalance } = useCoachingPrepaid();
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-sm">教练咨询预付卡</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-2xl font-bold text-primary">
              ¥ {currentBalance.toFixed(2)}
            </p>
            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              <span>累计充值 ¥{totalRecharged.toFixed(2)}</span>
              <span>累计消费 ¥{totalSpent.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => setShowRechargeDialog(true)}
            >
              充值
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTransactions(true)}
            >
              <History className="w-4 h-4 mr-1" />
              记录
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrepaidRechargeDialog
        open={showRechargeDialog}
        onOpenChange={setShowRechargeDialog}
        onSuccess={refreshBalance}
      />

      <PrepaidTransactionList
        open={showTransactions}
        onOpenChange={setShowTransactions}
      />
    </>
  );
}
