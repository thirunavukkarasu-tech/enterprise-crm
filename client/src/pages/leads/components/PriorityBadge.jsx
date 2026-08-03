import clsx from 'clsx';
import { LEAD_PRIORITY_LABELS, LEAD_PRIORITY_TONES } from '../../../utils/leadEnums.js';

export const PriorityBadge = ({ priority }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize leading-none',
      LEAD_PRIORITY_TONES[priority]
    )}
  >
    {LEAD_PRIORITY_LABELS[priority]}
  </span>
);
