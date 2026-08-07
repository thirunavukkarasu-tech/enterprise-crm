# System Architecture — CRM Platform

## 1. Overview

This CRM is built as a **decoupled client-server application**:

- **Client**: React 19 SPA (Vite) — consumes a REST API, owns no business logic beyond
  presentation, form validation (UX-layer only), and client-side routing/guarding.
- **Server**: Node.js + Express REST API — owns all business logic, authorization,
  and persistence via MongoDB/Mongoose.

Rationale: a decoupled architecture lets the API be reused by a future mobile app or
integrated into other systems (e.g. a support portal), keeps the two codebases
independently deployable/scalable, and mirrors how real product teams at
enterprise-software companies (Zoho, Freshworks, Salesforce) structure their platforms.

```
┌───────────────────────┐        HTTPS / JSON        ┌───────────────────────┐
│        Client          │ ───────────────────────▶  │        Server          │
│  React 19 + Vite        │ ◀───────────────────────  │  Express REST API      │
│  Tailwind CSS            │        JWT (Bearer)        │  Node.js               │
└───────────────────────┘                             └───────────┬───────────┘
                                                                    │ Mongoose ODM
                                                                    ▼
                                                          ┌───────────────────┐
                                                          │     MongoDB         │
                                                          └───────────────────┘
```

## 2. Backend Architecture — Layered / Clean Architecture

The server follows a **layered architecture** with a strict one-directional dependency
rule: `routes → controllers → services (business logic) → models`. Cross-cutting
concerns (auth, validation, error handling) live in `middleware/`.

```
server/src
├── config/         # env loading, DB connection, constants (no business logic)
├── models/         # Mongoose schemas — the persistence contract
├── validators/     # request-shape validation (Joi/express-validator schemas)
├── middleware/      # auth guard, RBAC guard, error handler, async wrapper
├── controllers/    # HTTP-layer glue: parse req → call service → shape res
├── services/        # (introduced Phase 2+) business logic, framework-agnostic
├── routes/          # Express routers, one per resource/module
├── utils/           # ApiError, ApiResponse, token helpers, logger
├── app.js           # Express app assembly (middleware pipeline)
└── server.js         # process entrypoint (http server + DB bootstrap)
```

**Why layered instead of "fat controllers"?**
Putting business logic in a `services` layer instead of directly in controllers
means:
1. Controllers stay thin and testable in isolation (mock the service).
2. Business logic is reusable outside the HTTP context (e.g. a future CLI, cron job,
   or GraphQL resolver could call the same service).
3. Unit tests target services without spinning up Express/HTTP.

**Why a middleware-first cross-cutting design?**
Auth, RBAC, validation and error handling are implemented once as Express
middleware and composed per-route, rather than repeated per-controller. This keeps
controllers free of `if (!req.user) return 401` boilerplate and centralizes security
logic where it's easiest to audit.

## 3. Frontend Architecture — Feature-Colocated + Layered

```
client/src
├── assets/            # static assets, images, icons
├── components/
│   ├── layout/         # Navbar, Sidebar, PageHeader — app shell only
│   ├── common/         # Loader, EmptyState, ProtectedRoute, Toast wrapper
│   └── ui/             # Button, Input, Card, Badge — dumb, reusable primitives
├── context/            # AuthContext (global auth/session state)
├── hooks/               # useAuth, useDebounce, usePagination, etc.
├── layouts/             # AuthLayout, DashboardLayout — page shells
├── pages/                # Route-level components, grouped by module
│   ├── auth/            # Login, ForgotPassword, ResetPassword
│   └── dashboard/       # Dashboard (KPIs, charts) — Phase 3
├── routes/               # AppRoutes.jsx — central route table + guards
├── services/            # axios instance + one API module per resource
├── utils/                # formatters, constants, helper functions
└── styles/               # Tailwind entrypoint, design tokens
```

