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
// Generic attachment uploader — local disk storage
// ---------------------------------------------------------------------------
// Files are written to `server/uploads/<subdir>/` and served statically (see
// app.js). This is a deliberate portfolio-scope simplification: swapping to
// S3/GCS later only means changing this one file — every schema that embeds
// attachments (Lead, Task) stores the same generic { fileName, url,
// mimeType, size } shape that doesn't care where the bytes actually live.
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

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

/**
 * Creates a multer instance scoped to `uploads/<subdir>/`. Each module that
 * needs file attachments (Leads, Tasks, ...) calls this once with its own
 * subdirectory rather than each hand-rolling its own multer config.
 *
 * `allowedTypes`/`maxSizeMB` let a caller narrow the defaults — used by
 * the avatar uploader below, since a profile picture should be an image
 * under a couple MB, not any of the general attachment types up to 10MB.
 */
export const createAttachmentUploader = (subdir, { allowedTypes = ALLOWED_ATTACHMENT_TYPES, maxSizeMB = 10 } = {}) => {
  const dir = path.join(process.cwd(), 'uploads', subdir);
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      // Randomized filename on disk — never trust the client-provided name
      // for the stored path (path traversal / collision safety). The
      // human-readable original name is preserved separately in the DB.
      const uniqueSuffix = crypto.randomBytes(16).toString('hex');
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  const scopedFileFilter = (req, file, cb) => {
    if (!allowedTypes.has(file.mimetype)) {
      cb(ApiError.badRequest('Unsupported file type'));
      return;
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter: scopedFileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};

export const uploadAttachment = createAttachmentUploader('leads');
export const uploadTaskAttachment = createAttachmentUploader('tasks');
export const uploadAvatar = createAttachmentUploader('avatars', { allowedTypes: IMAGE_TYPES, maxSizeMB: 2 });
