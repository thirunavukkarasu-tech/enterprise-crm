import { faker } from '@faker-js/faker';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Opportunity } from '../models/Opportunity.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import {
  LEAD_STATUSES,
  LEAD_SOURCES,
  OPPORTUNITY_STAGES,
  TASK_PRIORITIES,
} from '../utils/enums.js';

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pickWeighted = (weighted) => {
  const total = weighted.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, weight] of weighted) {
    if (r < weight) return value;
    r -= weight;
  }
  return weighted[0][0];
};

const dateWithinLastMonths = (months) =>
  faker.date.between({ from: new Date(new Date().setMonth(new Date().getMonth() - months)), to: new Date() });

/**
 * Populates realistic demo data across the domain models the dashboard
 * aggregates over. Idempotent at the collection level — skips generation
 * entirely if Customers already exist, so re-running `npm run seed` after
 * the app has real data doesn't pollute it with fake records.
 */
export const seedDashboardData = async (salesUsers) => {
  const existingCount = await Customer.countDocuments();
  if (existingCount > 0) {
    // eslint-disable-next-line no-console
    console.log('[seed:dashboard] Skipped — Customer collection is not empty.');
    return;
  }

  // --- Customers -------------------------------------------------------------
  const TAG_POOL = ['vip', 'enterprise', 'smb', 'renewal-risk', 'upsell', 'newsletter'];
  const customers = Array.from({ length: 60 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    industry: pick(['SaaS', 'Retail', 'Manufacturing', 'Healthcare', 'Finance', 'Education']),
    status: pickWeighted([
      ['lead', 2],
      ['prospect', 2],
      ['active', 6],
      ['inactive', 2],
      ['churned', 1],
    ]),
    tags: faker.helpers.arrayElements(TAG_POOL, { min: 0, max: 2 }),
    assignedTo: pick(salesUsers)._id,
    createdAt: dateWithinLastMonths(6),
  }));
  const insertedCustomers = await Customer.insertMany(customers);
  console.log(`[seed:dashboard] Created ${insertedCustomers.length} customers`);

  // --- Leads -------------------------------------------------------------------
  const leads = Array.from({ length: 80 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    status: pickWeighted(LEAD_STATUSES.map((s) => [s, s === 'lost' ? 3 : s === 'won' ? 2 : 4])),
    source: pick(LEAD_SOURCES),
    priority: pickWeighted([
      ['low', 3],
      ['medium', 5],
      ['high', 2],
    ]),
    estimatedValue: faker.number.int({ min: 1000, max: 50000 }),
    assignedTo: pick(salesUsers)._id,
    createdAt: dateWithinLastMonths(6),
  }));
  await Lead.insertMany(leads);
  console.log(`[seed:dashboard] Created ${leads.length} leads`);

  // --- Opportunities -------------------------------------------------------------
  const opportunities = Array.from({ length: 45 }).map(() => {
    const stage = pickWeighted(
      OPPORTUNITY_STAGES.map((s) => [s, s === 'closed_won' ? 5 : s === 'closed_lost' ? 3 : 3])
    );
    const isClosed = stage === 'closed_won' || stage === 'closed_lost';
    const createdAt = dateWithinLastMonths(6);
    return {
      title: `${faker.commerce.productName()} — ${faker.company.name()}`,
      customer: pick(insertedCustomers)._id,
      amount: faker.number.int({ min: 2000, max: 80000 }),
      stage,
      probability: stage === 'closed_won' ? 100 : stage === 'closed_lost' ? 0 : faker.number.int({ min: 10, max: 80 }),
      expectedCloseDate: faker.date.soon({ days: 60 }),
      closedAt: isClosed ? faker.date.between({ from: createdAt, to: new Date() }) : undefined,
      assignedTo: pick(salesUsers)._id,
      createdAt,
    };
  });
  await Opportunity.insertMany(opportunities);
  console.log(`[seed:dashboard] Created ${opportunities.length} opportunities`);

  // --- Tasks -------------------------------------------------------------------
  const tasks = Array.from({ length: 24 }).map(() => ({
    title: pick([
      'Follow up on proposal',
      'Send contract for signature',
      'Schedule product demo',
      'Check in after onboarding',
      'Prepare quarterly renewal quote',
      'Call to confirm requirements',
    ]),
    description: faker.lorem.sentence(),
    dueDate: faker.date.soon({ days: 21 }),
    priority: pick(TASK_PRIORITIES),
    status: pickWeighted([
      ['pending', 5],
      ['in_progress', 3],
      ['completed', 2],
    ]),
    assignedTo: pick(salesUsers)._id,
    createdAt: dateWithinLastMonths(1),
  }));
  await Task.insertMany(tasks);
  console.log(`[seed:dashboard] Created ${tasks.length} tasks`);

  // --- Activities -------------------------------------------------------------------
  const activityTemplates = [
    (name) => ({ type: 'customer_created', description: `${name} added a new customer` }),
    (name) => ({ type: 'lead_created', description: `${name} captured a new lead` }),
    (name) => ({ type: 'lead_status_changed', description: `${name} moved a lead to Qualified` }),
    (name) => ({ type: 'opportunity_won', description: `${name} closed a deal 🎉` }),
    (name) => ({ type: 'task_completed', description: `${name} completed a task` }),
    (name) => ({ type: 'call_logged', description: `${name} logged a call` }),
    (name) => ({ type: 'meeting_scheduled', description: `${name} scheduled a meeting` }),
    (name) => ({ type: 'note_added', description: `${name} added a note to a customer` }),
  ];
  const activities = Array.from({ length: 40 }).map(() => {
    const actor = pick(salesUsers);
    const template = pick(activityTemplates)(actor.name);
    return {
      ...template,
      actor: actor._id,
      createdAt: dateWithinLastMonths(1),
    };
  });
  await Activity.insertMany(activities);
  console.log(`[seed:dashboard] Created ${activities.length} activities`);

  // --- Notifications (for the admin account, so the panel isn't empty on first login) ---
  const admin = salesUsers.find((u) => u.role === 'admin') || salesUsers[0];
  const notifications = [
    { title: 'New lead assigned', message: 'A new lead was routed to your pipeline.', type: 'lead' },
    { title: 'Task due soon', message: 'You have a task due within 24 hours.', type: 'task' },
    { title: 'Deal closed', message: 'An opportunity was marked as closed-won.', type: 'opportunity' },
    { title: 'Weekly report ready', message: 'Your weekly performance summary is ready.', type: 'system' },
  ].map((n, i) => ({ ...n, user: admin._id, isRead: i > 1, createdAt: dateWithinLastMonths(1) }));
  await Notification.insertMany(notifications);
  console.log(`[seed:dashboard] Created ${notifications.length} notifications for ${admin.email}`);
};
