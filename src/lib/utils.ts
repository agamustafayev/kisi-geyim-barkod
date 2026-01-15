import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateShort(date: string | null): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('az-AZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

export function generateBarcode(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function sortSizes<T extends { olcu: string }>(sizes: T[]): T[] {
  return [...sizes].sort((a, b) => {
    const aIsLetter = isNaN(Number(a.olcu));
    const bIsLetter = isNaN(Number(b.olcu));
    
    // If both are letters or both are numbers, sort alphabetically/numerically
    if (aIsLetter && bIsLetter) {
      // Custom order for letter sizes
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const aIndex = sizeOrder.indexOf(a.olcu);
      const bIndex = sizeOrder.indexOf(b.olcu);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      return a.olcu.localeCompare(b.olcu);
    }
    if (!aIsLetter && !bIsLetter) {
      return Number(a.olcu) - Number(b.olcu);
    }
    
    // Letters come before numbers
    return aIsLetter ? -1 : 1;
  });
}

// Sound utilities
export const playSound = {
  // Success sound (for adding to cart)
  success: () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  },
  
  // Print sound (for receipt printing)
  print: () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.2, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.15);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.15);
  },
  
  // Error sound
  error: () => {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = 300;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.3, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.2);
  }
};
