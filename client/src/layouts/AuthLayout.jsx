import { Outlet } from 'react-router-dom';

/**
 * Signature visual: an abstract, ascending "signal" field — echoes the
 * sidebar brand mark's bar-into-dot motif at a larger scale, standing in
 * for pipeline momentum without leaning on a generic stock illustration.
 */
const SignalField = () => (
  <svg viewBox="0 0 400 400" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="400" fill="#12141C" />
    {Array.from({ length: 9 }).map((_, col) => {
      const x = 24 + col * 42;
      const heights = [40, 70, 55, 95, 130, 100, 150, 120, 70];
      const h = heights[col];
      const opacity = 0.18 + (col / 9) * 0.55;
      return (
        <rect
          key={x}
          x={x}
          y={340 - h}
          width={22}
          height={h}
          rx={6}
          fill="#2DD4C6"
          opacity={opacity}
        />
      );
    })}
    <circle cx="360" cy="70" r="7" fill="#0EA5A0" />
  </svg>
);

export const AuthLayout = () => {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Form pane */}
      <div className="flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>

      {/* Brand pane */}
      <div className="relative hidden overflow-hidden lg:block">
        <SignalField />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <h2 className="font-display text-3xl font-semibold text-white">
            Every conversation, one pipeline.
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-surface-300/80">
            Track customers, leads, and follow-ups from first contact to closed deal —
            built for sales teams that move fast and never drop a thread.
          </p>
        </div>
      </div>
    </div>
  );
};