**Why `ui/` vs `common/` vs `layout/`?** This separation prevents the classic
"one giant `components` folder" problem:
- `ui/` — presentation-only primitives with zero business awareness (a `Button`
  doesn't know what a "Lead" is).
- `common/` — app-aware but domain-agnostic (a `ProtectedRoute` knows about auth,
  not about leads/customers).
- `layout/` — structural chrome shared across every authenticated page.

Domain-specific components (e.g. `LeadCard`, `CustomerTable`) will be colocated
under `pages/<module>/components/` as each module is built, keeping feature code
close to where it's used instead of forcing premature abstraction into `ui/`.

**State management strategy**: React Context (`AuthContext`) for global session
state only. Server data (customers, leads, tasks) will be fetched per-page via
service modules rather than pushed into a single global store — this avoids
over-engineering (no Redux) while keeping data-fetching colocated with the
page that needs it. If cross-page cache/sync becomes necessary in later phases,
this design leaves room to introduce TanStack Query without a rewrite.

## 4. Authentication & Authorization Model

- **Authentication**: JWT access tokens (short-lived) issued on login, sent as
  `Authorization: Bearer <token>`. Passwords hashed with bcrypt (salt rounds
  configurable via env). Forgot/Reset password uses a single-use, time-boxed
  hashed token stored on the user document (industry-standard pattern, avoids a
  separate token collection for Phase 1 scope).
- **Authorization (RBAC)**: Four roles — `admin`, `hr`, `manager`, `employee`.
  Role is embedded in the JWT payload and re-verified against the DB on each
  request (not trusted purely from the token) so a demoted/deactivated user is
  locked out immediately rather than waiting for token expiry. A password
  change also invalidates any access token issued before it, via a
  `passwordChangedAt` comparison in the `protect` middleware.
- **No public registration endpoint**: users are provisioned by an admin (or,
  for this portfolio build, a seed script), matching how enterprise CRM/HR
  platforms actually onboard staff — self-signup would let anyone grant
  themselves an account and is deliberately out of scope.
- **Refresh token rotation**: each call to `/auth/refresh-token` issues a new
  refresh token and invalidates the previous one (its hash is overwritten on
  the user document). Presenting an already-rotated token is treated as a
  possible replay/theft and immediately revokes the session, rather than
  silently accepting it.
- **Route protection**: Backend `protect` middleware verifies the JWT;
  `authorize('admin', 'manager')` middleware enforces role checks per route.
  Frontend `ProtectedRoute` mirrors this for UX (hiding/redirecting) but the
  **server is always the source of truth** — the client-side check is a UX
  convenience, never a security boundary.

## 5. API Design Conventions

- Base path: `/api/v1/...` — versioned from day one.
- Resource-oriented REST: `GET/POST /customers`, `GET/PATCH/DELETE /customers/:id`.
- Consistent envelope for every response (see `utils/ApiResponse.js`):
  ```json
  { "success": true, "message": "...", "data": {}, "meta": { "page": 1 } }
  ```
- Consistent error envelope (see `utils/ApiError.js`):
  ```json
  { "success": false, "message": "...", "errors": [] }
  ```
- Pagination via `?page=&limit=`, filtering via query params, search via `?q=`.

## 6. Cross-Cutting Concerns Established in Phase 1

| Concern             | Where it lives                                   |
|---------------------|---------------------------------------------------|
| Centralized errors    | `middleware/errorHandler.js` + `utils/ApiError.js` |
| Async error safety    | `middleware/asyncHandler.js` (no repeated try/catch) |
| CORS / security headers | `app.js` (helmet, cors, rate-limiter)            |
| Request logging       | `morgan` (dev) → structured logger (prod-ready)    |
| Environment config     | `config/env.js` (fails fast if required vars missing) |
| Axios client (frontend) | `services/api.js` (interceptors: auth header, 401 refresh/logout, toast on error) |

## 7. Dashboard Architecture (Phase 3 additions)

- **Service layer activated**: `server/src/services/dashboard.service.js` is
  the first real use of the `services/` layer promised in §2 — controllers
  stay a thin `parse req → call service → send ApiResponse`, and every
  aggregation pipeline lives in one testable, framework-agnostic module.
- **Granular endpoints over one mega-endpoint**: the dashboard exposes nine
  small endpoints (`/kpis`, `/pipeline`, `/revenue-analytics`, ...) rather
  than one `/dashboard/summary` blob. Each frontend widget fetches its own
  data independently (`useApiQuery` per widget), so one slow or failing
  endpoint degrades a single card instead of blocking the entire page —
  and each widget gets its own accurate loading skeleton instead of an
  all-or-nothing spinner.
- **Widget isolation via `ChartCard` + `ErrorBoundary`**: every widget goes
  through the same loading → error → empty → content state machine
  (`ChartCard`) and is wrapped in a render-level `ErrorBoundary`, so a bug
  in one chart can't take down the rest of the dashboard.
- **Code-split charting**: `recharts`-based widgets (`RevenueAnalyticsChart`,
  `LeadConversionChart`, `CustomerGrowthStats`) are the only consumers of
  that dependency and are loaded via `React.lazy` + `Suspense`, keeping
  the charting library out of the initial bundle for users who haven't
  scrolled to (or don't have permission to see) those widgets.
- **RBAC-aware data scoping**: `server/src/utils/scope.js` transparently
  filters every dashboard query to "my records only" for Employees while
  leaving Admin/HR/Manager unscoped — enforced in the service layer, so it
  can't be bypassed by calling the endpoint directly.
- **Minimal domain models introduced early**: `Customer`, `Lead`,
  `Opportunity`, `Task`, `Activity`, `Notification` are given lean, real
  Mongoose schemas now so the dashboard aggregates over genuine data rather
  than mocks — the full CRUD modules for each (validation rules, more
  fields, UI) are additive in later phases and won't change this contract.

## 8. Customer Management Architecture (Phase 4 additions)

- **Soft delete over hard delete**: `Customer.isDeleted` + `deletedAt`
  instead of `deleteOne()`. Customers are referenced by Opportunities,
  Tasks, and the Activity log — hard-deleting would orphan those records.
  Every read path filters `isDeleted: false`; a restore capability is a
  natural addition once an Admin module exists.
- **Notes embedded, Timeline queried**: notes are free text a rep writes,
  always read alongside their parent customer, and embedded directly on the
  document (`customer.notes[]`) to avoid an extra round-trip. The Timeline
  is system-generated history, backed by the same `Activity` collection the
  Dashboard already uses (filtered by `relatedCustomer`) — one append-only
  log serves both the org-wide Dashboard feed and every customer's
  individual timeline.
- **Reusable `Table` component**: driven entirely by a `columns` config
  (`{ key, header, render?, sortable? }`) rather than each module hand-
  rolling a `<table>`. Sorting is controlled by the parent and reported via
  callback rather than handled internally, since paginated data needs the
  sort applied server-side, not client-side on the current page only.
- **CSV import is partial-success, not all-or-nothing**: each row is
  validated and inserted independently; a bad row is skipped and reported
  with a reason rather than failing the entire batch. This matches how a
  non-technical user actually experiences "importing a spreadsheet" — one
  malformed row shouldn't block 999 good ones.
- **Hand-rolled CSV parsing/generation kept minimal**: `csv-parse` (a
  well-maintained, dependency-free parser) is used for import since CSV
  quoting/escaping edge cases are easy to get wrong by hand; export uses a
  ~15-line hand-rolled stringifier since the output shape is fixed and
  small, not worth a second dependency for.
- **RBAC ownership scoping enforced in the service layer**: `assertAccess()`
  in `customer.service.js` — not in a route middleware — so it's applied
  consistently across read, update, delete, notes, and timeline without
  relying on every controller remembering to check it.

## 9. Lead Management Architecture (Phase 5 additions)

- **Single update endpoint, not one-per-field**: status changes, priority
  changes, and reassignment all go through `PATCH /leads/:id` — the service
  layer inspects which field actually changed and logs the appropriate
  activity type (`lead_status_changed` / `lead_assigned` / generic
  `lead_updated`). A dedicated `/status` or `/assign` endpoint would just be
  a thinner wrapper around the same update path; this keeps the API surface
  smaller without losing activity-log fidelity. Same pattern as Customers.
- **Conversion creates, never mutates**: `POST /leads/:id/convert` creates a
  brand-new `Customer` document rather than "promoting" the Lead document
  in place. The Lead survives (`status: won`, `convertedToCustomer` set) so
  source/funnel reporting still has the original record to attribute a win
  to — mutating a Lead into a Customer in place would make "conversion rate
  by lead source" unanswerable after the fact.
- **Local-disk attachments behind a storage-agnostic schema**: attachment
  metadata (`fileName`, `url`, `mimeType`, `size`, `uploadedBy`) is exactly
  the shape an S3/GCS integration would also produce, so
  `server/src/middleware/upload.js` is the only file that would change to
  swap storage backends — the Lead schema, service, and every frontend
  component are already storage-agnostic.
- **One append-only Activity log, three consumers**: the same `Activity`
  collection introduced in Phase 3 (Dashboard) and extended in Phase 4
  (Customers) now also backs the Lead timeline via `relatedLead` — three
  different UI surfaces (org-wide dashboard feed, a customer's timeline, a
  lead's timeline) share one write path and one collection instead of each
  module inventing its own history mechanism.

## 10. Task & Follow-up Management Architecture (Phase 6 additions)

- **Two related but distinct entities, not one**: a `Task` is open-ended
  work (comments thread, attachments, arbitrary due date) while a
  `FollowUp` is a single scheduled interaction (call/meeting/email) with
  one notes field. Modeling them as one entity with an optional "type"
  flag was considered and rejected — their shapes and lifecycles diverge
  enough (attachments/comments vs. duration/interaction-type) that a
  shared schema would need constant `if (type === ...)` branching in both
  the model and every consumer.
- **The `/users` endpoint was added reactively, not planned upfront**: the
  Customer and Lead modules (Phases 4–5) supported `assignedTo` in the
  API but never exposed a picker in the UI. Phase 6 explicitly requires
  "assign task to sales representative," which exposed that gap — so a
  minimal `GET /api/v1/users` (Admin/HR/Manager only, active users'
  name/email/role) was added to power it, and reused by the Follow-up
  form. Customer/Lead forms weren't retrofitted with the same picker in
  this phase to keep the change scoped to what was actually requested;
  it's a natural small addition when those modules are revisited.
- **Reminders as a sweep, not a scheduled job per record**: rather than
  scheduling an individual timer per `reminderAt` (which doesn't survive
  a server restart and doesn't scale past a handful of in-memory timers),
  a single `node-cron` job polls every minute for anything due. This is
  explicitly called out as the first thing that would need to change
  (to a distributed queue like BullMQ+Redis) if the API needed to run as
  more than one instance — see `server/src/jobs/reminderSweep.js`.
- **One-click status toggles alongside full edit**: both the Task list and
  the Follow-up list expose a quick "complete" action directly on the row
  (not just inside the edit modal), because "mark this done" is by far the
  most frequent interaction with a task/follow-up — burying it inside a
  modal would add friction to the single most common action.
- **Customer Interaction History is a read of the same collection, not a
  separate feature**: `GET /followups/customer/:customerId` is the same
  `FollowUp` model and service, just pre-filtered — reinforcing the
  established pattern (see §8, §9) of one collection serving multiple UI
  surfaces rather than each surface inventing its own data shape.

## 11. Reports & Analytics Architecture (Phase 7 additions)

- **`$facet` aggregations over multiple queries**: every report endpoint
  computes several breakdowns of the same collection (trend, totals,
  previous-period comparison, per-rep pivot) in a single `$facet`
  aggregation rather than four sequential queries — one round-trip to
  MongoDB instead of four, and a consistent read snapshot across all the
  breakdowns in that one response.
- **Reports vs. Dashboard: different aggregation shapes for different
  jobs.** The Dashboard (Phase 3) answers "what does today look like" with
  nine small, independently-loading endpoints against a fixed recent
  window. Reports answers "show me this metric over a date range I
  choose" — so `report.service.js` generalizes the Dashboard's month-
  bucket gap-filling (`lastNMonths`) into an arbitrary-range version
  (`buildPeriodBuckets`) and extracts the shared `percentChange` helper
  both now import, rather than each duplicating that math.
- **Report data vs. export data are different shapes on purpose**: a
  report returns pre-aggregated numbers shaped for a chart; an export
  returns the underlying records shaped for a spreadsheet. Conflating them
  — e.g. exporting the chart's monthly totals instead of the actual deals
  — would produce a file a manager can't actually pivot or audit against.
  See `docs/API_REPORTS.md`.
- **A registry of exporters, not a switch statement per format**: adding a
  fifth exportable report type means adding one entry to the `EXPORTERS`
  map in `reportExport.service.js` (columns + fetch + row-mapper), not
  touching the CSV/XLSX generation code in `utils/exporters.js` at all —
  those two functions only know about `{ columns, rows }`, never about
  Sales/Customers/Leads/Tasks specifically.
- **Print support via CSS, not a second view**: "print-friendly reports"
  is implemented as `print:` Tailwind variants on the existing page (hide
  the sidebar/navbar/filters, let the content flow naturally) rather than
  a parallel print-only template — one source of truth for the report's
  markup, styled differently for two output targets.
- **A pragmatic, documented duplication**: `components/ui/ChartCard.jsx`
  duplicates `pages/dashboard/components/ChartCard.jsx` (same loading/
  error/empty state machine) instead of refactoring the Dashboard to
  import a shared copy. The Dashboard was reviewed and shipped in Phase 3;
  touching eight already-working files for a cosmetic dedupe carried more
  regression risk than the duplication costs. Noted in the component's
  own docstring as a known follow-up, not silently left unexplained.

## 12. Notifications, Settings & Administration Architecture (Phase 8 additions)

- **Real-time notifications, with REST as the source of truth, not the
  socket.** Every notification is created through one function,
  `notifyUser()` (`server/src/services/notification.service.js`), which
  persists to MongoDB *and* emits over Socket.IO in the same call. A
  disconnected socket never loses a notification — it's simply picked up
  on the next `GET /notifications` — because the DB write doesn't depend
  on anyone being connected to receive the emit. This is the same
  "one write path, multiple consumers" discipline established for the
  `Activity` log in §7–9, applied to a live-updating feed instead of a
  polled one.
- **One `AuditLog` collection, two Administration views.** Audit Logs and
  Login History are the same collection, same service function
  (`listAuditLogs`), with Login History simply pre-filtering to
  authentication actions. Building a separate `LoginHistory` collection
  would mean two write paths that could drift; a decision documented
  explicitly in `docs/API_ADMIN.md` because it's the same architectural
  choice made three times now (Activity, Notification categories, Audit
  Log) and is worth naming as a repeated pattern, not a coincidence.
- **Audit writes never throw.** `logAudit()` swallows its own errors and
  logs them server-side instead of propagating — recording that a login
  happened must never be able to block the login itself. The same
  "observability must not gate the primary action" principle already
  applied to the Phase 6 reminder sweep.
- **CSS-variable-driven theming, not a `dark:` variant on every
  component.** Adding dark mode to an app with seven phases of already-
  shipped UI had exactly two options: retrofit `dark:` Tailwind variants
  onto every existing component, or make the existing color tokens
  (`ink`, `surface`) resolve through CSS custom properties that a single
  class on `<html>` swaps. The second approach was chosen specifically
  *because* it required touching zero already-shipped page components —
  only `tailwind.config.js` and `src/styles/index.css` changed, plus the
  one place (`Sidebar`) that needed to opt *out* of theming (the sidebar
  is deliberately always-dark, so it was given its own fixed `sidebar`
  token family instead of the theme-aware `ink` tokens). The trade-off:
  any *new* component still needs to use the semantic `ink`/`surface`
  tokens rather than a literal hex value to stay theme-safe — an easy
  rule to follow, and one violation of it (a modal backdrop using `ink`
  where a fixed-dark color was needed) was caught in review for this
  phase.
- **Self-service (`/users/me/*`) vs. Administration (`/admin/users/*`) are
  separate route files, not one route with a role branch.** A user's own
  profile has different validation, different fields (no `role`/`isActive`
  from self-service), and different audit semantics than an admin
  managing someone else's account — keeping them as separate routers
  makes each one's `authorize()` requirement obvious at a glance rather
  than buried in an if-statement.
- **Admin self-protection enforced server-side, not just hidden in the
  UI.** An admin can't demote or deactivate their own account via the API
  (`server/src/services/user.service.js#updateUser`) — the form also
  disables those fields when editing yourself, but that's UX courtesy;
  the actual boundary is the 403 the server returns regardless of what
  the client sends.
- **Roles & Permissions is a reference, not an editor.** This app uses
  four fixed roles checked via `authorize()` on each route, not a
  granular per-permission system — so `RolesTab.jsx` renders a read-only
  capability matrix sourced from what's actually enforced elsewhere in
  the codebase, rather than a settings screen that implies permissions
  are dynamically configurable when they aren't. Documented as a known
  extension point (a real permission-matrix editor is a different
  authorization model, not an incremental change) rather than a
  half-built toggle UI that doesn't actually do anything.

## 13. Why This Scales to the Full Module List

Every module in the original roadmap — Authentication, Dashboard,
Customers, Leads, Tasks & Follow-ups, Reports, and Notifications/Settings/
Administration — plugged into the same skeleton established in Phase 1: a
Mongoose model, a validator, a service, a controller, a router mounted in
`app.js`, and a `pages/<module>` folder on the frontend with its own
service file. From Phase 2 onward, every phase was purely additive — no
phase required restructuring a previous one's foundation, which was the
entire point of investing in that foundation first. The same skeleton is
still the extension point for whatever comes next (Product Catalog,
Billing, Integrations, ...): add a model, a service, a router, mount it,
add a `pages/<module>` folder, and register one line in `utils/navigation.js`.
