import { useEffect, useState, useCallback } from 'react';

interface UseBarkodOxucuOptions {
  onScan: (barkod: string) => void;
  minLength?: number;
  timeout?: number;
  enabled?: boolean;
}

export const useBarkodOxucu = ({
  onScan,
  minLength = 6,
  timeout = 250,
  enabled = true,
}: UseBarkodOxucuOptions) => {
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const handleScan = useCallback(
    (barkod: string) => {
      if (barkod.length >= minLength) {
        onScan(barkod);
      }
    },
    [onScan, minLength]
  );

  useEffect(() => {
    if (!enabled) return;

    let timeoutId: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeDiff = now - lastKeyTime;

      // If Enter key and buffer has content
      if (e.key === 'Enter' && buffer.length > 0) {
        handleScan(buffer.trim());
        setBuffer('');
        setLastKeyTime(0);
        return;
      }

      // Only single characters (barcode scanner sends characters rapidly)
      if (e.key.length === 1) {
        // If too much time has passed, start fresh
        if (timeDiff > timeout && buffer.length > 0) {
          setBuffer(e.key);
        } else {
          setBuffer((prev) => prev + e.key);
        }
        setLastKeyTime(now);

        // Clear buffer after timeout
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setBuffer('');
          setLastKeyTime(0);
        }, timeout);
      }
    };

    window.addEventListener('keypress', handleKeyPress);

    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeoutId);
    };
  }, [buffer, lastKeyTime, timeout, enabled, handleScan]);

  return {
    buffer,
    isScanning: buffer.length > 0,
    clearBuffer: () => setBuffer(''),
  };
};
