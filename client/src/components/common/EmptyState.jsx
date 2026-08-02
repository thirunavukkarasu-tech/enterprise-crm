import { Inbox } from 'lucide-react';

export const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
    <Icon className="h-7 w-7 text-ink-600/40" aria-hidden="true" />
    <p className="mt-3 text-sm font-medium text-ink-700">{title}</p>
    {description && <p className="mt-1 max-w-[22rem] text-xs text-ink-600">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
