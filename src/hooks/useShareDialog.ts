import { useState, useRef, useCallback } from "react";

/**
 * Hook to manage share dialog state and refs
 * Use this with ShareDialogBase for consistent share dialog behavior
 */
export function useShareDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const exportCardRef = useRef<HTMLDivElement>(null);

  const openDialog = useCallback(() => {
    setIsOpen(true);
    // Don't reset cardReady here — preserve state for second-time opens
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleCardReady = useCallback(() => {
    setCardReady(true);
  }, []);

  return {
    isOpen,
    setIsOpen,
    cardReady,
    setCardReady,
    exportCardRef,
    openDialog,
    closeDialog,
    handleCardReady,
  };
}

export default useShareDialog;
