import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Filter } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ChartSkeleton } from '../../../components/common/Skeleton.jsx';
import { LEAD_STATUS_LABELS } from '../../../utils/dashboardEnums.js';
import { Badge } from '../../../components/ui/Badge.jsx';

const BAR_COLORS = {
  new: '#94A3B8',
  contacted: '#60A5FA',
  qualified: '#2DD4C6',
  proposal: '#F5A524',
  won: '#0EA5A0',
  lost: '#E11D48',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-300 bg-surface-100 px-3 py-2 text-xs shadow-popover">
      <p className="font-medium text-ink-800">{LEAD_STATUS_LABELS[item.status]}</p>
      <p className="mt-0.5 text-ink-600">{item.count} leads</p>
    </div>
  );
};

export default function LeadConversionChart() {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getLeadConversion(),
    []
  );

  const isEmpty = !isLoading && !error && data?.totalLeads === 0;

  return (
    <ChartCard
      title="Lead Conversion"
      subtitle="Funnel by status"
      action={
        !isLoading &&
        !error &&
        !isEmpty && <Badge tone="brand">{data.conversionRate}% conversion</Badge>
      }
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load the lead conversion funnel."
      onRetry={refetch}
      skeleton={<ChartSkeleton />}
      emptyProps={{
        icon: Filter,
        title: 'No leads yet',
        description: 'Your conversion funnel will populate as leads come in.',
      }}
    >
      <div className="h-[260px] px-2 py-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.funnel} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E3E6EF" />
            <XAxis
              dataKey="status"
              tickFormatter={(s) => LEAD_STATUS_LABELS[s]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: '#2E3346' }}
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2E3346' }} width={32} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#EEF0F6' }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {data?.funnel.map((entry) => (
                <Cell key={entry.status} fill={BAR_COLORS[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}
