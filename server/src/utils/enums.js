/**
 * Domain enums shared across models, the dashboard aggregation service, and
 * the seed script. Centralizing these (rather than inlining string arrays
 * per-model) means a new stage/status is added in exactly one place and
 * every consumer — schema validation, pipeline ordering, chart labels —
 * stays in sync.
 */

// Ordered deliberately — this order drives pipeline chart ordering.
export const LEAD_STATUSES = Object.freeze([
  'new',
  'contacted',
  'qualified',
  'proposal',
  'won',
  'lost',
]);

export const LEAD_SOURCES = Object.freeze([
  'website',
  'referral',
  'cold_call',
  'social_media',
  'trade_show',
  'advertisement',
  'other',
]);

// Ordered deliberately — this order drives sales-pipeline chart ordering.
export const OPPORTUNITY_STAGES = Object.freeze([
  'prospecting',
  'qualification',
  'proposal',
  'negotiation',
  'closed_won',
  'closed_lost',
]);

export const OPEN_OPPORTUNITY_STAGES = Object.freeze(
  OPPORTUNITY_STAGES.filter((s) => s !== 'closed_won' && s !== 'closed_lost')
);

export const TASK_STATUSES = Object.freeze(['pending', 'in_progress', 'completed']);
export const TASK_PRIORITIES = Object.freeze(['low', 'medium', 'high']);

// Kept distinct from TASK_PRIORITIES (even though the values overlap today)
// since leads and tasks are independent domain concepts that happen to
// share a shape — collapsing them into one shared enum would couple two
// modules that should be free to diverge later (e.g. an "urgent" lead tier).
export const LEAD_PRIORITIES = Object.freeze(['low', 'medium', 'high']);

export const CUSTOMER_STATUSES = Object.freeze(['lead', 'prospect', 'active', 'inactive', 'churned']);

export const ACTIVITY_TYPES = Object.freeze([
  'customer_created',
  'customer_updated',
  'customer_status_changed',
  'customer_deleted',
  'lead_created',
  'lead_updated',
  'lead_status_changed',
  'lead_assigned',
  'lead_converted',
  'lead_deleted',
  'lead_note_added',
  'lead_attachment_added',
  'opportunity_created',
  'opportunity_won',
  'opportunity_lost',
  'task_completed',
  'call_logged',
  'meeting_scheduled',
  'note_added',
]);

export const NOTIFICATION_TYPES = Object.freeze(['task', 'lead', 'opportunity', 'system']);
