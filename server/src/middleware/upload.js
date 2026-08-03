import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const storage = multer.memoryStorage(); // small CSVs only — no need to touch disk

const fileFilter = (req, file, cb) => {
  const isCsv = file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv');
  if (!isCsv) {
    cb(ApiError.badRequest('Only .csv files are accepted'));
    return;
  }
  cb(null, true);
};

export const uploadCsv = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB — generous for a contact-list CSV
});

// ---------------------------------------------------------------------------
// Lead attachments — local disk storage
// ---------------------------------------------------------------------------
// Files are written to `server/uploads/leads/` and served statically (see
// app.js). This is a deliberate portfolio-scope simplification: swapping to
// S3/GCS later only means changing this one file — the Lead schema stores
// generic { fileName, url, mimeType, size } metadata that doesn't care
// where the bytes actually live (see models/Lead.js).
const ATTACHMENTS_DIR = path.join(process.cwd(), 'uploads', 'leads');
fs.mkdirSync(ATTACHMENTS_DIR, { recursive: true });

const ALLOWED_ATTACHMENT_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ATTACHMENTS_DIR),
  filename: (req, file, cb) => {
    // Randomized filename on disk — never trust the client-provided name
    // for the stored path (path traversal / collision safety). The
    // human-readable original name is preserved separately in the DB.
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const attachmentFileFilter = (req, file, cb) => {
  if (!ALLOWED_ATTACHMENT_TYPES.has(file.mimetype)) {
    cb(ApiError.badRequest('Unsupported file type'));
    return;
  }
  cb(null, true);
};

export const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});
