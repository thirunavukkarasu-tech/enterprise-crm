import {
  UserRound,
  ShieldCheck,
  Sliders,
  Bell,
  Building2,
  Users,
  KeySquare,
  ScrollText,
  LogIn,
} from 'lucide-react';
import { ROLES } from '../../../utils/roles.js';

/**
 * Single source of truth for the Settings sidebar, mirroring the pattern
 * established for the main app Sidebar (`utils/navigation.js`). Every
 * user gets Profile/Security/Preferences/Notifications; Administration
 * sections are Admin-only.
 */
export const SETTINGS_SECTIONS = [
  {
    group: 'Account',
    items: [
      { label: 'Profile', to: '/settings/profile', icon: UserRound },
      { label: 'Security', to: '/settings/security', icon: ShieldCheck },
      { label: 'Preferences', to: '/settings/preferences', icon: Sliders },
      { label: 'Notifications', to: '/settings/notifications', icon: Bell },
    ],
  },
  {
    group: 'Administration',
    roles: [ROLES.ADMIN],
    items: [
      { label: 'Company', to: '/settings/company', icon: Building2 },
      { label: 'Manage Users', to: '/settings/users', icon: Users },
      { label: 'Roles & Permissions', to: '/settings/roles', icon: KeySquare },
      { label: 'Audit Logs', to: '/settings/audit-logs', icon: ScrollText },
      { label: 'Login History', to: '/settings/login-history', icon: LogIn },
    ],
  },
];
