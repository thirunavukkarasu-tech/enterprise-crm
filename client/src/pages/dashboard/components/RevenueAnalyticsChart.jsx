import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ChartSkeleton } from '../../../components/common/Skeleton.jsx';
import { formatCompactCurrency, formatCurrency } from '../../../utils/formatters.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 text-xs shadow-popover">
      <p className="font-medium text-ink-800">{label}</p>
      <p className="mt-0.5 text-brand-600">{formatCurrency(payload[0].value)}</p>
      <p className="text-ink-600">{payload[0].payload.deals} deals closed</p>
    </div>
  );
};

export default function RevenueAnalyticsChart() {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getRevenueAnalytics(6),
    []
  );

  const totalRevenue = data?.reduce((sum, d) => sum + d.revenue, 0) || 0;
  const isEmpty = !isLoading && !error && totalRevenue === 0;

  return (
    <ChartCard
      title="Revenue Analytics"
      subtitle="Closed-won revenue, last 6 months"
      action={
        !isLoading &&
        !error &&
        !isEmpty && (
          <span className="text-sm font-semibold text-ink">{formatCompactCurrency(totalRevenue)}</span>
        )
      }
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load revenue analytics."
      onRetry={refetch}
      skeleton={<ChartSkeleton />}
      emptyProps={{
        icon: TrendingUp,
        title: 'No closed revenue yet',
        description: 'Closed-won deals will appear here as your pipeline converts.',
      }}
    >
      <div className="h-[260px] px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0EA5A0" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#0EA5A0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E3E6EF" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#2E3346' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: '#2E3346' }}
              tickFormatter={formatCompactCurrency}
              width={56}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0EA5A0"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
