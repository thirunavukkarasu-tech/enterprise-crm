import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar.jsx';
import { Navbar } from '../components/layout/Navbar.jsx';

/**
 * Shell for every authenticated route. Owns only structural state (is the
 * mobile sidebar drawer open) — page-level data fetching happens inside
 * each routed page component, not here, so this layout never needs to
 * change as new modules are added.
 */
export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface print:h-auto print:overflow-visible">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col print:block">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
