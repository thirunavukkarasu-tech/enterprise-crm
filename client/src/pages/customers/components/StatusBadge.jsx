import clsx from 'clsx';
import { CUSTOMER_STATUS_LABELS, CUSTOMER_STATUS_TONES } from '../../../utils/customerEnums.js';

export const StatusBadge = ({ status }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
      CUSTOMER_STATUS_TONES[status]
    )}
  >
    {CUSTOMER_STATUS_LABELS[status]}
  </span>
);
