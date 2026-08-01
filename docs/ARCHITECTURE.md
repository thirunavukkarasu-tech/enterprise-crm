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

## 7. Why This Scales to the Full Module List

Every remaining module (Customers, Leads, Tasks, Follow-ups, Reports, Settings)
plugs into the same skeleton: a Mongoose model, a validator, a service, a
controller, a router mounted in `app.js`, and a `pages/<module>` folder on the
frontend with its own service file. Phase 1 exists so that from Phase 2 onward,
we are only ever adding a module, never restructuring the foundation.
