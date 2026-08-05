import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Opportunity } from '../models/Opportunity.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { scopeToUser } from '../utils/scope.js';
import { buildPeriodBuckets, previousPeriod } from '../utils/dateRange.js';
import { percentChange } from '../utils/percentChange.js';
import { LEAD_STATUSES, LEAD_SOURCES, CUSTOMER_STATUSES, TASK_STATUSES } from '../utils/enums.js';
import { ROLES } from '../utils/roles.js';

const periodGroupId = (field, groupBy) =>
  groupBy === 'year' ? { year: { $year: `$${field}` } } : { year: { $year: `$${field}` }, month: { $month: `$${field}` } };

const periodKey = (id, groupBy) =>
  groupBy === 'year' ? `${id.year}` : `${id.year}-${String(id.month).padStart(2, '0')}`;

/** Batch-fetches user names/roles for a set of ids — avoids N+1 lookups when pivoting a $facet result by rep. */
const fetchUsersById = async (ids) => {
  const users = await User.find({ _id: { $in: ids } }).select('name role').lean();
  return new Map(users.map((u) => [u._id.toString(), u]));
};

const isPrivileged = (user) => user.role !== ROLES.EMPLOYEE;

// ---------------------------------------------------------------------------
// Sales Report — Revenue, Sales Performance, Monthly/Yearly trend
// ---------------------------------------------------------------------------

