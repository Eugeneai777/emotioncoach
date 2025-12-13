import React, { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { NetworkCheckDialog } from './NetworkCheckDialog';

interface CallButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
  className?: string;
  skipNetworkCheck?: boolean;
}

export function CallButton({ 
  onClick, 
  disabled = false, 
  variant = 'default',
  className,
  skipNetworkCheck = false,
}: CallButtonProps) {
  const { quality, rtt, isChecking, checkNetwork } = useNetworkQuality();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingCall, setPendingCall] = useState(false);

  const handleClick = async () => {
    if (skipNetworkCheck) {
      onClick();
      return;
    }

    setPendingCall(true);
    const result = await checkNetwork();
    setPendingCall(false);

    if (result.quality === 'excellent' || result.quality === 'good') {
      onClick();
    } else {
      setShowDialog(true);
    }
  };

  const handleContinue = () => {
    setShowDialog(false);
    onClick();
  };

  const handleCancel = () => {
    setShowDialog(false);
  };

  const isLoading = isChecking || pendingCall;

  if (variant === 'compact') {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={handleClick}
          disabled={disabled || isLoading}
          className={cn(
            "gap-1.5 text-teal-600 border-teal-200 hover:bg-teal-50 hover:border-teal-300",
            className
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Phone className="w-4 h-4" />
          )}
          {isLoading ? '检测网络...' : '语音通话'}
        </Button>
        <NetworkCheckDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          quality={quality}
          rtt={rtt}
          onContinue={handleContinue}
          onCancel={handleCancel}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(
          "gap-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Phone className="w-5 h-5" />
        )}
        {isLoading ? '检测网络中...' : '发起语音通话'}
      </Button>
      <NetworkCheckDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        quality={quality}
        rtt={rtt}
        onContinue={handleContinue}
        onCancel={handleCancel}
      />
    </>
  );
}
