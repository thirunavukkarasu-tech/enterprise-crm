import fs from 'fs';
import path from 'path';
import { Lead } from '../models/Lead.js';
import { Customer } from '../models/Customer.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/roles.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Employees may only read/modify leads assigned to them. */
const assertAccess = (user, lead) => {
  if (user.role === ROLES.EMPLOYEE && !lead.assignedTo.equals(user._id)) {
    throw ApiError.forbidden('You do not have access to this lead');
  }
};

const logActivity = (type, description, user, leadId, metadata) =>
  Activity.create({ type, description, actor: user._id, relatedLead: leadId, metadata });

// ---------------------------------------------------------------------------
// List (server-side pagination, search, filters, sort)
// ---------------------------------------------------------------------------

export const listLeads = async (user, query) => {
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
  if (query.source) filter.source = query.source;
  if (query.priority) filter.priority = query.priority;

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
    Lead.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .select('-attachments -notes') // list view doesn't need these — keeps the payload light
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ---------------------------------------------------------------------------
// Read one
// ---------------------------------------------------------------------------

export const getLeadById = async (user, id) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false })
    .populate('assignedTo', 'name email role')
    .populate('notes.createdBy', 'name role')
    .populate('attachments.uploadedBy', 'name role')
    .populate('convertedToCustomer', 'name email');

  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);
  return lead;
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createLead = async (user, payload) => {
  const assignedTo =
    user.role !== ROLES.EMPLOYEE && payload.assignedTo ? payload.assignedTo : user._id;

  const lead = await Lead.create({ ...payload, assignedTo });

  await logActivity('lead_created', `${user.name} added lead "${lead.name}"`, user, lead._id);

  return lead;
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateLead = async (user, id, payload) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  if (payload.assignedTo && user.role === ROLES.EMPLOYEE) {
    delete payload.assignedTo;
  }

  const previousStatus = lead.status;
  const previousAssignee = lead.assignedTo?.toString();

  Object.assign(lead, payload);
  await lead.save();

  if (payload.status && payload.status !== previousStatus) {
    await logActivity(
      'lead_status_changed',
      `${user.name} changed "${lead.name}"'s status to ${lead.status}`,
      user,
      lead._id,
      { from: previousStatus, to: lead.status }
    );
  } else if (payload.assignedTo && payload.assignedTo !== previousAssignee) {
    await logActivity('lead_assigned', `${user.name} reassigned "${lead.name}"`, user, lead._id);
  } else {
    await logActivity('lead_updated', `${user.name} updated "${lead.name}"`, user, lead._id);
  }

  return lead;
};

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export const deleteLead = async (user, id) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  lead.isDeleted = true;
  lead.deletedAt = new Date();
  await lead.save();

  await logActivity('lead_deleted', `${user.name} removed lead "${lead.name}"`, user, lead._id);
};

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const addNote = async (user, id, text) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  lead.notes.push({ text, createdBy: user._id });
  await lead.save();
  await lead.populate('notes.createdBy', 'name role');

  await logActivity('lead_note_added', `${user.name} added a note to "${lead.name}"`, user, lead._id);

  return lead.notes[lead.notes.length - 1];
};

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export const addAttachment = async (user, id, file) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  const attachment = {
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/leads/${file.filename}`,
    uploadedBy: user._id,
  };

  lead.attachments.push(attachment);
  await lead.save();
  await lead.populate('attachments.uploadedBy', 'name role');

  await logActivity(
    'lead_attachment_added',
    `${user.name} attached "${file.originalname}" to "${lead.name}"`,
    user,
    lead._id
  );

  return lead.attachments[lead.attachments.length - 1];
};

export const removeAttachment = async (user, id, attachmentId) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  const attachment = lead.attachments.id(attachmentId);
  if (!attachment) throw ApiError.notFound('Attachment not found');

  // Best-effort disk cleanup — a missing file shouldn't block removing the
  // DB reference (e.g. if it was already manually cleaned up).
  const filePath = path.join(process.cwd(), 'uploads', 'leads', attachment.fileName);
  fs.unlink(filePath, () => {});

  attachment.deleteOne();
  await lead.save();
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export const getLeadTimeline = async (user, id, limit = 20) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  return Activity.find({ relatedLead: id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name role')
    .lean();
};

// ---------------------------------------------------------------------------
// Conversion (Lead → Customer)
// ---------------------------------------------------------------------------

export const convertLead = async (user, id) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw ApiError.notFound('Lead not found');
  assertAccess(user, lead);

  if (lead.convertedToCustomer) {
    throw ApiError.badRequest('This lead has already been converted');
  }
  if (!lead.email) {
    throw ApiError.badRequest('Lead must have an email address before it can be converted');
  }

  const existingCustomer = await Customer.findOne({ email: lead.email, isDeleted: false });
  if (existingCustomer) {
    throw ApiError.conflict('A customer with this email already exists');
  }

  const customer = await Customer.create({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    status: 'prospect',
    assignedTo: lead.assignedTo,
  });

  lead.status = 'won';
  lead.convertedToCustomer = customer._id;
  lead.convertedAt = new Date();
  await lead.save();

  await logActivity(
    'lead_converted',
    `${user.name} converted lead "${lead.name}" into a customer`,
    user,
    lead._id,
    { customerId: customer._id }
  );

  // Also recorded on the new customer's own timeline, so its history shows
  // where it came from.
  await Activity.create({
    type: 'customer_created',
    description: `${user.name} created "${customer.name}" by converting a lead`,
    actor: user._id,
    relatedCustomer: customer._id,
    metadata: { convertedFromLeadId: lead._id },
  });

  return { lead, customer };
};
