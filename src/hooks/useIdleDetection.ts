import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';

export const useIdleDetection = (idleTime: number = 180000) => { // 3 minutes default
  const { isScreenLocked, lockScreen } = useAppStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    // Don't reset if already locked - only unlock via button click
    if (isScreenLocked) {
      return;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      lockScreen();
    }, idleTime);
  };

  useEffect(() => {
    // Events that indicate user activity (only for auto-lock, not unlock)
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on any activity (only resets timer, doesn't unlock)
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Start timer on mount
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [idleTime, isScreenLocked]);

  return isScreenLocked;
};
