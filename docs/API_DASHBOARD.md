# Dashboard API

Base path: `/api/v1/dashboard` — every route requires a valid access token
(`Authorization: Bearer <token>`).

## Visibility Rules

- **Admin / HR / Manager**: see organization-wide data.
- **Employee**: every endpoint (except `/top-performers`, which they cannot
  access at all) is transparently scoped to records where `assignedTo` /
  `actor` is their own user id. This is enforced in
  `server/src/utils/scope.js` and applied inside the service layer — it
  cannot be bypassed by calling the endpoint directly with different query
  params.
- **`GET /dashboard/top-performers`** is additionally restricted to
  Admin/HR/Manager via `authorize()` middleware — a `403` is returned for
  Employees rather than an empty/self-only result, since "top performers"
  is inherently a cross-team view.

## Endpoints

| Method | Path                          | Query params            | Notes |
|--------|-------------------------------|--------------------------|-------|
| GET    | `/kpis`                        | —                          | Total customers, active leads, open opportunities, monthly revenue — each with a month-over-month trend % |
| GET    | `/pipeline`                    | —                          | Opportunity count + value grouped by stage, all 6 stages always present |
| GET    | `/revenue-analytics`           | `months` (1–24, default 6) | Closed-won revenue per month, zero-filled for months with no activity |
| GET    | `/lead-conversion`             | —                          | Lead count per status (funnel) + overall conversion rate |
| GET    | `/activities`                   | `limit` (1–50, default 10) | Most recent activity log entries, newest first |
| GET    | `/tasks/upcoming`               | `limit` (1–50, default 5)  | Non-completed tasks sorted by due date ascending |
| GET    | `/notifications`                | `limit` (1–50, default 10) | Recent notifications for the current user + unread count |
| GET    | `/top-performers`               | `limit` (1–50, default 5)  | Sales reps ranked by closed-won revenue. **Admin/HR/Manager only.** |
| GET    | `/customer-growth`              | `months` (1–24, default 6) | New customers per month + running cumulative total |

All responses use the standard envelope: `{ success, message, data }`.

### Example — `GET /dashboard/kpis`
```json
{
  "success": true,
  "message": "KPIs fetched",
  "data": {
    "totalCustomers": { "value": 342, "trend": 4.2 },
    "activeLeads": { "value": 58, "trend": -2.1 },
    "opportunities": { "value": 24, "totalValue": 186500, "trend": 8.7 },
    "monthlyRevenue": { "value": 92400, "trend": 15.3 }
  }
}
```

`trend` is a percentage change vs. the equivalent figure last calendar
month (e.g. new customers created this month vs. last month) — positive
values render with an up-arrow, negative with a down-arrow, on the frontend.

## Data Source

Dashboard numbers are computed live via MongoDB aggregation pipelines over
the `Customer`, `Lead`, `Opportunity`, `Task`, `Activity`, and
`Notification` collections (`server/src/services/dashboard.service.js`) —
nothing on the dashboard is mocked or hardcoded. These collections currently
have minimal schemas (just enough for meaningful aggregation); full CRUD
modules for each ship in later phases without changing this contract.

Run `npm run seed` inside `server/` to populate realistic demo data across
all of these collections.
