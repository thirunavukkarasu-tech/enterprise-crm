import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import clsx from 'clsx';
import { DateRangeFilter } from '../../components/ui/DateRangeFilter.jsx';
import { ExportMenu } from '../../components/ui/ExportMenu.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ChartSkeleton } from '../../components/common/Skeleton.jsx';
import { reportService } from '../../services/reportService.js';

// Each tab pulls in its own slice of recharts — code-split so switching
// tabs is the only thing that pays for that tab's chart bundle, mirroring
// the lazy-loading approach established for the main Dashboard (Phase 3).
const SalesReportTab = lazy(() => import('./components/SalesReportTab.jsx').then((m) => ({ default: m.SalesReportTab })));
const CustomerReportTab = lazy(() =>
  import('./components/CustomerReportTab.jsx').then((m) => ({ default: m.CustomerReportTab }))
);
const LeadReportTab = lazy(() => import('./components/LeadReportTab.jsx').then((m) => ({ default: m.LeadReportTab })));
const TaskReportTab = lazy(() => import('./components/TaskReportTab.jsx').then((m) => ({ default: m.TaskReportTab })));

const TABS = [
  { key: 'sales', label: 'Sales', Component: SalesReportTab },
  { key: 'customers', label: 'Customers', Component: CustomerReportTab },
  { key: 'leads', label: 'Leads', Component: LeadReportTab },
  { key: 'tasks', label: 'Tasks', Component: TaskReportTab },
];

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  return { from, to, groupBy: 'month' };
};

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.find((t) => t.key === searchParams.get('tab'))?.key || 'sales';
  const [range, setRange] = useState(defaultRange);

  const setActiveTab = (key) => {
    setSearchParams({ tab: key }, { replace: true });
  };

  const ActiveComponent = useMemo(() => TABS.find((t) => t.key === activeTab).Component, [activeTab]);

  const handleExport = (format) => reportService.exportReport({ type: activeTab, format, from: range.from, to: range.to });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-ink-600">Sales, customer, lead, and task performance at a glance.</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu onExport={handleExport} />
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      {/* Print-only header — gives the printed page a title/date-range even though the app chrome above is hidden. */}
      <div className="hidden print:block">
        <h1 className="font-display text-xl font-semibold text-ink">
          {TABS.find((t) => t.key === activeTab).label} Report
        </h1>
        <p className="text-sm text-ink-600">
          {range.from.toLocaleDateString()} – {range.to.toLocaleDateString()}
        </p>
      </div>

      <div className="flex flex-col gap-4 print:hidden">
        <div className="flex gap-1 border-b border-surface-300">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-700'
                  : 'border-transparent text-ink-600 hover:text-ink-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <DateRangeFilter
          from={range.from}
          to={range.to}
          groupBy={range.groupBy}
          onChange={({ from, to }) => setRange((r) => ({ ...r, from, to }))}
          onGroupByChange={(groupBy) => setRange((r) => ({ ...r, groupBy }))}
        />
      </div>

      <Suspense fallback={<ChartSkeleton height={400} />}>
        <ActiveComponent range={range} />
      </Suspense>
    </div>
  );
}
