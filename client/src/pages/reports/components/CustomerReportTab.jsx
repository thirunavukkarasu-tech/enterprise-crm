import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users, PieChart as PieIcon, Tags } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { reportService } from '../../../services/reportService.js';
import { ChartCard } from '../../../components/ui/ChartCard.jsx';
import { ChartSkeleton } from '../../../components/common/Skeleton.jsx';
import { StatTile } from './StatTile.jsx';
import { CUSTOMER_STATUS_LABELS } from '../../../utils/customerEnums.js';
import { formatCompactNumber } from '../../../utils/formatters.js';

const STATUS_COLORS = {
  lead: '#94A3B8',
  prospect: '#F5A524',
  active: '#0EA5A0',
  inactive: '#60A5FA',
  churned: '#E11D48',
};

export const CustomerReportTab = ({ range }) => {
  const { data, isLoading, error, refetch } = useApiQuery(() => reportService.getCustomers(range), [range]);

  const isEmpty = !isLoading && !error && data.activeVsInactive.total === 0;
  const statusData = data?.statusBreakdown.filter((s) => s.count > 0);

  return (
    <div className="space-y-4">
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Total Customers" value={formatCompactNumber(data.activeVsInactive.total)} />
          <StatTile
            label="Active"
            value={formatCompactNumber(data.activeVsInactive.active)}
            sublabel={`${
              data.activeVsInactive.total === 0
                ? 0
                : Math.round((data.activeVsInactive.active / data.activeVsInactive.total) * 100)
            }% of total`}
          />
          <StatTile label="New in Range" value={formatCompactNumber(data.growth.reduce((s, g) => s + g.newCustomers, 0))} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard
            title="Customer Growth"
            subtitle="New customers and cumulative total by period"
            isLoading={isLoading}
            error={error}
            isEmpty={isEmpty}
            errorMessage="Couldn't load customer growth."
            onRetry={refetch}
            skeleton={<ChartSkeleton />}
            emptyProps={{ icon: Users, title: 'No customers in this range' }}
          >
            <div className="h-[280px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.growth} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="customerGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0EA5A0" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#0EA5A0" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#E3E6EF" />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2E3346' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2E3346' }} width={40} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="totalCustomers"
                    name="Total"
                    stroke="#0EA5A0"
                    strokeWidth={2.5}
                    fill="url(#customerGrowthGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Active vs Inactive"
          subtitle="By status"
          isLoading={isLoading}
          error={error}
          isEmpty={isEmpty}
          errorMessage="Couldn't load status breakdown."
          onRetry={refetch}
          skeleton={<ChartSkeleton />}
          emptyProps={{ icon: PieIcon, title: 'No status data' }}
        >
          <div className="h-[280px] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData?.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [value, CUSTOMER_STATUS_LABELS[item.payload.status]]} />
                <Legend
                  formatter={(value) => CUSTOMER_STATUS_LABELS[value] || value}
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title="Customer Segmentation"
        subtitle="By industry"
        isLoading={isLoading}
        error={error}
        isEmpty={!isLoading && !error && data.segmentation.byIndustry.length === 0}
        errorMessage="Couldn't load segmentation."
        onRetry={refetch}
        skeleton={<ChartSkeleton />}
        emptyProps={{ icon: Tags, title: 'No industry data yet', description: 'Add an industry when creating customers to see this breakdown.' }}
      >
        <div className="h-[260px] px-2 py-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.segmentation.byIndustry} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#E3E6EF" />
              <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#2E3346' }} />
              <YAxis
                type="category"
                dataKey="industry"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: '#2E3346' }}
                width={110}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#2DD4C6" radius={[0, 6, 6, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );
};
