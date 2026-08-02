import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Users2 } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ChartSkeleton } from '../../../components/common/Skeleton.jsx';
import { formatCompactNumber } from '../../../utils/formatters.js';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 text-xs shadow-popover">
      <p className="font-medium text-ink-800">{label}</p>
      <p className="mt-0.5 text-brand-600">+{payload[0].payload.newCustomers} new</p>
      <p className="text-ink-600">{payload[0].payload.totalCustomers} total</p>
    </div>
  );
};

export default function CustomerGrowthStats() {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getCustomerGrowth(6),
    []
  );

  const latestTotal = data?.[data.length - 1]?.totalCustomers ?? 0;
  const totalNew = data?.reduce((sum, d) => sum + d.newCustomers, 0) || 0;
  const isEmpty = !isLoading && !error && latestTotal === 0;

  return (
    <ChartCard
      title="Customer Growth"
      subtitle={
        !isLoading && !error && !isEmpty ? `${formatCompactNumber(totalNew)} new in 6 months` : undefined
      }
      action={
        !isLoading &&
        !error &&
        !isEmpty && (
          <span className="text-sm font-semibold text-ink">{formatCompactNumber(latestTotal)} total</span>
        )
      }
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load customer growth."
      onRetry={refetch}
      skeleton={<ChartSkeleton height={160} />}
      emptyProps={{
        icon: Users2,
        title: 'No customers yet',
        description: 'Customer growth trends will appear here over time.',
      }}
    >
      <div className="h-[160px] px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2DD4C6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2DD4C6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#2E3346' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="totalCustomers"
              stroke="#0B8681"
              strokeWidth={2}
              fill="url(#customerGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
