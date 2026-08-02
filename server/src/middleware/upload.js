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
