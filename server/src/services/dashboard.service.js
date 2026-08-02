import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Opportunity } from '../models/Opportunity.js';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { Notification } from '../models/Notification.js';
import { scopeToUser } from '../utils/scope.js';
import { lastNMonths } from '../utils/dateRange.js';
import { LEAD_STATUSES, OPPORTUNITY_STAGES } from '../utils/enums.js';
import { ROLES } from '../utils/roles.js';

const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10; // one decimal place
};

const monthBounds = (offset = 0) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);
  return { start, end };
};

// ---------------------------------------------------------------------------
// KPI cards
// ---------------------------------------------------------------------------

export const getKpis = async (user) => {
  const scope = scopeToUser(user);
  const thisMonth = monthBounds(0);
  const lastMonth = monthBounds(1);

  const [
    totalCustomers,
    newCustomersThisMonth,
    newCustomersLastMonth,
    activeLeads,
    newLeadsThisMonth,
    newLeadsLastMonth,
    openOpportunitiesAgg,
    openOpportunitiesLastMonth,
    revenueThisMonthAgg,
    revenueLastMonthAgg,
  ] = await Promise.all([
    Customer.countDocuments(scope),
    Customer.countDocuments({ ...scope, createdAt: { $gte: thisMonth.start, $lt: thisMonth.end } }),
    Customer.countDocuments({ ...scope, createdAt: { $gte: lastMonth.start, $lt: lastMonth.end } }),
    Lead.countDocuments({ ...scope, status: { $nin: ['won', 'lost'] } }),
    Lead.countDocuments({ ...scope, createdAt: { $gte: thisMonth.start, $lt: thisMonth.end } }),
    Lead.countDocuments({ ...scope, createdAt: { $gte: lastMonth.start, $lt: lastMonth.end } }),
    Opportunity.aggregate([
      { $match: { ...scope, stage: { $nin: ['closed_won', 'closed_lost'] } } },
      { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$amount' } } },
    ]),
    Opportunity.countDocuments({
      ...scope,
      stage: { $nin: ['closed_won', 'closed_lost'] },
      createdAt: { $lt: thisMonth.start },
    }),
    Opportunity.aggregate([
      {
        $match: {
          ...scope,
          stage: 'closed_won',
          closedAt: { $gte: thisMonth.start, $lt: thisMonth.end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Opportunity.aggregate([
      {
        $match: {
          ...scope,
          stage: 'closed_won',
          closedAt: { $gte: lastMonth.start, $lt: lastMonth.end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const openOpps = openOpportunitiesAgg[0] || { count: 0, value: 0 };
  const revenueThisMonth = revenueThisMonthAgg[0]?.total || 0;
  const revenueLastMonth = revenueLastMonthAgg[0]?.total || 0;

  return {
    totalCustomers: {
      value: totalCustomers,
      trend: percentChange(newCustomersThisMonth, newCustomersLastMonth),
    },
    activeLeads: {
      value: activeLeads,
      trend: percentChange(newLeadsThisMonth, newLeadsLastMonth),
    },
    opportunities: {
      value: openOpps.count,
      totalValue: openOpps.value,
      trend: percentChange(openOpps.count, openOpportunitiesLastMonth),
    },
    monthlyRevenue: {
      value: revenueThisMonth,
      trend: percentChange(revenueThisMonth, revenueLastMonth),
    },
  };
};

// ---------------------------------------------------------------------------
// Sales pipeline (Opportunities grouped by stage)
// ---------------------------------------------------------------------------

export const getPipeline = async (user) => {
  const scope = scopeToUser(user);

  const results = await Opportunity.aggregate([
    { $match: scope },
    { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$amount' } } },
  ]);

  const byStage = new Map(results.map((r) => [r._id, r]));

  // Every stage is always present, even with zero deals, so the UI never
  // has to special-case a missing stage.
  return OPPORTUNITY_STAGES.map((stage) => ({
    stage,
    count: byStage.get(stage)?.count || 0,
    value: byStage.get(stage)?.value || 0,
  }));
};

// ---------------------------------------------------------------------------
// Revenue analytics (closed-won revenue per month)
// ---------------------------------------------------------------------------

export const getRevenueAnalytics = async (user, months = 6) => {
  const scope = scopeToUser(user);
  const buckets = lastNMonths(months);

  const results = await Opportunity.aggregate([
    {
      $match: {
        ...scope,
        stage: 'closed_won',
        closedAt: { $gte: buckets[0].start, $lt: buckets[buckets.length - 1].end },
      },
    },
    {
      $group: {
        _id: { year: { $year: '$closedAt' }, month: { $month: '$closedAt' } },
        revenue: { $sum: '$amount' },
        deals: { $sum: 1 },
      },
    },
  ]);

  const byKey = new Map(
    results.map((r) => [`${r._id.year}-${String(r._id.month).padStart(2, '0')}`, r])
  );

  return buckets.map((b) => ({
    month: b.label,
    revenue: byKey.get(b.key)?.revenue || 0,
    deals: byKey.get(b.key)?.deals || 0,
  }));
};

// ---------------------------------------------------------------------------
// Lead conversion funnel
// ---------------------------------------------------------------------------

export const getLeadConversion = async (user) => {
  const scope = scopeToUser(user);

  const results = await Lead.aggregate([
    { $match: scope },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const byStatus = new Map(results.map((r) => [r._id, r.count]));
  const funnel = LEAD_STATUSES.map((status) => ({ status, count: byStatus.get(status) || 0 }));

  const total = funnel.reduce((sum, f) => sum + f.count, 0);
  const won = byStatus.get('won') || 0;
  const conversionRate = total === 0 ? 0 : Math.round((won / total) * 1000) / 10;

  return { funnel, conversionRate, totalLeads: total };
};

// ---------------------------------------------------------------------------
// Recent activities timeline
// ---------------------------------------------------------------------------

export const getRecentActivities = async (user, limit = 10) => {
  const scope = user.role === ROLES.EMPLOYEE ? { actor: user._id } : {};

  return Activity.find(scope)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name role')
    .lean();
};

// ---------------------------------------------------------------------------
// Upcoming tasks
// ---------------------------------------------------------------------------

export const getUpcomingTasks = async (user, limit = 5) => {
  const scope = scopeToUser(user);

  return Task.find({ ...scope, status: { $ne: 'completed' } })
    .sort({ dueDate: 1 })
    .limit(limit)
    .populate('assignedTo', 'name')
    .lean();
};

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const getNotifications = async (user, limit = 10) => {
  const [items, unreadCount] = await Promise.all([
    Notification.find({ user: user._id }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ user: user._id, isRead: false }),
  ]);

  return { items, unreadCount };
};

// ---------------------------------------------------------------------------
// Top performing sales executives (org-wide — not scoped to the caller)
// ---------------------------------------------------------------------------

export const getTopPerformers = async (limit = 5) => {
  return Opportunity.aggregate([
    { $match: { stage: 'closed_won' } },
    {
      $group: {
        _id: '$assignedTo',
        dealsWon: { $sum: 1 },
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        userId: '$user._id',
        name: '$user.name',
        role: '$user.role',
        dealsWon: 1,
        revenue: 1,
      },
    },
  ]);
};

// ---------------------------------------------------------------------------
// Customer growth statistics
// ---------------------------------------------------------------------------

export const getCustomerGrowth = async (user, months = 6) => {
  const scope = scopeToUser(user);
  const buckets = lastNMonths(months);

  const [newPerMonth, totalBeforeRange] = await Promise.all([
    Customer.aggregate([
      {
        $match: {
          ...scope,
          createdAt: { $gte: buckets[0].start, $lt: buckets[buckets.length - 1].end },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
    ]),
    Customer.countDocuments({ ...scope, createdAt: { $lt: buckets[0].start } }),
  ]);

  const byKey = new Map(
    newPerMonth.map((r) => [`${r._id.year}-${String(r._id.month).padStart(2, '0')}`, r.count])
  );

  let cumulative = totalBeforeRange;
  return buckets.map((b) => {
    const newCustomers = byKey.get(b.key) || 0;
    cumulative += newCustomers;
    return { month: b.label, newCustomers, totalCustomers: cumulative };
  });
};
