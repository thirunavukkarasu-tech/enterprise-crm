import mongoose from 'mongoose';

/**
 * Deliberately a singleton: the app has exactly one company profile, not
 * a collection of them. Enforced by always upserting a fixed, well-known
 * _id (see `SINGLETON_ID` in company-settings.service.js) rather than
 * modeling multi-tenancy this app doesn't have.
 */
const companySettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, trim: true, maxlength: 150, default: 'My Company' },
    industry: { type: String, trim: true, maxlength: 100 },
    website: { type: String, trim: true, maxlength: 200 },
    supportEmail: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 30 },
    address: { type: String, trim: true, maxlength: 300 },
    logoUrl: { type: String, trim: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);
