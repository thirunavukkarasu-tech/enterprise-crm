# Follow-up Management API

Base path: `/api/v1/followups` — every route requires a valid access token.

## Visibility & Permissions

Same ownership model as the rest of the app: Admin/HR/Manager have
org-wide access; an Employee only sees/modifies follow-ups where
`assignedTo` is their own user id.

## Endpoints

| Method | Path                              | Description |
|--------|------------------------------------|--------------|
| GET    | `/followups`                        | Paginated, searchable, filterable, sortable list |
| POST   | `/followups`                         | Schedule a call, meeting, or email follow-up |
| GET    | `/followups/:id`                     | Full follow-up detail |
| PATCH  | `/followups/:id`                     | Partial update (reschedule, change status, reassign) |
| DELETE | `/followups/:id`                     | **Soft** delete |
| GET    | `/followups/customer/:customerId`     | Customer interaction history (see below) |

### `GET /followups` — query params

| Param        | Type   | Notes |
|--------------|--------|-------|
| `page` / `limit` | int  | default `1` / `10`, `limit` max `100` |
| `q`             | string | free-text match against subject |
| `type`           | enum   | `call \| meeting \| email` |
| `status`         | enum   | `scheduled \| completed \| cancelled \| no_show` |
| `relatedCustomer` | ObjectId | filter to one customer |
| `dateFrom` / `dateTo` | ISO date | filter by `scheduledAt` range |
| `sortBy`         | enum   | `subject \| scheduledAt \| status \| createdAt` (list defaults to `scheduledAt` ascending) |
| `sortOrder`       | enum   | `asc \| desc` |

## Customer Interaction History

`GET /followups/customer/:customerId` returns every follow-up tied to a
customer, newest first — this is what powers the "Interaction History"
panel on the Customer Details page (`client/src/pages/customers/components/CustomerInteractionHistory.jsx`).
It's the same `FollowUp` collection and the same service used by the main
list, just pre-filtered and without pagination (capped via `limit`,
default 20) since it's rendered inside a card rather than a full page.

## Design Note: Every Follow-up Belongs to a Customer

`relatedCustomer` is a **required** field on the schema — a follow-up
can't be scheduled floating free of any customer record, though
`relatedLead` is available as optional context for follow-ups scheduled
before a lead has converted. This is a deliberate scope decision: the
Interaction History feature this module exists to power is fundamentally
a customer-detail-page feature, so tying every follow-up to a customer
keeps that query a simple, always-correct `find({ relatedCustomer })`
rather than needing to reconcile follow-ups that exist only against a
lead. The trade-off: a rep can't log a quick call with a lead who hasn't
been converted yet. If that becomes a real need, `relatedCustomer` would
need to become optional with a validator requiring at least one of
`relatedCustomer`/`relatedLead` — see `server/src/validators/followup.validators.js`
as the place that constraint would move to.

## Reminder Notifications

Same mechanism as Tasks (see `docs/API_TASKS.md`) — set `reminderAt`, and
the shared cron sweep (`server/src/jobs/reminderSweep.js`) notifies the
assignee once it's due, without re-notifying on the next tick.

## MongoDB Schema Highlights

- Compound index `{ assignedTo: 1, isDeleted: 1, scheduledAt: 1 }` covers
  "my upcoming follow-ups, soonest first."
- Compound index `{ relatedCustomer: 1, isDeleted: 1, scheduledAt: -1 }`
  covers the interaction-history query directly.
- A `FollowUp` has exactly one `notes` field (not an embedded array like
  Task comments) — it represents a single discrete scheduled interaction,
  not an open-ended discussion thread.
