import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Wallet, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PaymentMethod = 'prepaid' | 'wechat';

interface PaymentMethodSelectorProps {
  price: number;
  prepaidBalance: number;
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onRechargeClick?: () => void;
}

export function PaymentMethodSelector({
  price,
  prepaidBalance,
  selectedMethod,
  onMethodChange,
  onRechargeClick,
}: PaymentMethodSelectorProps) {
  const hasEnoughBalance = prepaidBalance >= price;
  const remainingAfterPay = prepaidBalance - price;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">选择支付方式</p>
      
      <RadioGroup
        value={selectedMethod}
        onValueChange={(value) => onMethodChange(value as PaymentMethod)}
        className="space-y-2"
      >
        {/* 预付卡余额 */}
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
            selectedMethod === 'prepaid'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
          } ${!hasEnoughBalance ? 'opacity-60' : ''}`}
          onClick={() => hasEnoughBalance && onMethodChange('prepaid')}
        >
          <RadioGroupItem
            value="prepaid"
            id="prepaid"
            disabled={!hasEnoughBalance}
          />
          <Label
            htmlFor="prepaid"
            className={`flex-1 cursor-pointer ${!hasEnoughBalance ? 'cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                <span className="font-medium">预付卡余额</span>
              </div>
              <span className="text-primary font-semibold">¥{prepaidBalance.toFixed(2)}</span>
            </div>
            
            {hasEnoughBalance ? (
              <p className="text-xs text-muted-foreground mt-1">
                本次消费 ¥{price}，剩余 ¥{remainingAfterPay.toFixed(2)}
              </p>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  余额不足，还差 ¥{(price - prepaidBalance).toFixed(2)}
                </p>
                {onRechargeClick && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRechargeClick();
                    }}
                  >
                    去充值
                  </Button>
                )}
              </div>
            )}
          </Label>
        </div>

        {/* 微信支付 */}
        <div
          className={`flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer ${
            selectedMethod === 'wechat'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-muted-foreground/50'
          }`}
          onClick={() => onMethodChange('wechat')}
        >
          <RadioGroupItem value="wechat" id="wechat" />
          <Label htmlFor="wechat" className="flex-1 cursor-pointer">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.295.295a.319.319 0 00.165-.047l1.79-1.075a.865.865 0 01.673-.053c.854.241 1.775.37 2.73.37.266 0 .529-.013.789-.035-.213-.608-.336-1.254-.336-1.926 0-3.556 3.47-6.44 7.75-6.44.266 0 .528.012.788.035C16.75 4.57 13.052 2.188 8.691 2.188z"/>
                <path d="M24 14.967c0-3.455-3.47-6.26-7.75-6.26s-7.75 2.805-7.75 6.26c0 3.455 3.47 6.261 7.75 6.261.881 0 1.725-.115 2.508-.32a.743.743 0 01.578.045l1.548.933a.276.276 0 00.144.041.256.256 0 00.256-.256c0-.062-.025-.123-.041-.185l-.337-1.28a.51.51 0 01.184-.575C22.914 18.68 24 16.95 24 14.967z"/>
              </svg>
              <span className="font-medium">微信支付</span>
            </div>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
