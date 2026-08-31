import type { AssetType } from '@/types';

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateLong(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function assetTypeLabel(t: AssetType): string {
  switch (t) {
    case 'dental':
      return 'Dental Practice';
    case 'asc':
      return 'Ambulatory Surgical Center';
    case 'dual':
      return 'Dual-purpose';
  }
}

export function assetTypeShort(t: AssetType): string {
  switch (t) {
    case 'dental':
      return 'Dental';
    case 'asc':
      return 'ASC';
    case 'dual':
      return 'Dual';
  }
}

export function percentChange(current: number, prior: number): number {
  return ((current - prior) / prior) * 100;
}
