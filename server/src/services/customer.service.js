import { Customer } from '../models/Customer.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/roles.js';
import { CUSTOMER_STATUSES } from '../utils/enums.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Employees may only read/modify customers assigned to them. */
const assertAccess = (user, customer) => {
  if (user.role === ROLES.EMPLOYEE && !customer.assignedTo.equals(user._id)) {
    throw ApiError.forbidden('You do not have access to this customer');
  }
};

const logActivity = (type, description, user, customerId, metadata) =>
  Activity.create({ type, description, actor: user._id, relatedCustomer: customerId, metadata });

// ---------------------------------------------------------------------------
// List (server-side pagination, search, filters, sort)
// ---------------------------------------------------------------------------

export const listCustomers = async (user, query) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  const filter = { isDeleted: false };

  if (user.role === ROLES.EMPLOYEE) {
    filter.assignedTo = user._id;
  } else if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.status) filter.status = query.status;
  if (query.tag) filter.tags = query.tag.toLowerCase();
  if (query.industry) filter.industry = new RegExp(`^${escapeRegex(query.industry)}$`, 'i');

  if (query.dateFrom || query.dateTo) {
    filter.createdAt = {};
    if (query.dateFrom) filter.createdAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.createdAt.$lte = new Date(query.dateTo);
  }

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { company: regex }];
  }

  const [items, total] = await Promise.all([
    Customer.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ---------------------------------------------------------------------------
// Read one
// ---------------------------------------------------------------------------

export const getCustomerById = async (user, id) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false })
    .populate('assignedTo', 'name email role')
    .populate('notes.createdBy', 'name role');

  if (!customer) throw ApiError.notFound('Customer not found');
  assertAccess(user, customer);
  return customer;
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createCustomer = async (user, payload) => {
  // Only Admin/HR/Manager may assign a customer to someone else; an
  // Employee-submitted assignedTo is ignored in favor of themselves.
  const assignedTo =
    user.role !== ROLES.EMPLOYEE && payload.assignedTo ? payload.assignedTo : user._id;

  const customer = await Customer.create({ ...payload, assignedTo });

  await logActivity('customer_created', `${user.name} added customer "${customer.name}"`, user, customer._id);

  return customer;
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateCustomer = async (user, id, payload) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  assertAccess(user, customer);

  // Only Admin/HR/Manager may reassign a customer to a different rep.
  if (payload.assignedTo && user.role === ROLES.EMPLOYEE) {
    delete payload.assignedTo;
  }

  const previousStatus = customer.status;
  Object.assign(customer, payload);
  await customer.save();

  if (payload.status && payload.status !== previousStatus) {
    await logActivity(
      'customer_status_changed',
      `${user.name} changed "${customer.name}"'s status to ${customer.status}`,
      user,
      customer._id,
      { from: previousStatus, to: customer.status }
    );
  } else {
    await logActivity('customer_updated', `${user.name} updated "${customer.name}"`, user, customer._id);
  }

  return customer;
};

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export const deleteCustomer = async (user, id) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  assertAccess(user, customer);

  customer.isDeleted = true;
  customer.deletedAt = new Date();
  await customer.save();

  await logActivity('customer_deleted', `${user.name} removed customer "${customer.name}"`, user, customer._id);
};

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const addNote = async (user, id, text) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  assertAccess(user, customer);

  customer.notes.push({ text, createdBy: user._id });
  await customer.save();
  await customer.populate('notes.createdBy', 'name role');

  await logActivity('note_added', `${user.name} added a note to "${customer.name}"`, user, customer._id);

  return customer.notes[customer.notes.length - 1];
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export const getCustomerTimeline = async (user, id, limit = 20) => {
  const customer = await Customer.findOne({ _id: id, isDeleted: false });
  if (!customer) throw ApiError.notFound('Customer not found');
  assertAccess(user, customer);

  return Activity.find({ relatedCustomer: id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name role')
    .lean();
};

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

const MAX_EXPORT_ROWS = 5000;

export const getCustomersForExport = async (user, query) => {
  const filter = { isDeleted: false };
  if (user.role === ROLES.EMPLOYEE) filter.assignedTo = user._id;
  if (query.status) filter.status = query.status;
  if (query.tag) filter.tags = query.tag.toLowerCase();

  return Customer.find(filter)
    .sort({ createdAt: -1 })
    .limit(MAX_EXPORT_ROWS)
    .populate('assignedTo', 'name email')
    .lean();
};

// ---------------------------------------------------------------------------
// CSV import
// ---------------------------------------------------------------------------

const REQUIRED_IMPORT_COLUMNS = ['name', 'email'];

export const importCustomersFromRows = async (user, rows) => {
  const summary = { totalRows: rows.length, created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i += 1) {
    const rowNumber = i + 2; // +1 for 0-index, +1 for the header row
    const row = rows[i];

    const missing = REQUIRED_IMPORT_COLUMNS.filter((col) => !row[col]?.trim());
    if (missing.length > 0) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: `Missing required column(s): ${missing.join(', ')}` });
      continue; // eslint-disable-line no-continue
    }

    if (!/^\S+@\S+\.\S+$/.test(row.email.trim())) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: `Invalid email: ${row.email}` });
      continue; // eslint-disable-line no-continue
    }

    const existing = await Customer.findOne({ email: row.email.trim().toLowerCase(), isDeleted: false });
    if (existing) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: `Email already exists: ${row.email}` });
      continue; // eslint-disable-line no-continue
    }

    const status = CUSTOMER_STATUSES.includes(row.status?.trim().toLowerCase())
      ? row.status.trim().toLowerCase()
      : 'lead';

    try {
      const customer = await Customer.create({
        name: row.name.trim(),
        email: row.email.trim(),
        phone: row.phone?.trim(),
        company: row.company?.trim(),
        industry: row.industry?.trim(),
        address: row.address?.trim(),
        status,
        tags: row.tags ? row.tags.split(';').map((t) => t.trim()).filter(Boolean) : [],
        assignedTo: user._id,
      });
      await logActivity('customer_created', `${user.name} imported customer "${customer.name}"`, user, customer._id);
      summary.created += 1;
    } catch (err) {
      summary.skipped += 1;
      summary.errors.push({ row: rowNumber, reason: err.message });
    }
  }

  return summary;
};
