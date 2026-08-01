import { ComingSoon } from '../../components/common/ComingSoon.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Welcome{user?.name ? `, ${user.name}` : ''} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-600">Here's what's happening across your pipeline.</p>
      </div>
      <ComingSoon title="KPI cards, revenue summary & charts" phase="the Dashboard module phase" />
    </div>
  );
}
