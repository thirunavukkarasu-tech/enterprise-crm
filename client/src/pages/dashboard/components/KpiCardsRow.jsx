import { Users, Target, Briefcase, DollarSign } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { KpiCard } from './KpiCard.jsx';
import { KpiCardSkeleton } from '../../../components/common/Skeleton.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { formatCompactCurrency, formatCompactNumber } from '../../../utils/formatters.js';

export const KpiCardsRow = () => {
  const { data, isLoading, error, refetch } = useApiQuery(() => dashboardService.getKpis(), []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-surface-300 bg-surface-100">
        <ErrorState message="Couldn't load your KPIs." onRetry={refetch} />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total Customers',
      value: formatCompactNumber(data.totalCustomers.value),
      trend: data.totalCustomers.trend,
      icon: Users,
      iconTone: 'brand',
    },
    {
      label: 'Active Leads',
      value: formatCompactNumber(data.activeLeads.value),
      trend: data.activeLeads.trend,
      icon: Target,
      iconTone: 'amber',
    },
    {
      label: 'Opportunities',
      value: formatCompactNumber(data.opportunities.value),
      trend: data.opportunities.trend,
      icon: Briefcase,
      iconTone: 'brand',
    },
    {
      label: 'Monthly Revenue',
      value: formatCompactCurrency(data.monthlyRevenue.value),
      trend: data.monthlyRevenue.trend,
      icon: DollarSign,
      iconTone: 'amber',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, i) => (
        <KpiCard key={card.label} {...card} style={{ animationDelay: `${i * 60}ms` }} />
      ))}
    </div>
  );
};
