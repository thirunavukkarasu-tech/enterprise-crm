import clsx from 'clsx';
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_TONES } from '../../../utils/taskEnums.js';

export const TaskPriorityBadge = ({ priority }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
      TASK_PRIORITY_TONES[priority]
    )}
  >
    {TASK_PRIORITY_LABELS[priority]}
  </span>
);
