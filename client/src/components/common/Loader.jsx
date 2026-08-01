import { Loader2 } from 'lucide-react';

/** Used while auth session is being restored, or any full-page async gate. */
export const FullPageLoader = ({ label = 'Loading…' }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-surface">
    <Loader2 className="h-8 w-8 animate-spin text-brand-500" aria-hidden="true" />
    <p className="text-sm text-ink-600">{label}</p>
  </div>
);

/** Used inline inside cards/tables while a section's data is fetching. */
export const InlineLoader = ({ label }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-ink-600">
    <Loader2 className="h-5 w-5 animate-spin text-brand-500" aria-hidden="true" />
    {label && <span className="text-sm">{label}</span>}
  </div>
);
