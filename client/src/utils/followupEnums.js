export const FOLLOWUP_TYPES = ['call', 'meeting', 'email'];

export const FOLLOWUP_TYPE_LABELS = { call: 'Call', meeting: 'Meeting', email: 'Email' };

export const FOLLOWUP_STATUSES = ['scheduled', 'completed', 'cancelled', 'no_show'];

export const FOLLOWUP_STATUS_LABELS = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

export const FOLLOWUP_STATUS_TONES = {
  scheduled: 'bg-amber-50 text-amber-600',
  completed: 'bg-brand-50 text-brand-700',
  cancelled: 'bg-surface-200 text-ink-600',
  no_show: 'bg-rose-50 text-rose-600',
};
