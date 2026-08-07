# Notifications API

Base path: `/api/v1/notifications` — every route requires a valid access token.
Real-time transport: Socket.IO, same HTTP server, path `/socket.io`.

## Architecture

Every notification in the app is created through one function —
`notifyUser()` in `server/src/services/notification.service.js` — which
does two things atomically from the caller's perspective:

1. Persists a `Notification` document (source of truth).
2. Emits a `notification:new` event over Socket.IO to that user's private
   room (`user:<id>`), if they're currently connected.

This means a live tab updates instantly, while a closed tab (or a
disconnected socket) still sees the notification correctly on its next
`GET /notifications` — **the socket is a live-update optimization, never
the source of truth.** Nothing in the app can create a notification that
bypasses this function, which guarantees the DB write and the real-time
emit can never drift apart.

### Socket connection

```js
import { io } from 'socket.io-client';
const socket = io('/', { path: '/socket.io', auth: { token: accessToken } });
socket.on('notification:new', (notification) => { /* ... */ });
```

Auth happens once, at connection time (`server/src/realtime/socket.js`):
the same access token used for REST calls is verified with the same JWT
secret and the same "user must still be active" check as the `protect`
HTTP middleware — a deactivated user can't keep a live socket connection
open even if their token hasn't technically expired yet.

**Scaling note**: rooms live in a single Node process's memory. Running
more than one server instance would need a shared adapter (e.g.
`@socket.io/redis-adapter`) so a notification created on instance A
reaches a user connected to instance B — the same caveat already
documented for the Phase 6 reminder cron job.

## REST Endpoints

| Method | Path                    | Description |
|--------|--------------------------|--------------|
| GET    | `/notifications`           | Paginated list for the current user, newest first |
| PATCH  | `/notifications/:id/read`   | Mark one notification as read |
| PATCH  | `/notifications/read-all`   | Mark all of the current user's notifications as read |
| DELETE | `/notifications/:id`        | Delete a notification |

### `GET /notifications` — query params

| Param      | Type | Notes |
|------------|------|-------|
| `page` / `limit` | int | default `1` / `20`, `limit` max `100` |
| `category`         | enum | `task \| lead \| opportunity \| followup \| security \| admin \| system` |
| `isRead`            | boolean | filter to read or unread only |

Response includes `unreadCount` alongside the page of items — used to
drive the Navbar bell badge without a separate request:

```json
{
  "success": true,
  "message": "Notifications fetched",
  "data": { "items": [ "..." ], "unreadCount": 4 },
  "meta": { "page": 1, "limit": 20, "total": 37, "totalPages": 2 }
}
```

## Categories

`task`, `lead`, `opportunity`, `followup`, `security`, `admin`, `system` —
the same list is used for both the category filter dropdown and the
icon/color mapping in every notification-rendering component (Navbar's
`NotificationCenter`, Dashboard's `NotificationsPanel`, Settings'
`NotificationsTab`).

## Who Triggers Notifications Today

| Trigger | Category | File |
|---------|----------|------|
| Task assigned/reassigned | `task` | `services/task.service.js` |
| Task reminder due | `task` | `jobs/reminderSweep.js` |
| Lead assigned/reassigned | `lead` | `services/lead.service.js` |
| Follow-up reminder due | `followup` | `jobs/reminderSweep.js` |
| Password changed | `security` | `services/user.service.js` |
| Role changed by an admin | `admin` | `services/user.service.js` |

Any future module that needs to notify a user should call `notifyUser()`
rather than writing to the `Notification` model directly.
