import { formatDistanceToNowStrict } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact' });

export const formatCurrency = (value) => currencyFormatter.format(value || 0);

/** Used in tight spaces (KPI cards) — e.g. $128.4K instead of $128,400. */
export const formatCompactCurrency = (value) => compactCurrencyFormatter.format(value || 0);

export const formatCompactNumber = (value) => compactNumberFormatter.format(value || 0);

export const formatRelativeTime = (date) => {
  if (!date) return '';
  return `${formatDistanceToNowStrict(new Date(date))} ago`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const formatDueDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const today = new Date();
  const diffDays = Math.round((d.setHours(0, 0, 0, 0) - today.setHours(0, 0, 0, 0)) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays <= 7) return `In ${diffDays}d`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
