import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Trophy } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { reportService } from '../../../services/reportService.js';
import { ChartCard } from '../../../components/ui/ChartCard.jsx';
import { ChartSkeleton, ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { StatTile } from './StatTile.jsx';
import { formatCompactCurrency, formatCurrency } from '../../../utils/formatters.js';

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 text-xs shadow-popover">
      <p className="font-medium text-ink-800">{label}</p>
      <p className="mt-0.5 text-brand-600">{formatCurrency(payload[0].value)}</p>
      <p className="text-ink-600">{payload[0].payload.deals} deals closed</p>
    </div>
  );
};

export const SalesReportTab = ({ range }) => {
  const { data, isLoading, error, refetch } = useApiQuery(() => reportService.getSales(range), [range]);

  const isEmpty = !isLoading && !error && data.totals.deals === 0 && data.salesPerformance.length === 0;

  return (
    <div className="space-y-4">
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Revenue" value={formatCompactCurrency(data.totals.revenue)} trend={data.totals.trend} />
          <StatTile label="Deals Won" value={data.totals.deals} sublabel="Closed-won in range" />
          <StatTile label="Avg Deal Size" value={formatCompactCurrency(data.totals.avgDealSize)} sublabel="Per closed-won deal" />
          <StatTile
            label="Top Rep"
            value={data.salesPerformance[0]?.name || '—'}
            sublabel={data.salesPerformance[0] ? formatCompactCurrency(data.salesPerformance[0].revenue) : 'No deals yet'}
          />
        </div>
      )}

      <ChartCard
        title="Revenue Trend"
        subtitle="Closed-won revenue by period"
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        errorMessage="Couldn't load the sales report."
        onRetry={refetch}
        skeleton={<ChartSkeleton />}
        emptyProps={{ icon: TrendingUp, title: 'No closed deals in this range', description: 'Try a wider date range.' }}
      >
        <div className="h-[280px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0EA5A0" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#0EA5A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#E3E6EF" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2E3346' }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#2E3346' }}
                tickFormatter={formatCompactCurrency}
                width={56}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#0EA5A0" strokeWidth={2.5} fill="url(#salesRevenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Sales Performance"
        subtitle="Revenue and win rate by rep"
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        errorMessage="Couldn't load sales performance."
        onRetry={refetch}
        skeleton={<ListSkeleton rows={4} />}
        emptyProps={{ icon: Trophy, title: 'No performance data', description: 'Closed deals will appear here by rep.' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-300 text-xs font-semibold uppercase tracking-wide text-ink-600">
                <th className="px-5 py-3">Rep</th>
                <th className="px-5 py-3">Deals Won</th>
                <th className="px-5 py-3">Deals Lost</th>
                <th className="px-5 py-3">Win Rate</th>
                <th className="px-5 py-3 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data?.salesPerformance.map((rep) => (
                <tr key={rep.userId} className="border-b border-surface-300 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-800">{rep.name}</td>
                  <td className="px-5 py-3 text-ink-800">{rep.dealsWon}</td>
                  <td className="px-5 py-3 text-ink-800">{rep.dealsLost}</td>
                  <td className="px-5 py-3 text-ink-800">{rep.winRate}%</td>
                  <td className="px-5 py-3 text-right font-medium text-ink-800">{formatCurrency(rep.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
