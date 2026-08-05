import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter, Radio } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { reportService } from '../../../services/reportService.js';
import { ChartCard } from '../../../components/ui/ChartCard.jsx';
import { ChartSkeleton, ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { StatTile } from './StatTile.jsx';
import { LEAD_STATUS_LABELS } from '../../../utils/dashboardEnums.js';
import { LEAD_SOURCE_LABELS } from '../../../utils/leadEnums.js';
import { formatCompactNumber } from '../../../utils/formatters.js';

const STATUS_COLORS = { new: '#94A3B8', contacted: '#60A5FA', qualified: '#2DD4C6', proposal: '#F5A524', won: '#0EA5A0', lost: '#E11D48' };

export const LeadReportTab = ({ range }) => {
  const { data, isLoading, error, refetch } = useApiQuery(() => reportService.getLeads(range), [range]);

  const isEmpty = !isLoading && !error && data.totalLeads === 0;

  return (
    <div className="space-y-4">
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Total Leads" value={formatCompactNumber(data.totalLeads)} sublabel="In selected range" />
          <StatTile label="Conversion Rate" value={`${data.conversionRate}%`} sublabel="Leads won" />
          <StatTile label="Top Source" value={LEAD_SOURCE_LABELS[data.bySource[0]?.source] || '—'} sublabel={data.bySource[0] ? `${data.bySource[0].count} leads` : 'No data yet'} />
        </div>
      )}

      <ChartCard
        title="Conversion Funnel"
        subtitle="Leads by status"
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        errorMessage="Couldn't load the conversion funnel."
        onRetry={refetch}
        skeleton={<ChartSkeleton />}
        emptyProps={{ icon: Filter, title: 'No leads in this range' }}
      >
        <div className="h-[280px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.funnel} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#E3E6EF" />
              <XAxis
                dataKey="status"
                tickFormatter={(s) => LEAD_STATUS_LABELS[s]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: '#2E3346' }}
              />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2E3346' }} width={32} />
              <Tooltip formatter={(value, _name, item) => [value, LEAD_STATUS_LABELS[item.payload.status]]} cursor={{ fill: '#EEF0F6' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                {data?.funnel.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard
        title="Lead Source Analysis"
        subtitle="Volume and conversion rate by source"
        isLoading={isLoading}
        error={error}
        isEmpty={isEmpty}
        errorMessage="Couldn't load source analysis."
        onRetry={refetch}
        skeleton={<ListSkeleton rows={4} />}
        emptyProps={{ icon: Radio, title: 'No source data' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-300 text-xs font-semibold uppercase tracking-wide text-ink-600">
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Leads</th>
                <th className="px-5 py-3">Won</th>
                <th className="px-5 py-3 text-right">Conversion Rate</th>
              </tr>
            </thead>
            <tbody>
              {data?.bySource.map((s) => (
                <tr key={s.source} className="border-b border-surface-300 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-800">{LEAD_SOURCE_LABELS[s.source]}</td>
                  <td className="px-5 py-3 text-ink-800">{s.count}</td>
                  <td className="px-5 py-3 text-ink-800">{s.won}</td>
                  <td className="px-5 py-3 text-right font-medium text-ink-800">{s.conversionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
};
