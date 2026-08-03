# Lead Management API

Base path: `/api/v1/leads` — every route requires a valid access token.

## Visibility & Permissions

Same ownership model as Customers (see `docs/API_CUSTOMERS.md`): Admin/HR/
Manager have org-wide access; an Employee only sees/modifies leads where
`assignedTo` is their own user id, enforced in the service layer
(`server/src/services/lead.service.js#assertAccess`). Only Admin/HR/Manager
may set or change `assignedTo`.

## Endpoints

| Method | Path                              | Description |
|--------|------------------------------------|--------------|
| GET    | `/leads`                            | Paginated, searchable, filterable, sortable list |
| POST   | `/leads`                             | Create a lead |
| GET    | `/leads/:id`                         | Full lead detail (notes, attachments, conversion status) |
| PATCH  | `/leads/:id`                         | Partial update (status, source, priority, assignment, ...) |
| DELETE | `/leads/:id`                         | **Soft** delete (`isDeleted: true`) |
| POST   | `/leads/:id/convert`                 | Convert this lead into a Customer |
| POST   | `/leads/:id/notes`                   | Add a note |
| GET    | `/leads/:id/timeline`                | Activity log for this lead |
| POST   | `/leads/:id/attachments`             | Upload a file (`multipart/form-data`, field `file`) |
| DELETE | `/leads/:id/attachments/:attachmentId` | Remove an attachment |

### `GET /leads` — query params

| Param        | Type   | Notes |
|--------------|--------|-------|
| `page` / `limit` | int  | default `1` / `10`, `limit` max `100` |
| `q`             | string | free-text match against name/email/company |
| `status`        | enum   | `new \| contacted \| qualified \| proposal \| won \| lost` |
| `source`         | enum   | `website \| referral \| cold_call \| social_media \| trade_show \| advertisement \| other` |
| `priority`       | enum   | `low \| medium \| high` |
| `assignedTo`     | ObjectId | Admin/HR/Manager only |
| `dateFrom` / `dateTo` | ISO date | filter by `createdAt` |
| `sortBy`         | enum   | `name \| createdAt \| company \| status \| priority \| estimatedValue` |
| `sortOrder`       | enum   | `asc \| desc` |

The list response omits `notes` and `attachments` (`.select('-attachments -notes')`)
to keep the paginated payload light — both are fetched in full via
`GET /leads/:id` when a single lead is opened.

### Status, Source, Priority — updated via the same `PATCH` endpoint

There's no separate "change status" or "assign lead" endpoint — `PATCH
/leads/:id` accepts a partial update, and the service layer inspects *which*
field changed to log the right activity type (`lead_status_changed` vs.
`lead_assigned` vs. a generic `lead_updated`). This mirrors the Customer
module's pattern and keeps the API surface small; a dedicated endpoint per
field would be pure duplication of the same update path.

### Lead Conversion (`POST /leads/:id/convert`)

Creates a new `Customer` from the lead's `name`/`email`/`phone`/`company`
(status defaults to `prospect`), sets `lead.convertedToCustomer` and
`convertedAt`, and marks the lead `status: 'won'`. The original Lead
document is **never deleted or mutated away** — it stays queryable so
reporting (e.g. "conversion rate by source") still has the original record.
Guards:
- `400` if the lead has no email, or was already converted.
- `409` if a non-deleted Customer already exists with that email.

Activity is logged on **both** the lead's timeline (`lead_converted`) and
the new customer's timeline (`customer_created`, with
`metadata.convertedFromLeadId`), so either record's history explains the
conversion.

```json
{
  "success": true,
  "message": "Lead converted to customer",
  "data": {
    "lead": { "...": "...", "status": "won", "convertedToCustomer": "..." },
    "customer": { "...": "..." }
  }
}
```

### Attachments

- Stored on local disk under `server/uploads/leads/` with a randomized
  filename (never the client-supplied name — avoids path traversal and
  collisions); the human-readable original name is kept separately in
  MongoDB and shown in the UI.
- Served statically at `/uploads/leads/<fileName>`, proxied by Vite in dev
  so it's same-origin with the app (no CORS/CORP loosening needed).
- 10MB per file. Allowed types: PNG/JPEG/WebP, PDF, Word, Excel, plain
  text/CSV.
- Deleting an attachment removes both the DB reference and the file on
  disk (best-effort — a missing file won't block removing the reference).
- **Portfolio-scope note**: local disk storage doesn't survive a redeploy
  on most hosting platforms. The `{ fileName, url, mimeType, size,
  uploadedBy }` shape stored on the Lead document is deliberately identical
  to what an S3/GCS-backed upload would produce, so swapping the storage
  backend later only touches `server/src/middleware/upload.js`.

## MongoDB Schema Highlights

- Compound index `{ assignedTo: 1, isDeleted: 1, createdAt: -1 }` — same
  reasoning as Customers: covers "my active leads, newest first" in one scan.
- Separate indexes on `status`, `source`, and `priority` support the list
  page's filter dropdowns.
- `notes` and `attachments` are embedded subdocuments (not separate
  collections) for the same reason as Customer notes — always read
  alongside their parent lead, never queried independently.
