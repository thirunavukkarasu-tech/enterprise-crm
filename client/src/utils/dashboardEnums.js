export const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export const LEAD_STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

export const OPPORTUNITY_STAGES = [
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
];

export const STAGE_LABELS = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

// Ordered to progress from cool (early stage) to the brand teal (won) — rose
// reserved exclusively for the lost/at-risk state, consistent with its use
// elsewhere in the app (errors, destructive actions).
export const STAGE_COLORS = {
  prospecting: '#94A3B8',
  qualification: '#60A5FA',
  proposal: '#F5A524',
  negotiation: '#FB923C',
  closed_won: '#0EA5A0',
  closed_lost: '#E11D48',
};

export const PRIORITY_COLORS = {
  low: { bg: 'bg-surface-200', text: 'text-ink-700' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-600' },
  high: { bg: 'bg-rose-50', text: 'text-rose-600' },
};

export const ACTIVITY_ICON_TYPE = {
  customer_created: 'user-plus',
  lead_created: 'target',
  lead_status_changed: 'trending-up',
  opportunity_created: 'briefcase',
  opportunity_won: 'trophy',
  opportunity_lost: 'x-circle',
  task_completed: 'check-circle',
  call_logged: 'phone',
  meeting_scheduled: 'calendar',
  note_added: 'sticky-note',
};
