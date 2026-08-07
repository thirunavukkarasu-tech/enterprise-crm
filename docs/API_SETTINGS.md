# Settings API

Covers two base paths: `/api/v1/users/me/*` (self-service, any authenticated
user) and `/api/v1/settings/*` (company-wide, Admin to write / anyone to read).

## Self-Service Profile — `/api/v1/users/me`

| Method | Path                 | Description |
|--------|-----------------------|--------------|
| GET    | `/users/me`             | Fetch your own profile |
| PATCH  | `/users/me`              | Update name / phone / job title |
| POST   | `/users/me/avatar`        | Upload a profile image (`multipart/form-data`, field `file`) |
| PATCH  | `/users/me/preferences`   | Update theme and/or email notification preferences |
| PATCH  | `/users/me/password`      | Change your password |

### Avatar upload

Image only (`png`/`jpeg`/`webp`), max 2MB — a narrower uploader than the
general Lead/Task attachment uploaders (see `docs/API_LEADS.md`), since a
profile picture has different, tighter constraints than an arbitrary
document. Stored under `server/uploads/avatars/` with a randomized
filename, same pattern as every other file upload in the app.

### Change Password — `PATCH /users/me/password`

```json
{ "currentPassword": "...", "newPassword": "...", "confirmPassword": "..." }
```

Requires the current password (re-verified server-side, not trusted from
the session alone). On success: re-hashes and saves the new password,
**revokes the refresh token** (so every session — including the one that
just changed it — needs to sign in again the next time its access token
expires), writes a `password_changed` audit log entry, and sends the user
a `security`-category notification, in case the change wasn't actually
them.

### Preferences

```json
{
  "theme": "dark",
  "emailNotifications": { "taskReminders": true, "leadUpdates": false, "weeklyDigest": true }
}
```

Both fields are optional and independently patchable — the frontend saves
each toggle individually as the user flips it, not as one big form submit.
`theme` is also mirrored to `localStorage` on the client for an instant,
network-independent switch (see `docs/ARCHITECTURE.md` §12); the server
copy is what makes the choice follow the user to a different device.

## Company Settings — `/api/v1/settings/company`

| Method | Path        | Access | Description |
|--------|-------------|--------|--------------|
| GET    | `/settings/company` | Any authenticated user | Company name, industry, contact info, address |
| PATCH  | `/settings/company`  | Admin only | Update company settings |

Singleton resource — there is exactly one company profile, always
addressed by a fixed, well-known `_id` (see
`server/src/services/companySettings.service.js`). `GET` upserts a
default document on first call rather than 404ing on a fresh database.

## Roles & Permissions

There is no separate API for this — `client/src/pages/settings/components/RolesTab.jsx`
is a **read-only reference** of what the four fixed roles (`admin`, `hr`,
`manager`, `employee`) can already do, sourced directly from the
`authorize()` calls and service-layer scoping checks made throughout the
app. This project uses coarse-grained RBAC, not a granular per-permission
system — see `docs/ARCHITECTURE.md` §4 and §12 for why, and what a
permission-matrix editor would require if that became a real need.

## Theme Settings

Not a server concept at all beyond the `preferences.theme` field above —
light/dark/system is applied client-side by toggling one `dark` class on
`<html>`, which every themed color in the app resolves through via CSS
custom properties. See `docs/ARCHITECTURE.md` §12 for the full design.
