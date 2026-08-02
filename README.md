# CRM Platform

A production-style Customer Relationship Management platform built to demonstrate
enterprise full-stack engineering practices: clean architecture, RBAC, and a
scalable module system — built with **React 19**, **Node.js/Express**, and
**MongoDB**.

> 🚧 **Status: Phase 3 — Dashboard.** Foundation, Authentication, and a full
> enterprise dashboard (KPIs, sales pipeline, revenue/lead analytics, activity
> timeline, tasks, notifications, top performers, customer growth) are
> complete and backed by real MongoDB aggregations. Remaining modules ship
> in subsequent phases — see [Roadmap](#roadmap).

## Tech Stack

| Layer      | Technology                                                        |
|------------|--------------------------------------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS, React Router, React Hook Form, Axios   |
| Backend    | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt                  |
| Tooling    | ESLint, dotenv, Git                                                  |

## Why This Project

This repo is built to be read, not just run — every architectural decision is
documented in [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md), including *why*
the backend is layered the way it is, *why* the frontend separates `ui/` from
`common/` from `layout/`, and *why* RBAC is enforced server-side as the source
of truth.

## Repository Structure

```
crm-portfolio/
├── client/          # React 19 + Vite SPA
├── server/          # Express REST API
└── docs/            # Architecture, API docs, deployment guide
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for the full breakdown of
both `client/src` and `server/src`.

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB running locally or an Atlas connection string

### 1. Clone & install
```bash
git clone <your-repo-url>
cd crm-portfolio

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# edit server/.env with your MongoDB URI and JWT secrets
```

### 3. Seed demo users and dashboard data
```bash
cd server && npm run seed
```
Creates `admin@crm.test`, `hr@crm.test`, `manager@crm.test`, plus three
Employee accounts, all with password `Password123` — then generates
realistic customers, leads, opportunities, tasks, and activity across the
last 6 months so the dashboard isn't empty on first login. There's no
public registration endpoint by design — see `docs/ARCHITECTURE.md`.

### 4. Run in development
```bash
# terminal 1
cd server && npm run dev     # http://localhost:5000

# terminal 2
cd client && npm run dev     # http://localhost:5173
```

Full endpoint reference: [`docs/API_AUTH.md`](./docs/API_AUTH.md) ·
[`docs/API_DASHBOARD.md`](./docs/API_DASHBOARD.md).

The Vite dev server proxies `/api` requests to the Express server (see
`client/vite.config.js`), so the frontend can simply call `/api/v1/...`.

## Design System

The UI follows a custom **"Ink & Signal"** design language rather than a
default template look: a deep ink sidebar, a neutral slate content surface,
and a single teal "signal" accent reserved for primary actions and active
pipeline states — paired with Sora (display), Inter (body), and JetBrains
Mono (data) typefaces. Tokens live in `client/tailwind.config.js`.

## Roadmap

- [x] **Phase 1** — Architecture, project setup, routing, auth & dashboard layouts, sidebar, navbar
- [x] **Phase 2** — Authentication (login, logout, forgot/reset password, JWT access + refresh tokens, RBAC)
- [x] **Phase 3** — Dashboard (KPI cards, sales pipeline, revenue & lead analytics, activity timeline, tasks, notifications, top performers, customer growth)
- [ ] **Phase 4** — Customer Management (CRUD, profile, search, filter, pagination)
- [ ] **Phase 5** — Lead Management (status, source, assignment, follow-up history, conversion)
- [ ] **Phase 6** — Task Management (create/assign, due dates, priority, status tracking)
- [ ] **Phase 7** — Follow-up Management (call logs, meetings, notes, reminders)
- [ ] **Phase 8** — Reports (sales, customer, lead, dashboard analytics)
- [ ] **Phase 9** — Settings (profile, change password, roles & permissions)
- [ ] **Phase 10** — Deployment, API documentation, polish

## License

MIT — feel free to fork and adapt for your own portfolio.
