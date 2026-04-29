import React, { Suspense, useState } from 'react';
import type { IntroShareConfig } from '@/config/introShareConfig';

const IntroShareDialog = React.lazy(() =>
  import('./IntroShareDialog').then((m) => ({ default: m.IntroShareDialog }))
);

interface LazyIntroShareDialogProps {
  config: IntroShareConfig;
  trigger: React.ReactElement;
  partnerCode?: string;
}

export const LazyIntroShareDialog = ({ config, trigger, partnerCode }: LazyIntroShareDialogProps) => {
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    const triggerProps = trigger.props as {
      onClick?: (event: React.MouseEvent) => void;
      onPointerDown?: (event: React.PointerEvent) => void;
    };

    return React.cloneElement(trigger, {
      onClick: (event: React.MouseEvent) => {
        triggerProps.onClick?.(event);
        setLoaded(true);
      },
      onPointerDown: (event: React.PointerEvent) => {
        triggerProps.onPointerDown?.(event);
        void import('./IntroShareDialog');
      },
    });
  }

  return (
    <Suspense fallback={trigger}>
      <IntroShareDialog config={config} trigger={trigger} partnerCode={partnerCode} initialOpen />
    </Suspense>
  );
};

export default LazyIntroShareDialog;