export const getSalesReport = async (user, { from, to, groupBy = 'month' }) => {
  const scope = scopeToUser(user);
  const buckets = buildPeriodBuckets(from, to, groupBy);
  const prev = previousPeriod(from, to);

  const [result] = await Opportunity.aggregate([
    { $match: scope },
    {
      $facet: {
        trend: [
          { $match: { stage: 'closed_won', closedAt: { $gte: from, $lt: to } } },
          { $group: { _id: periodGroupId('closedAt', groupBy), revenue: { $sum: '$amount' }, deals: { $sum: 1 } } },
        ],
        totals: [
          { $match: { stage: 'closed_won', closedAt: { $gte: from, $lt: to } } },
          { $group: { _id: null, revenue: { $sum: '$amount' }, deals: { $sum: 1 }, avgDealSize: { $avg: '$amount' } } },
        ],
        previousTotals: [
          { $match: { stage: 'closed_won', closedAt: { $gte: prev.from, $lt: prev.to } } },
          { $group: { _id: null, revenue: { $sum: '$amount' } } },
        ],
        repPerformance: [
          { $match: { stage: { $in: ['closed_won', 'closed_lost'] }, closedAt: { $gte: from, $lt: to } } },
          {
            $group: {
              _id: { rep: '$assignedTo', stage: '$stage' },
              count: { $sum: 1 },
              revenue: { $sum: '$amount' },
            },
          },
        ],
      },
    },
  ]);

  // Gap-fill the trend onto every bucket in range, not just the ones with data.
  const trendByKey = new Map(result.trend.map((t) => [periodKey(t._id, groupBy), t]));
  const trend = buckets.map((b) => ({
    period: b.label,
    revenue: trendByKey.get(b.key)?.revenue || 0,
    deals: trendByKey.get(b.key)?.deals || 0,
  }));

  const totals = result.totals[0] || { revenue: 0, deals: 0, avgDealSize: 0 };
  const previousRevenue = result.previousTotals[0]?.revenue || 0;

  // Pivot { rep, stage } rows into one row per rep: { won, lost, revenue }.
  const repMap = new Map();
  result.repPerformance.forEach((row) => {
    const repId = row._id.rep.toString();
    const entry = repMap.get(repId) || { won: 0, lost: 0, revenue: 0 };
    if (row._id.stage === 'closed_won') {
      entry.won = row.count;
      entry.revenue = row.revenue;
    } else {
      entry.lost = row.count;
    }
    repMap.set(repId, entry);
  });

  const users = await fetchUsersById([...repMap.keys()]);
  const salesPerformance = [...repMap.entries()]
    .map(([repId, entry]) => ({
      userId: repId,
      name: users.get(repId)?.name || 'Unknown',
      role: users.get(repId)?.role,
      dealsWon: entry.won,
      dealsLost: entry.lost,
      revenue: entry.revenue,
      winRate: entry.won + entry.lost === 0 ? 0 : Math.round((entry.won / (entry.won + entry.lost)) * 1000) / 10,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    trend,
    totals: {
      revenue: totals.revenue,
      deals: totals.deals,
      avgDealSize: Math.round(totals.avgDealSize || 0),
      trend: percentChange(totals.revenue, previousRevenue),
    },
    salesPerformance,
  };
};

// ---------------------------------------------------------------------------
// Customer Report — Growth, Active vs Inactive, Segmentation
// ---------------------------------------------------------------------------

export const getCustomerReport = async (user, { from, to, groupBy = 'month' }) => {
  const scope = scopeToUser(user);
  const buckets = buildPeriodBuckets(from, to, groupBy);

  const [result] = await Customer.aggregate([
    { $match: scope },
    {
      $facet: {
        growth: [
          { $match: { createdAt: { $gte: from, $lt: to } } },
          { $group: { _id: periodGroupId('createdAt', groupBy), newCustomers: { $sum: 1 } } },
        ],
        totalBeforeRange: [{ $match: { createdAt: { $lt: from } } }, { $count: 'count' }],
        statusBreakdown: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byIndustry: [
          { $match: { industry: { $exists: true, $nin: [null, ''] } } },
          { $group: { _id: '$industry', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
        byTag: [
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ],
      },
    },
  ]);

  const growthByKey = new Map(result.growth.map((g) => [periodKey(g._id, groupBy), g.newCustomers]));
  let cumulative = result.totalBeforeRange[0]?.count || 0;
  const growth = buckets.map((b) => {
    const newCustomers = growthByKey.get(b.key) || 0;
    cumulative += newCustomers;
    return { period: b.label, newCustomers, totalCustomers: cumulative };
  });

  const statusByKey = new Map(result.statusBreakdown.map((s) => [s._id, s.count]));
  const statusBreakdown = CUSTOMER_STATUSES.map((status) => ({ status, count: statusByKey.get(status) || 0 }));
  const activeCount = statusByKey.get('active') || 0;
  const totalCount = statusBreakdown.reduce((sum, s) => sum + s.count, 0);

  return {
    growth,
    activeVsInactive: { active: activeCount, inactive: totalCount - activeCount, total: totalCount },
    statusBreakdown,
    segmentation: {
      byIndustry: result.byIndustry.map((r) => ({ industry: r._id, count: r.count })),
      byTag: result.byTag.map((r) => ({ tag: r._id, count: r.count })),
    },
  };
};

// ---------------------------------------------------------------------------
// Lead Report — Status Analysis, Source Analysis, Conversion Funnel
// ---------------------------------------------------------------------------

export const getLeadReport = async (user, { from, to }) => {
  const scope = scopeToUser(user);

  const [result] = await Lead.aggregate([
    { $match: { ...scope, createdAt: { $gte: from, $lt: to } } },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
        bySourceWon: [{ $match: { status: 'won' } }, { $group: { _id: '$source', won: { $sum: 1 } } }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const statusByKey = new Map(result.byStatus.map((s) => [s._id, s.count]));
  const funnel = LEAD_STATUSES.map((status) => ({ status, count: statusByKey.get(status) || 0 }));
  const total = result.total[0]?.count || 0;
  const won = statusByKey.get('won') || 0;

  const sourceByKey = new Map(result.bySource.map((s) => [s._id, s.count]));
  const wonBySource = new Map(result.bySourceWon.map((s) => [s._id, s.won]));
  const bySource = LEAD_SOURCES.map((source) => {
    const count = sourceByKey.get(source) || 0;
    const sourceWon = wonBySource.get(source) || 0;
    return { source, count, won: sourceWon, conversionRate: count === 0 ? 0 : Math.round((sourceWon / count) * 1000) / 10 };
  }).filter((s) => s.count > 0);

  return {
    funnel,
    conversionRate: total === 0 ? 0 : Math.round((won / total) * 1000) / 10,
    totalLeads: total,
    bySource,
  };
};

// ---------------------------------------------------------------------------
// Task Report — Completed, Pending, Overdue, Team Productivity
// ---------------------------------------------------------------------------

export const getTaskReport = async (user, { from, to }) => {
  const scope = scopeToUser(user);
  const now = new Date();

  const [result] = await Task.aggregate([
    { $match: { ...scope, isDeleted: false, createdAt: { $gte: from, $lt: to } } },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        overdue: [
          { $match: { status: { $nin: ['completed', 'cancelled'] }, dueDate: { $lt: now } } },
          { $count: 'count' },
        ],
        total: [{ $count: 'count' }],
        repCompleted: [{ $match: { status: 'completed' } }, { $group: { _id: '$assignedTo', completed: { $sum: 1 } } }],
        repOverdue: [
          { $match: { status: { $nin: ['completed', 'cancelled'] }, dueDate: { $lt: now } } },
          { $group: { _id: '$assignedTo', overdue: { $sum: 1 } } },
        ],
        repTotal: [{ $group: { _id: '$assignedTo', total: { $sum: 1 } } }],
      },
    },
  ]);

  const statusByKey = new Map(result.byStatus.map((s) => [s._id, s.count]));
  const statusBreakdown = TASK_STATUSES.map((status) => ({ status, count: statusByKey.get(status) || 0 }));
  const total = result.total[0]?.count || 0;
  const completed = statusByKey.get('completed') || 0;
  const overdue = result.overdue[0]?.count || 0;

  let teamProductivity = [];
  if (isPrivileged(user)) {
    const completedMap = new Map(result.repCompleted.map((r) => [r._id.toString(), r.completed]));
    const overdueMap = new Map(result.repOverdue.map((r) => [r._id.toString(), r.overdue]));
    const totalMap = new Map(result.repTotal.map((r) => [r._id.toString(), r.total]));
    const users = await fetchUsersById([...totalMap.keys()]);

    teamProductivity = [...totalMap.entries()]
      .map(([repId, repTotal]) => {
        const repCompleted = completedMap.get(repId) || 0;
        return {
          userId: repId,
          name: users.get(repId)?.name || 'Unknown',
          role: users.get(repId)?.role,
          total: repTotal,
          completed: repCompleted,
          overdue: overdueMap.get(repId) || 0,
          completionRate: repTotal === 0 ? 0 : Math.round((repCompleted / repTotal) * 1000) / 10,
        };
      })
      .sort((a, b) => b.completed - a.completed);
  }

  return {
    statusBreakdown,
    overdue,
    total,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 1000) / 10,
    teamProductivity,
  };
};
