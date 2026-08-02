import { lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roles.js';
import { KpiCardsRow } from './components/KpiCardsRow.jsx';
import { SalesPipeline } from './components/SalesPipeline.jsx';
import { ActivityTimeline } from './components/ActivityTimeline.jsx';
import { UpcomingTasks } from './components/UpcomingTasks.jsx';
import { NotificationsPanel } from './components/NotificationsPanel.jsx';
import { QuickActions } from './components/QuickActions.jsx';
import { TopPerformers } from './components/TopPerformers.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { ChartSkeleton } from '../../components/common/Skeleton.jsx';

// Recharts is a sizeable dependency (~90KB gzipped) — these three widgets
// are the only consumers of it on the whole dashboard, so they're code-split
// into their own chunk and only fetched once they're actually about to
// render, instead of inflating the initial dashboard bundle for every user
// regardless of role or viewport.
const RevenueAnalyticsChart = lazy(() => import('./components/RevenueAnalyticsChart.jsx'));
const LeadConversionChart = lazy(() => import('./components/LeadConversionChart.jsx'));
const CustomerGrowthStats = lazy(() => import('./components/CustomerGrowthStats.jsx'));

const ChartFallback = ({ title }) => (
  <Card>
    <CardHeader title={title} />
    <ChartSkeleton />
  </Card>
);

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-600">Here's what's happening across your pipeline today.</p>
      </div>

      <KpiCardsRow />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Suspense fallback={<ChartFallback title="Revenue Analytics" />}>
            <RevenueAnalyticsChart />
          </Suspense>
        </div>
        <SalesPipeline />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Suspense fallback={<ChartFallback title="Lead Conversion" />}>
          <LeadConversionChart />
        </Suspense>
        <Suspense fallback={<ChartFallback title="Customer Growth" />}>
          <CustomerGrowthStats />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ActivityTimeline />
        <UpcomingTasks />
        <NotificationsPanel />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {user?.role !== ROLES.EMPLOYEE && <TopPerformers />}
        <div className={user?.role === ROLES.EMPLOYEE ? 'lg:col-span-2' : undefined}>
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
