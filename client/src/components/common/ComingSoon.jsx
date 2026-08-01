import { Construction } from 'lucide-react';

export const ComingSoon = ({ title, phase }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 bg-surface-100 px-6 py-20 text-center">
    <Construction className="h-8 w-8 text-brand-500" aria-hidden="true" />
    <h2 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h2>
    <p className="mt-1.5 max-w-sm text-sm text-ink-600">
      This module is scaffolded and routed — the full experience ships in {phase}.
    </p>
  </div>
);
