import cron from 'node-cron';
import { Task } from '../models/Task.js';
import { FollowUp } from '../models/FollowUp.js';
import { notifyUser } from '../services/notification.service.js';

/**
 * Single-process reminder sweep: every minute, find Tasks/FollowUps whose
 * `reminderAt` has passed and haven't been notified yet, and materialize a
 * Notification for the assignee.
 *
 * This is a deliberate portfolio-scope choice over a "proper" distributed
 * job queue (BullMQ + Redis, or a managed scheduler): `node-cron` runs
 * in-process, so it only works correctly with a single server instance —
 * running two instances would double-fire reminders unless this were
 * moved to a leader-elected job or a queue with idempotent consumers.
 * That trade-off is fine for this app's scale; it's the first thing that
 * would need to change to horizontally scale the API.
 */
const sweepTaskReminders = async () => {
  const now = new Date();
  const dueTasks = await Task.find({
    reminderAt: { $lte: now },
    reminderSent: false,
    isDeleted: false,
    status: { $nin: ['completed', 'cancelled'] },
  }).select('_id title assignedTo dueDate');

  if (dueTasks.length === 0) return;

  await Promise.all(
    dueTasks.map((task) =>
      notifyUser(task.assignedTo, {
        type: 'task',
        title: 'Task reminder',
        message: `"${task.title}" is due ${new Date(task.dueDate).toLocaleDateString()}`,
      })
    )
  );

  await Task.updateMany({ _id: { $in: dueTasks.map((t) => t._id) } }, { $set: { reminderSent: true } });
};

const sweepFollowUpReminders = async () => {
  const now = new Date();
  const dueFollowUps = await FollowUp.find({
    reminderAt: { $lte: now },
    reminderSent: false,
    isDeleted: false,
    status: 'scheduled',
  }).select('_id subject type assignedTo scheduledAt');

  if (dueFollowUps.length === 0) return;

  await Promise.all(
    dueFollowUps.map((f) =>
      notifyUser(f.assignedTo, {
        type: 'followup',
        title: `Upcoming ${f.type}`,
        message: `"${f.subject}" is scheduled for ${new Date(f.scheduledAt).toLocaleString()}`,
      })
    )
  );

  await FollowUp.updateMany(
    { _id: { $in: dueFollowUps.map((f) => f._id) } },
    { $set: { reminderSent: true } }
  );
};

const runSweep = async () => {
  try {
    await Promise.all([sweepTaskReminders(), sweepFollowUpReminders()]);
  } catch (err) {
    // A failed sweep should never crash the process — just try again next tick.
    // eslint-disable-next-line no-console
    console.error('[reminder-sweep] Failed:', err);
  }
};

/** Starts the in-process cron schedule. Called once from server.js after the DB connects. */
export const startReminderSweep = () => {
  cron.schedule('* * * * *', runSweep); // every minute
  // eslint-disable-next-line no-console
  console.log('[reminder-sweep] Scheduled (every minute)');
};
