import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { startReminderSweep } from './jobs/reminderSweep.js';
import { initSocket } from './realtime/socket.js';

const start = async () => {
  await connectDB();
  startReminderSweep();

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] CRM API running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  // Socket.IO attaches to the same underlying HTTP server rather than
  // listening on a separate port — one process, one port, simpler CORS/
  // proxy story in both dev (Vite) and production.
  initSocket(server);

  // Fail loudly instead of leaving the process in a broken state.
  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Unhandled promise rejection:', err);
    server.close(() => process.exit(1));
  });
};

start();
