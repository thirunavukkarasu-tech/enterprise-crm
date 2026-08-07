# Administration API

Base path: `/api/v1/admin` — **every route in this module requires the
`admin` role.** Enforced once at the router level
(`router.use(protect, authorize(ROLES.ADMIN))` in `server/src/routes/admin.routes.js`)
rather than per-route, so a new route added to this file can't
accidentally ship without the restriction.

## Manage Users

| Method | Path              | Description |
|--------|--------------------|--------------|
| GET    | `/admin/users`        | Paginated, searchable, filterable user list |
| POST   | `/admin/users`         | Create a user (admin sets the initial password directly) |
| GET    | `/admin/users/:id`      | Fetch one user |
| PATCH  | `/admin/users/:id`      | Update name / role / active status |

### `GET /admin/users` — query params

| Param | Type | Notes |
|-------|------|-------|
| `page` / `limit` | int | default `1` / `20`, `limit` max `100` |
| `q`     | string | matches name or email |
| `role`   | enum | `admin \| hr \| manager \| employee` |
| `isActive` | boolean | filter to active or deactivated accounts |

### No public registration, no emailed temporary password

Consistent with the decision made in Phase 2 (see `docs/ARCHITECTURE.md`
§4): users are provisioned by an admin, not self-signup. This phase's
`POST /admin/users` has the admin set the initial password directly
rather than the app generating and emailing one, which keeps this phase
free of a second email-delivery dependency beyond password-reset. A
"require password change on first login" flag is a natural follow-up if
this app ever has more admins than the person creating every account.

### Self-protection

An admin cannot change their own role or deactivate their own account via
this API — `PATCH /admin/users/:id` returns `403` if `:id` is the caller's
own id and the request tries to change `role` or set `isActive: false`.
This prevents an admin from ever locking themselves out; demoting or
deactivating an admin requires a *different* admin to do it. Enforced in
`server/src/services/user.service.js#updateUser`, and mirrored in the
frontend (`UserFormModal.jsx` disables those fields when editing yourself)
as a UX courtesy — the server check is the actual boundary.

### Activate / Deactivate

Same endpoint as role changes — `PATCH /admin/users/:id` with
`{ "isActive": false }`. A deactivated user:
- Fails `POST /auth/login` with `403` even with correct credentials.
- Loses any live session immediately — `protect` middleware re-checks
  `isActive` on every request (not just at login), and the refresh-token
  flow also checks it, so an already-issued access token stops working
  well before its natural 15-minute expiry.

## Audit Logs & Login History

| Method | Path                    | Description |
|--------|--------------------------|--------------|
| GET    | `/admin/audit-logs`         | Every recorded administrative/security action |
| GET    | `/admin/login-history`       | The same collection, pre-filtered to login/logout events |

Both paginated with `page`/`limit`, and filterable by `action` (audit logs
only), `actor` (user id), and `from`/`to` (ISO dates).

**One collection, two views** — not two separate collections. Both read
from `AuditLog`; `login-history` is just `listAuditLogs` pre-filtered to
`login_success`/`login_failed`/`logout`. This mirrors the established
pattern from earlier phases (one `Activity` collection powering the
Dashboard feed, per-customer, per-lead, and per-task timelines — see
`docs/ARCHITECTURE.md` §7–9) rather than each "view" of audit-worthy
events maintaining its own write path.

### What gets audited

`user_created`, `user_updated`, `user_role_changed`, `user_activated`,
`user_deactivated`, `password_changed`, `company_settings_updated`,
`login_success`, `login_failed`, `logout` — see `server/src/utils/enums.js`
(`AUDIT_ACTIONS`). Every write goes through `logAudit()` in
`server/src/services/audit.service.js`, which **never throws** — a failure
to record an audit entry must never block the underlying action (e.g. a
user must still be able to log in even if the audit write fails for some
reason); failures are logged server-side for operational visibility
instead.

### IP addresses

`req.ip` is used for both audit entries and `lastLoginIp` on the user
document. `app.set('trust proxy', 1)` is set in `app.js` so this reflects
the real client address rather than a reverse proxy's, when deployed
behind one (Render, Railway, Heroku, nginx, etc. all sit in front of the
app this way).
