import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Opportunity } from '../models/Opportunity.js';
import { Task } from '../models/Task.js';
import { scopeToUser } from '../utils/scope.js';
import { rowsToCsv, rowsToXlsx } from '../utils/exporters.js';
import { ApiError } from '../utils/ApiError.js';

const MAX_EXPORT_ROWS = 5000;

/**
 * Exports operate on the underlying records behind a report (not the
 * aggregated chart data) — a sales manager exporting "Sales Report" wants
 * a spreadsheet of the actual deals in that date range to pivot/filter
 * further, not a restatement of the dashboard's summary numbers.
 */
const EXPORTERS = {
  sales: {
    sheetName: 'Sales',
    columns: [
      { key: 'title', header: 'Opportunity' },
      { key: 'customer', header: 'Customer' },
      { key: 'stage', header: 'Stage' },
      { key: 'amount', header: 'Amount (USD)' },
      { key: 'probability', header: 'Probability (%)' },
      { key: 'assignedTo', header: 'Owner' },
      { key: 'createdAt', header: 'Created' },
      { key: 'closedAt', header: 'Closed' },
    ],
    fetch: async (scope, from, to) =>
      Opportunity.find({ ...scope, createdAt: { $gte: from, $lt: to } })
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT_ROWS)
        .populate('customer', 'name')
        .populate('assignedTo', 'name')
        .lean(),
    map: (row) => ({
      title: row.title,
      customer: row.customer?.name || '',
      stage: row.stage,
      amount: row.amount,
      probability: row.probability,
      assignedTo: row.assignedTo?.name || '',
      createdAt: row.createdAt?.toISOString().slice(0, 10),
      closedAt: row.closedAt ? row.closedAt.toISOString().slice(0, 10) : '',
    }),
  },

  customers: {
    sheetName: 'Customers',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'phone', header: 'Phone' },
      { key: 'company', header: 'Company' },
      { key: 'industry', header: 'Industry' },
      { key: 'status', header: 'Status' },
      { key: 'tags', header: 'Tags' },
      { key: 'assignedTo', header: 'Owner' },
      { key: 'createdAt', header: 'Created' },
    ],
    fetch: async (scope, from, to) =>
      Customer.find({ ...scope, isDeleted: false, createdAt: { $gte: from, $lt: to } })
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT_ROWS)
        .populate('assignedTo', 'name')
        .lean(),
    map: (row) => ({
      name: row.name,
      email: row.email,
      phone: row.phone || '',
      company: row.company || '',
      industry: row.industry || '',
      status: row.status,
      tags: (row.tags || []).join('; '),
      assignedTo: row.assignedTo?.name || '',
      createdAt: row.createdAt?.toISOString().slice(0, 10),
    }),
  },

  leads: {
    sheetName: 'Leads',
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'company', header: 'Company' },
      { key: 'status', header: 'Status' },
      { key: 'source', header: 'Source' },
      { key: 'priority', header: 'Priority' },
      { key: 'estimatedValue', header: 'Estimated Value (USD)' },
      { key: 'assignedTo', header: 'Owner' },
      { key: 'createdAt', header: 'Created' },
    ],
    fetch: async (scope, from, to) =>
      Lead.find({ ...scope, isDeleted: false, createdAt: { $gte: from, $lt: to } })
        .sort({ createdAt: -1 })
        .limit(MAX_EXPORT_ROWS)
        .populate('assignedTo', 'name')
        .lean(),
    map: (row) => ({
      name: row.name,
      email: row.email || '',
      company: row.company || '',
      status: row.status,
      source: row.source,
      priority: row.priority,
      estimatedValue: row.estimatedValue,
      assignedTo: row.assignedTo?.name || '',
      createdAt: row.createdAt?.toISOString().slice(0, 10),
    }),
  },

  tasks: {
    sheetName: 'Tasks',
    columns: [
      { key: 'title', header: 'Task' },
      { key: 'category', header: 'Category' },
      { key: 'priority', header: 'Priority' },
      { key: 'status', header: 'Status' },
      { key: 'dueDate', header: 'Due Date' },
      { key: 'assignedTo', header: 'Owner' },
      { key: 'createdAt', header: 'Created' },
    ],
    fetch: async (scope, from, to) =>
      Task.find({ ...scope, isDeleted: false, createdAt: { $gte: from, $lt: to } })
        .sort({ dueDate: 1 })
        .limit(MAX_EXPORT_ROWS)
        .populate('assignedTo', 'name')
        .lean(),
    map: (row) => ({
      title: row.title,
      category: row.category,
      priority: row.priority,
      status: row.status,
      dueDate: row.dueDate?.toISOString().slice(0, 10),
      assignedTo: row.assignedTo?.name || '',
      createdAt: row.createdAt?.toISOString().slice(0, 10),
    }),
  },
};

export const exportReport = async (user, { type, format, from, to }) => {
  const exporter = EXPORTERS[type];
  if (!exporter) throw ApiError.badRequest(`Unknown report type "${type}"`);

  const scope = scopeToUser(user);
  const records = await exporter.fetch(scope, from, to);
  const rows = records.map(exporter.map);

  if (format === 'xlsx') {
    const buffer = await rowsToXlsx(rows, exporter.columns, exporter.sheetName);
    return {
      buffer,
      filename: `${type}-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  const csv = rowsToCsv(rows, exporter.columns);
  return {
    buffer: csv,
    filename: `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`,
    contentType: 'text/csv',
  };
};
