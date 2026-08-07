import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthLayout } from '../layouts/AuthLayout.jsx';
import { DashboardLayout } from '../layouts/DashboardLayout.jsx';
import { ProtectedRoute } from '../components/common/ProtectedRoute.jsx';

import Login from '../pages/auth/Login.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';
import ResetPassword from '../pages/auth/ResetPassword.jsx';
import Dashboard from '../pages/dashboard/Dashboard.jsx';
import Customers from '../pages/customers/Customers.jsx';
import CustomerDetail from '../pages/customers/CustomerDetail.jsx';
import Leads from '../pages/leads/Leads.jsx';
import LeadDetail from '../pages/leads/LeadDetail.jsx';
import Tasks from '../pages/tasks/Tasks.jsx';
import TaskDetail from '../pages/tasks/TaskDetail.jsx';
import Followups from '../pages/followups/Followups.jsx';
import Reports from '../pages/reports/Reports.jsx';
import Settings from '../pages/settings/Settings.jsx';
import NotFound from '../pages/NotFound.jsx';

/**
 * Central route table. New modules add exactly one <Route> line inside the
 * authenticated block — layouts, guards, and navigation are already wired,
 * which is the entire point of the Phase 1 scaffold (see docs/ARCHITECTURE.md §7).
 */
export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public — auth pages */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Authenticated — dashboard shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/followups" element={<Followups />} />
          <Route path="/reports/*" element={<Reports />} />
          <Route path="/settings/*" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
