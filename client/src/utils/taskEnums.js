export const TASK_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

export const TASK_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const TASK_STATUS_TONES = {
  pending: 'bg-surface-200 text-ink-700',
  in_progress: 'bg-amber-50 text-amber-600',
  completed: 'bg-brand-50 text-brand-700',
  cancelled: 'bg-rose-50 text-rose-600',
};

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const TASK_PRIORITY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' };

export const TASK_PRIORITY_TONES = {
  low: 'bg-surface-200 text-ink-700',
  medium: 'bg-amber-50 text-amber-600',
  high: 'bg-rose-50 text-rose-600',
  critical: 'bg-rose-100 text-rose-700',
};

export const TASK_CATEGORIES = ['call', 'email', 'meeting', 'demo', 'proposal', 'administrative', 'other'];

export const TASK_CATEGORY_LABELS = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  demo: 'Demo',
  proposal: 'Proposal',
  administrative: 'Administrative',
  other: 'Other',
};
