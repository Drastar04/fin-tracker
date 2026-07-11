import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol = '$', decimals = 2): string {
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formatter.format(Math.abs(amount))}`;
}

export function formatDate(dateStr: string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const date = new Date(dateStr + 'T00:00:00');
  const formats: Record<string, Intl.DateTimeFormatOptions> = {
    short:  { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long:   { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  };
  return date.toLocaleDateString('en-US', formats[format]);
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(dateStr, 'short');
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function percentageColor(pct: number): string {
  if (pct >= 100) return 'bg-danger';
  if (pct >= 85)  return 'bg-warning';
  if (pct >= 60)  return 'bg-brand-500';
  return 'bg-income';
}

export function transactionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    income: 'Income',
    expense: 'Expense',
    transfer: 'Transfer',
  };
  return map[type] || type;
}
