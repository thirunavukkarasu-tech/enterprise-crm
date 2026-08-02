export const CUSTOMER_STATUSES = ['lead', 'prospect', 'active', 'inactive', 'churned'];

export const CUSTOMER_STATUS_LABELS = {
  lead: 'Lead',
  prospect: 'Prospect',
  active: 'Active',
  inactive: 'Inactive',
  churned: 'Churned',
};

export const CUSTOMER_STATUS_TONES = {
  lead: 'bg-surface-200 text-ink-700',
  prospect: 'bg-amber-50 text-amber-600',
  active: 'bg-brand-50 text-brand-700',
  inactive: 'bg-surface-200 text-ink-600',
  churned: 'bg-rose-50 text-rose-600',
};

const TAG_PALETTE = [
  'bg-brand-50 text-brand-700',
  'bg-amber-50 text-amber-600',
  'bg-rose-50 text-rose-600',
  'bg-surface-200 text-ink-700',
];

/** Deterministic color per tag string so the same tag always renders the same color. */
export const tagTone = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_PALETTE[hash % TAG_PALETTE.length];
};
