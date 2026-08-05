import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckSquare, Users } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { reportService } from '../../../services/reportService.js';
import { ChartCard } from '../../../components/ui/ChartCard.jsx';
import { ChartSkeleton, ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { StatTile } from './StatTile.jsx';
import { TASK_STATUS_LABELS } from '../../../utils/taskEnums.js';
import { formatCompactNumber } from '../../../utils/formatters.js';

const STATUS_COLORS = { pending: '#94A3B8', in_progress: '#F5A524', completed: '#0EA5A0', cancelled: '#E11D48' };

export const TaskReportTab = ({ range }) => {
  const { data, isLoading, error, refetch } = useApiQuery(() => reportService.getTasks(range), [range]);

  const isEmpty = !isLoading && !error && data.total === 0;
  const statusData = data?.statusBreakdown.filter((s) => s.count > 0);

  return (
    <div className="space-y-4">
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Total Tasks" value={formatCompactNumber(data.total)} sublabel="In selected range" />
          <StatTile label="Completion Rate" value={`${data.completionRate}%`} />
          <StatTile label="Overdue" value={formatCompactNumber(data.overdue)} sublabel="Still open, past due date" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Task Status Breakdown"
          subtitle="Pending, in progress, completed, cancelled"
          isLoading={isLoading}
          error={error}
          isEmpty={isEmpty}
          errorMessage="Couldn't load task status breakdown."
          onRetry={refetch}
          skeleton={<ChartSkeleton />}
          emptyProps={{ icon: CheckSquare, title: 'No tasks in this range' }}
        >
          <div className="h-[280px] px-2 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {statusData?.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [value, TASK_STATUS_LABELS[item.payload.status]]} />
                <Legend
                  formatter={(value) => TASK_STATUS_LABELS[value] || value}
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          title="Team Productivity"
          subtitle="Completed & overdue tasks by rep"
          isLoading={isLoading}
          error={error}
          isEmpty={!isLoading && !error && data.teamProductivity.length === 0}
          errorMessage="Couldn't load team productivity."
          onRetry={refetch}
          skeleton={<ListSkeleton rows={4} />}
          emptyProps={{
            icon: Users,
            title: 'No team data to show',
            description: 'Visible to Admin, HR, and Manager roles once tasks are assigned.',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-left text-sm">
              <thead>
                <tr className="border-b border-surface-300 text-xs font-semibold uppercase tracking-wide text-ink-600">
                  <th className="px-5 py-3">Rep</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3">Overdue</th>
                  <th className="px-5 py-3 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {data?.teamProductivity.map((rep) => (
                  <tr key={rep.userId} className="border-b border-surface-300 last:border-0">
                    <td className="px-5 py-3 font-medium text-ink-800">{rep.name}</td>
                    <td className="px-5 py-3 text-ink-800">{rep.completed}</td>
                    <td className="px-5 py-3 text-ink-800">
                      <span className={rep.overdue > 0 ? 'font-medium text-rose-600' : 'text-ink-800'}>{rep.overdue}</span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-ink-800">{rep.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};
