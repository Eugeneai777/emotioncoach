import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCoachingPrepaid, PrepaidTransaction } from "@/hooks/useCoachingPrepaid";
import { Loader2, ArrowUpCircle, ArrowDownCircle, RotateCcw, Settings } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface PrepaidTransactionListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTransactionIcon = (type: PrepaidTransaction['type']) => {
  switch (type) {
    case 'recharge':
      return <ArrowUpCircle className="w-5 h-5 text-green-500" />;
    case 'consume':
      return <ArrowDownCircle className="w-5 h-5 text-orange-500" />;
    case 'refund':
      return <RotateCcw className="w-5 h-5 text-blue-500" />;
    case 'admin_adjust':
      return <Settings className="w-5 h-5 text-gray-500" />;
  }
};

const getTransactionLabel = (type: PrepaidTransaction['type']) => {
  switch (type) {
    case 'recharge':
      return '充值';
    case 'consume':
      return '消费';
    case 'refund':
      return '退款';
    case 'admin_adjust':
      return '调整';
  }
};

export function PrepaidTransactionList({ open, onOpenChange }: PrepaidTransactionListProps) {
  const { transactions, isLoadingTransactions, fetchTransactions } = useCoachingPrepaid();

  useEffect(() => {
    if (open) {
      fetchTransactions(50);
    }
  }, [open, fetchTransactions]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh]">
        <SheetHeader>
          <SheetTitle>交易记录</SheetTitle>
        </SheetHeader>

        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p>暂无交易记录</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(70vh-80px)] mt-4">
            <div className="space-y-3 pr-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {getTransactionIcon(tx.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {getTransactionLabel(tx.type)}
                      </span>
                      <span
                        className={`font-semibold ${
                          tx.amount > 0 ? 'text-green-600' : 'text-orange-600'
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}¥{Math.abs(tx.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground truncate max-w-[60%]">
                        {tx.description || '-'}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        余额 ¥{tx.balance_after.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(tx.created_at), 'MM-dd HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
