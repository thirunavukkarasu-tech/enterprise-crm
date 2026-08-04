import clsx from 'clsx';
import { TASK_STATUS_LABELS, TASK_STATUS_TONES } from '../../../utils/taskEnums.js';

export const TaskStatusBadge = ({ status }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
      TASK_STATUS_TONES[status]
    )}
  >
    {TASK_STATUS_LABELS[status]}
  </span>
);
