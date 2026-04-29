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
    return React.cloneElement(trigger, {
      onClick: (event: React.MouseEvent) => {
        trigger.props.onClick?.(event);
        setLoaded(true);
      },
      onPointerDown: (event: React.PointerEvent) => {
        trigger.props.onPointerDown?.(event);
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