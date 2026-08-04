import clsx from 'clsx';
import { FOLLOWUP_STATUS_LABELS, FOLLOWUP_STATUS_TONES } from '../../../utils/followupEnums.js';

export const FollowUpStatusBadge = ({ status }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
      FOLLOWUP_STATUS_TONES[status]
    )}
  >
    {FOLLOWUP_STATUS_LABELS[status]}
  </span>
);
