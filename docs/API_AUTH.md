# Authentication API

Base path: `/api/v1/auth`

All responses use the standard envelope from `docs/ARCHITECTURE.md` §5:
`{ success, message, data, meta? }` on success, `{ success, message, errors }` on failure.

## Token Model

| Token          | Lifetime | Storage                                   | Sent via                          |
|----------------|----------|--------------------------------------------|------------------------------------|
| Access token    | 15 min   | In-memory only (client JS variable)          | `Authorization: Bearer <token>` header |
| Refresh token   | 7 days   | httpOnly, secure, `sameSite=strict` cookie, scoped to `/api/v1/auth` | Automatic (browser cookie) |

The refresh token is rotated on every use and its hash is stored on the user
document — presenting an old (already-rotated) refresh token is treated as a
possible theft/replay and immediately revokes the session (see
`server/src/controllers/auth.controller.js`).

## Endpoints

### POST `/auth/login`
Rate limited (10 req / 15 min per IP).

**Body**
```json
{ "email": "admin@crm.test", "password": "Password123" }
```

**Response 200**
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "accessToken": "<jwt>",
    "user": { "id": "...", "name": "Ava Admin", "email": "admin@crm.test", "role": "admin" }
  }
}
```
Also sets the `refreshToken` httpOnly cookie.

**Errors**: `401` invalid credentials, `403` deactivated account, `400` validation.

---

### POST `/auth/refresh-token`
No body required — reads the `refreshToken` cookie. Returns a new access
token and rotates the refresh cookie. Called automatically by the frontend's
axios interceptor whenever a request receives a `401`.

**Response 200**: same shape as login.
**Errors**: `401` missing/expired/invalid/reused refresh token.

---

### POST `/auth/logout`
Revokes the current refresh token server-side and clears the cookie.

**Response 200**: `{ "success": true, "message": "Logged out successfully" }`

---

### GET `/auth/me`
Protected — requires a valid access token. Returns the current user.

---

### POST `/auth/forgot-password`
Rate limited. Always returns the same generic message whether or not the
email exists, to prevent user enumeration.

**Body**: `{ "email": "admin@crm.test" }`

**Response 200**
```json
{ "success": true, "message": "If an account exists for that email, a reset link has been sent." }
```

In development (no SMTP configured), the reset link is logged to the server
console instead of emailed — see `server/src/utils/email.js`.

---

### POST `/auth/reset-password/:token`
`:token` is the raw token from the emailed link (the server only ever stores
its SHA-256 hash).

**Body**
```json
{ "password": "NewPassword123", "passwordConfirm": "NewPassword123" }
```

**Response 200**: `{ "success": true, "message": "Password reset successfully. Please log in with your new password." }`
**Errors**: `400` invalid/expired token or validation failure.

## Roles

`admin`, `hr`, `manager`, `employee` — enforced via `authorize(...roles)`
middleware on any route that needs it. See `server/src/utils/roles.js` for
the single source of truth.

## Demo Accounts

Run `npm run seed` inside `server/` to create demo accounts — one Admin,
one HR, one Manager, and three Employees (`priya@crm.test`,
`diego@crm.test`, `chloe@crm.test`) — all with password `Password123`, plus
realistic dashboard data. See `docs/API_DASHBOARD.md` for the seeded
domain data.
