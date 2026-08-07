import { CompanySettings } from '../models/CompanySettings.js';
import { logAudit } from './audit.service.js';

// Fixed, well-known id — the app has exactly one company profile. Always
// upserting this same id (rather than "find the first document") makes
// the singleton constraint explicit and race-safe under concurrent writes.
const SINGLETON_ID = '000000000000000000000001';

export const getCompanySettings = async () => {
  const settings = await CompanySettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return settings;
};

export const updateCompanySettings = async (actor, payload, { ip, userAgent } = {}) => {
  const settings = await CompanySettings.findByIdAndUpdate(
    SINGLETON_ID,
    { ...payload, updatedBy: actor._id },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );

  await logAudit({
    actor: actor._id,
    actorEmail: actor.email,
    action: 'company_settings_updated',
    targetType: 'CompanySettings',
    targetId: settings._id,
    description: `${actor.name} updated company settings`,
    ip,
    userAgent,
  });

  return settings;
};
