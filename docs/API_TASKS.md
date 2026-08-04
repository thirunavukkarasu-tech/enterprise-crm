# Task Management API

Base path: `/api/v1/tasks` — every route requires a valid access token.

## Visibility & Permissions

Same ownership model as Customers/Leads: Admin/HR/Manager have org-wide
access; an Employee only sees/modifies tasks where `assignedTo` is their
own user id. Only Admin/HR/Manager may set or change `assignedTo` — see
`GET /api/v1/users` below for how the assignee picker is populated.

## Endpoints

| Method | Path                              | Description |
|--------|------------------------------------|--------------|
| GET    | `/tasks`                            | Paginated, searchable, filterable, sortable list |
| POST   | `/tasks`                             | Create a task |
| GET    | `/tasks/:id`                         | Full task detail (comments, attachments) |
| PATCH  | `/tasks/:id`                         | Partial update (status, priority, assignment, ...) |
| DELETE | `/tasks/:id`                         | **Soft** delete |
| POST   | `/tasks/:id/comments`                | Add a comment |
| GET    | `/tasks/:id/timeline`                | Activity log for this task |
| POST   | `/tasks/:id/attachments`             | Upload a file (`multipart/form-data`, field `file`) |
| DELETE | `/tasks/:id/attachments/:attachmentId` | Remove an attachment |

### `GET /tasks` — query params

| Param        | Type   | Notes |
|--------------|--------|-------|
| `page` / `limit` | int  | default `1` / `10`, `limit` max `100` |
| `q`             | string | free-text match against title/description |
| `status`        | enum   | `pending \| in_progress \| completed \| cancelled` |
| `priority`       | enum   | `low \| medium \| high \| critical` |
| `category`       | enum   | `call \| email \| meeting \| demo \| proposal \| administrative \| other` |
| `relatedCustomer` / `relatedLead` | ObjectId | filter tasks linked to a specific record |
| `dueFrom` / `dueTo` | ISO date | filter by `dueDate` range |
| `sortBy`         | enum   | `title \| dueDate \| priority \| status \| createdAt` |
| `sortOrder`       | enum   | `asc \| desc` (list defaults to `dueDate` ascending — soonest due first) |

## Reminders

Setting `reminderAt` schedules an in-app notification. A cron job
(`server/src/jobs/reminderSweep.js`, every minute) finds tasks whose
`reminderAt` has passed and `reminderSent` is still `false`, creates a
`Notification` for the assignee, and flips `reminderSent` so it's never
re-sent. Editing `reminderAt` to a new time automatically resets
`reminderSent` to `false`.

**Scaling note**: the sweep runs in-process via `node-cron`, which only
behaves correctly with a single server instance — running two instances
would double-fire reminders. Moving to a distributed job queue (e.g.
BullMQ + Redis) is the natural next step if this API needs to scale
horizontally.

## Comments vs. Attachments vs. Timeline

- **Comments**: free-text discussion thread on the task, embedded on the
  document (same pattern as Customer/Lead notes).
- **Attachments**: files stored on local disk under `server/uploads/tasks/`
  with randomized filenames; metadata embedded on the task. See
  `docs/API_LEADS.md` for the full rationale (identical pattern).
- **Timeline**: system-generated activity log (created, updated, status
  changed, reassigned, completed, comment added, attachment added),
  backed by the shared `Activity` collection, filtered by `relatedTask`.

## `GET /api/v1/users`

Not part of the Task module itself, but introduced in this phase to power
the "assign to" pickers across Tasks, Follow-ups, and future modules.
Returns active users' `name`, `email`, and `role`. Restricted to Admin/HR/
Manager — an Employee can't reassign anything, so they have no need for
(and no access to) the full user list.

## MongoDB Schema Highlights

- Compound index `{ assignedTo: 1, isDeleted: 1, dueDate: 1 }` covers "my
  open tasks, soonest due first" — the dominant query for both this
  module's list page and the Dashboard's "Upcoming Tasks" widget.
- Separate index `{ reminderAt: 1, reminderSent: 1 }` supports the
  reminder sweep's "what's due and not yet notified" query without a
  full collection scan.
