# Customer Management API

Base path: `/api/v1/customers` — every route requires a valid access token.

## Visibility & Permissions

- **Admin / HR / Manager**: full org-wide read/write access to all customers.
- **Employee**: can only read/update/delete customers where `assignedTo` is
  their own user id (`server/src/services/customer.service.js#assertAccess`).
  Listing, exporting, and reading a single customer are all transparently
  scoped — attempting to read/modify someone else's customer by id returns
  `403 Forbidden`, not a silent empty result.
- Only Admin/HR/Manager may set or change `assignedTo` on create/update; an
  Employee-submitted `assignedTo` is ignored server-side in favor of
  themselves.

## Endpoints

| Method | Path                    | Description |
|--------|-------------------------|--------------|
| GET    | `/customers`              | Paginated, searchable, filterable, sortable list |
| POST   | `/customers`               | Create a customer |
| GET    | `/customers/:id`           | Full customer detail, including notes |
| PATCH  | `/customers/:id`           | Partial update |
| DELETE | `/customers/:id`           | **Soft** delete (`isDeleted: true`) |
| POST   | `/customers/:id/notes`     | Add a note |
| GET    | `/customers/:id/timeline`  | Activity log for this customer |
| GET    | `/customers/export`        | Download filtered results as CSV |
| POST   | `/customers/import`        | Bulk-create from an uploaded CSV |

### `GET /customers` — query params

| Param        | Type   | Notes |
|--------------|--------|-------|
| `page`         | int    | default `1` |
| `limit`        | int    | default `10`, max `100` |
| `q`             | string | free-text match against name/email/company |
| `status`        | enum   | `lead \| prospect \| active \| inactive \| churned` |
| `tag`            | string | exact tag match (case-insensitive) |
| `industry`       | string | exact match (case-insensitive) |
| `assignedTo`     | ObjectId | Admin/HR/Manager only — filter by owner |
| `dateFrom` / `dateTo` | ISO date | filter by `createdAt` range |
| `sortBy`         | enum   | `name \| createdAt \| company \| status` |
| `sortOrder`       | enum   | `asc \| desc` |

Response includes pagination metadata:
```json
{
  "success": true,
  "message": "Customers fetched",
  "data": [ /* customers */ ],
  "meta": { "page": 1, "limit": 10, "total": 132, "totalPages": 14 }
}
```

### Soft Delete

`DELETE /customers/:id` never removes the document — it sets
`isDeleted: true` and `deletedAt`. Every read path (`list`, `getById`,
`export`) filters `isDeleted: false`. This matters because customers are
referenced by Opportunities, Tasks, and the Activity log; hard-deleting
would either orphan those records or require cascading deletes across
modules that don't exist yet. A restore endpoint for admins is a natural
follow-up once the Settings/Admin module exists.

### Notes vs. Timeline — two different things

- **Notes** (`customer.notes`) are free-text entries a rep writes about the
  customer — embedded directly on the Customer document since they're only
  ever read alongside their parent record.
- **Timeline** (`GET /customers/:id/timeline`) is the system-generated
  activity log (created, updated, status changed, note added, deleted) —
  backed by the same `Activity` collection the main Dashboard timeline uses,
  filtered by `relatedCustomer`.

### CSV Import

`POST /customers/import` — `multipart/form-data`, field name `file`, max
2MB / 1000 rows. Required columns: `name`, `email`. Optional: `phone`,
`company`, `industry`, `address`, `status`, `tags` (semicolon-separated,
e.g. `vip;enterprise`). Invalid rows (bad email, duplicate email, missing
required column) are skipped individually — the import is never all-or-
nothing, and the response summarizes exactly which rows failed and why:
```json
{
  "success": true,
  "message": "Import complete",
  "data": {
    "totalRows": 50,
    "created": 47,
    "skipped": 3,
    "errors": [{ "row": 12, "reason": "Invalid email: not-an-email" }]
  }
}
```

### CSV Export

`GET /customers/export` — respects `status`/`tag` filters, capped at 5,000
rows per request, streamed back as `text/csv` with a `Content-Disposition`
attachment header so the browser downloads it directly.

## MongoDB Schema Highlights

- **Partial unique index on `email`**: unique only among non-deleted
  customers (`{ isDeleted: false }`), so a soft-deleted contact's email
  doesn't permanently block re-adding that person.
- **Compound index** `{ assignedTo: 1, isDeleted: 1, createdAt: -1 }`
  covers the single most common query (a rep's own active customers,
  newest first) in one index scan.
- **Text index** on `name`/`company`/`email` exists for future full-text
  search, but the current search box uses an escaped regex `$or` query
  instead — MongoDB's `$text` only matches whole words, which is a poor
  fit for "start typing a name" search UX at this data scale. A move to
  Atlas Search/Elasticsearch is the natural next step if the dataset grows
  far beyond what a regex scan can serve quickly.
