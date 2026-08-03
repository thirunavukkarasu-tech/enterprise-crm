import clsx from 'clsx';
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONES } from '../../../utils/leadEnums.js';

export const LeadStatusBadge = ({ status }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
      LEAD_STATUS_TONES[status]
    )}
  >
    {LEAD_STATUS_LABELS[status]}
  </span>
);
