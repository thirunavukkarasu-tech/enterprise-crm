import { Navigate, Route, Routes } from 'react-router-dom';
import { SettingsShell } from './components/SettingsShell.jsx';
import { ProtectedRoute } from '../../components/common/ProtectedRoute.jsx';
import { ROLES } from '../../utils/roles.js';
import { ProfileTab } from './components/ProfileTab.jsx';
import { SecurityTab } from './components/SecurityTab.jsx';
import { PreferencesTab } from './components/PreferencesTab.jsx';
import { NotificationsTab } from './components/NotificationsTab.jsx';
import { CompanyTab } from './components/CompanyTab.jsx';
import { UsersTab } from './components/UsersTab.jsx';
import { RolesTab } from './components/RolesTab.jsx';
import { AuditLogsTab } from './components/AuditLogsTab.jsx';
import { LoginHistoryTab } from './components/LoginHistoryTab.jsx';

/**
 * A second, local <Routes> nested under the app-wide "/settings/*" catch-all
 * (see routes/AppRoutes.jsx) — the same pattern Reports uses for its tabs,
 * except Settings' tabs are real routes (deep-linkable, back-button-
 * friendly) rather than tab state, since a user might bookmark
 * "/settings/users" or share it with another admin.
 *
 * Every user gets Account routes (Profile/Security/Preferences/
 * Notifications); Administration routes are wrapped in a second
 * ProtectedRoute so an Employee hitting /settings/users directly gets
 * redirected rather than seeing a broken page — the Settings sidebar
 * (SettingsShell) already hides these links for non-admins, but the route
 * guard is the actual security boundary, not the hidden link.
 */
export default function Settings() {
  return (
    <Routes>
      <Route element={<SettingsShell />}>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<ProfileTab />} />
        <Route path="security" element={<SecurityTab />} />
        <Route path="preferences" element={<PreferencesTab />} />
        <Route path="notifications" element={<NotificationsTab />} />

        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
          <Route path="company" element={<CompanyTab />} />
          <Route path="users" element={<UsersTab />} />
          <Route path="roles" element={<RolesTab />} />
          <Route path="audit-logs" element={<AuditLogsTab />} />
          <Route path="login-history" element={<LoginHistoryTab />} />
        </Route>
      </Route>
    </Routes>
  );
}
