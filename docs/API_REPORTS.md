# Reports & Analytics API

Base path: `/api/v1/reports` — every route requires a valid access token.

## Visibility & Permissions

Same ownership model as the rest of the app: Admin/HR/Manager see org-wide
figures; an Employee's reports are transparently scoped to their own
records (`server/src/utils/scope.js`). Two report sections go further and
are **omitted entirely** for Employees rather than just being scoped to
"only me," since a leaderboard of one person isn't meaningful:
`salesPerformance` (Sales Report) and `teamProductivity` (Task Report)
both return an empty array for an Employee caller.

## Endpoints

| Method | Path                  | Description |
|--------|------------------------|--------------|
| GET    | `/reports/sales`         | Revenue trend, totals, sales performance by rep |
| GET    | `/reports/customers`      | Growth trend, active vs. inactive, segmentation |
| GET    | `/reports/leads`           | Conversion funnel, source analysis |
| GET    | `/reports/tasks`            | Status breakdown, overdue count, team productivity |
| GET    | `/reports/export`           | Download the underlying records as CSV or Excel |

### Common query params (`/sales`, `/customers`, `/leads`, `/tasks`)

| Param     | Type | Notes |
|-----------|------|-------|
| `from` / `to` | ISO date | Defaults to the trailing 365 days when omitted |
| `groupBy`      | `month \| year` | Only affects `/sales` and `/customers` (their trend charts); ignored by `/leads` and `/tasks`, which report totals for the whole range rather than a period trend |

### `GET /reports/export` — query params

| Param    | Type | Notes |
|----------|------|-------|
| `type`     | `sales \| customers \| leads \| tasks` | required |
| `format`    | `csv \| xlsx` | required |
| `from` / `to` | ISO date | same defaulting as the report endpoints |

Capped at 5,000 rows per export. Returns the file directly (`Content-Type`
+ `Content-Disposition: attachment`), not a JSON envelope.

## Example — `GET /reports/sales?groupBy=month`

```json
{
  "success": true,
  "message": "Sales report fetched",
  "data": {
    "trend": [{ "period": "Mar", "revenue": 42000, "deals": 6 }, "..."],
    "totals": { "revenue": 312400, "deals": 41, "avgDealSize": 7620, "trend": 12.4 },
    "salesPerformance": [
      { "userId": "...", "name": "Priya Patel", "role": "employee", "dealsWon": 9, "dealsLost": 2, "revenue": 84200, "winRate": 81.8 }
    ]
  }
}
```

## Reports vs. Export: Two Different Data Shapes on Purpose

Report endpoints return **pre-aggregated** numbers (trend buckets, status
breakdowns, funnel counts) shaped for charts — computed via MongoDB
`$facet` pipelines so multiple breakdowns of the same collection come back
in a single round-trip. Export endpoints return the **underlying records**
(the actual opportunities/customers/leads/tasks in range) so a manager can
open the file and pivot/filter further in Excel — restating the chart
numbers as a spreadsheet wouldn't be useful for that. See
`server/src/services/report.service.js` vs. `reportExport.service.js`.

## Performance Notes

- Every report query uses a single `$facet` aggregation to compute several
  breakdowns (trend, totals, previous-period comparison, per-rep pivot) in
  one round-trip to MongoDB instead of running four separate queries.
- Trend charts are **gap-filled**: a month with zero activity still
  appears as a `0` data point (via `buildPeriodBuckets`), rather than
  being silently skipped and making the x-axis look irregular.
- Per-rep breakdowns batch-fetch user names in one `User.find({ _id: { $in: [...] } })`
  call after the aggregation, rather than a `$lookup` per row or N+1
  queries — see `fetchUsersById` in `report.service.js`.
- `resolveDateRange` defaults to the trailing 365 days when no `from`/`to`
  is supplied, so an unfiltered request can't accidentally trigger a
  full-collection scan on a years-old dataset.

## MongoDB Notes

Reports reuse the exact same collections and indexes established in
earlier phases (`Opportunity.stage`, `Customer.createdAt`,
`Lead.status`/`source`, `Task.status`/`dueDate`, etc.) — no new indexes
were required for this module, which is itself a signal that the earlier
phases' indexing was planned with reporting queries in mind, not just the
CRUD list-page queries they were originally added for.
