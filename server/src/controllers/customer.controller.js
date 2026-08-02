import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as customerService from '../services/customer.service.js';
import { parseCsvBuffer, toCsv } from '../utils/csv.js';

export const listCustomers = asyncHandler(async (req, res) => {
  const { items, meta } = await customerService.listCustomers(req.user, req.query);
  new ApiResponse(200, items, 'Customers fetched', meta).send(res);
});

export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.user, req.params.id);
  new ApiResponse(200, customer, 'Customer fetched').send(res);
});

export const createCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.createCustomer(req.user, req.body);
  new ApiResponse(201, customer, 'Customer created').send(res);
});

export const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await customerService.updateCustomer(req.user, req.params.id, req.body);
  new ApiResponse(200, customer, 'Customer updated').send(res);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
  await customerService.deleteCustomer(req.user, req.params.id);
  new ApiResponse(200, null, 'Customer deleted').send(res);
});

export const addNote = asyncHandler(async (req, res) => {
  const note = await customerService.addNote(req.user, req.params.id, req.body.text);
  new ApiResponse(201, note, 'Note added').send(res);
});

export const getTimeline = asyncHandler(async (req, res) => {
  const timeline = await customerService.getCustomerTimeline(req.user, req.params.id, req.query.limit);
  new ApiResponse(200, timeline, 'Customer timeline fetched').send(res);
});

export const exportCustomers = asyncHandler(async (req, res) => {
  const customers = await customerService.getCustomersForExport(req.user, req.query);

  const csv = toCsv(customers, [
    { label: 'Name', value: (c) => c.name },
    { label: 'Email', value: (c) => c.email },
    { label: 'Phone', value: (c) => c.phone || '' },
    { label: 'Company', value: (c) => c.company || '' },
    { label: 'Industry', value: (c) => c.industry || '' },
    { label: 'Status', value: (c) => c.status },
    { label: 'Tags', value: (c) => (c.tags || []).join(';') },
    { label: 'Assigned To', value: (c) => c.assignedTo?.name || '' },
    { label: 'Created At', value: (c) => new Date(c.createdAt).toISOString() },
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="customers-${Date.now()}.csv"`);
  res.status(200).send(csv);
});

export const importCustomers = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No CSV file was uploaded');
  }

  let rows;
  try {
    rows = parseCsvBuffer(req.file.buffer);
  } catch (err) {
    throw ApiError.badRequest(`Could not parse CSV file: ${err.message}`);
  }

  if (rows.length === 0) {
    throw ApiError.badRequest('The CSV file has no data rows');
  }
  if (rows.length > 1000) {
    throw ApiError.badRequest('CSV import is limited to 1000 rows at a time');
  }

  const summary = await customerService.importCustomersFromRows(req.user, rows);
  new ApiResponse(200, summary, 'Import complete').send(res);
});
