import clsx from 'clsx';
import { tagTone } from '../../../utils/customerEnums.js';

export const TagList = ({ tags = [], max = 3 }) => {
  if (tags.length === 0) return <span className="text-xs text-ink-600/50">—</span>;

  const visible = tags.slice(0, max);
  const overflow = tags.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag) => (
        <span
          key={tag}
          className={clsx('rounded-full px-2 py-0.5 text-xs font-medium leading-none', tagTone(tag))}
        >
          {tag}
        </span>
      ))}
      {overflow > 0 && <span className="text-xs text-ink-600">+{overflow}</span>}
    </div>
  );
};
