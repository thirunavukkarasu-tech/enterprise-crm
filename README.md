# CRM Platform

A production-style Customer Relationship Management platform built to demonstrate
enterprise full-stack engineering practices: clean architecture, RBAC, and a
scalable module system — built with **React 19**, **Node.js/Express**, and
**MongoDB**.

> ✅ **Status: Phase 8 complete — full feature set shipped.** Foundation,
> Authentication, Dashboard, Customer Management, Lead Management, Task &
> Follow-up Management, Reports & Analytics, and Notifications/Settings/
> Administration (real-time notifications, user profiles, light/dark theme,
> company settings, user management, audit logs, login history) are all
> complete. Only deployment polish remains — see [Roadmap](#roadmap).

## Tech Stack

| Layer      | Technology                                                        |
|------------|--------------------------------------------------------------------|
| Frontend   | React 19, Vite, Tailwind CSS, React Router, React Hook Form, Axios, Recharts, Socket.IO client |
| Backend    | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Socket.IO, node-cron |
| Exports    | ExcelJS (.xlsx), csv-parse/hand-rolled CSV                            |
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
[`docs/API_DASHBOARD.md`](./docs/API_DASHBOARD.md) ·
[`docs/API_CUSTOMERS.md`](./docs/API_CUSTOMERS.md) ·
[`docs/API_LEADS.md`](./docs/API_LEADS.md) ·
[`docs/API_TASKS.md`](./docs/API_TASKS.md) ·
[`docs/API_FOLLOWUPS.md`](./docs/API_FOLLOWUPS.md) ·
[`docs/API_REPORTS.md`](./docs/API_REPORTS.md) ·
[`docs/API_NOTIFICATIONS.md`](./docs/API_NOTIFICATIONS.md) ·
[`docs/API_SETTINGS.md`](./docs/API_SETTINGS.md) ·
[`docs/API_ADMIN.md`](./docs/API_ADMIN.md).

The Vite dev server proxies `/api` requests to the Express server (see
`client/vite.config.js`), so the frontend can simply call `/api/v1/...`.

## Design System

The UI follows a custom **"Ink & Signal"** design language rather than a
default template look: a deep ink sidebar, a neutral slate content surface,
and a single teal "signal" accent reserved for primary actions and active
pipeline states — paired with Sora (display), Inter (body), and JetBrains
Mono (data) typefaces. Tokens live in `client/tailwind.config.js`.

Light and dark themes are both first-class — every color token resolves
through CSS custom properties (`client/src/styles/index.css`) that flip
with a single `dark` class on `<html>`, so the palette above holds in
both modes rather than dark mode being a bolted-on afterthought. See
`docs/ARCHITECTURE.md` §12.

## Roadmap

- [x] **Phase 1** — Architecture, project setup, routing, auth & dashboard layouts, sidebar, navbar
- [x] **Phase 2** — Authentication (login, logout, forgot/reset password, JWT access + refresh tokens, RBAC)
- [x] **Phase 3** — Dashboard (KPI cards, sales pipeline, revenue & lead analytics, activity timeline, tasks, notifications, top performers, customer growth)
- [x] **Phase 4** — Customer Management (CRUD, soft delete, notes, tags, timeline, search/filter/pagination, CSV import/export)
- [x] **Phase 5** — Lead Management (status, source, priority, assignment, notes, attachments, timeline, lead → customer conversion)
- [x] **Phase 6** — Task & Follow-up Management (priority/category/status, assignment, comments, attachments, reminders, timeline, scheduled calls/meetings/emails, customer interaction history)
- [x] **Phase 7** — Reports & Analytics (sales/customer/lead/task reports, interactive charts, date-range filters, CSV/Excel export, print-friendly)
- [x] **Phase 8** — Notifications, Settings & Administration (real-time notifications, user profile, avatar upload, change password, light/dark theme, company settings, user management, roles reference, audit logs, login history)
- [ ] **Phase 9** — Deployment, polish, and demo hardening

## License

MIT — feel free to fork and adapt for your own portfolio.
