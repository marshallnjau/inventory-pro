import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCompactNumber(number: number, currency?: string) {
  const formatter = Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  
  if (currency) {
    // If currency is provided, we can either use it as a prefix or use native currency formatting
    // But since the currency in this app is often a symbol string from context, let's just prefix it.
    return `${currency}${formatter.format(number)}`;
  }
  
  return formatter.format(number);
}
