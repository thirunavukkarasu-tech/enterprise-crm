import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

let io = null;

/**
 * Real-time notification architecture: a single Socket.IO server, one
 * private room per user (`user:<id>`). When a notification is created
 * anywhere in the app (see `services/notification.service.js`), it's
 * persisted to MongoDB *and* emitted to that user's room if they're
 * currently connected — so an open tab updates instantly, while a closed
 * tab still sees it via the normal REST fetch on next load. Persistence
 * never depends on the socket: if nobody's connected, the notification is
 * simply picked up on the next `GET /notifications`.
 *
 * Auth happens once, at connection time, via the same access token used
 * for REST calls (`socket.handshake.auth.token`) — verified with the same
 * JWT secret and subject to the same "user must still be active" check as
 * the `protect` HTTP middleware, so a deactivated user can't keep a live
 * socket connection open.
 *
 * Scaling note: rooms are held in the single Node process's memory. Running
 * more than one server instance would need a shared adapter (e.g.
 * `@socket.io/redis-adapter`) so a notification created on instance A
 * reaches a user connected to instance B — the same single-instance caveat
 * called out for the reminder cron job in Phase 6.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) return next(new Error('Account is inactive or no longer exists'));

      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
  });

  return io;
};

export const getIO = () => io;

/** Emits `event` with `payload` to every connection for `userId`, if any. No-op if the socket server hasn't started (e.g. in tests) or the user is offline. */
export const emitToUser = (userId, event, payload) => {
  io?.to(`user:${userId.toString()}`).emit(event, payload);
};
