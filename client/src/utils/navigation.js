import {
  LayoutDashboard,
  Users,
  Target,
  CheckSquare,
  PhoneCall,
  BarChart3,
  Settings,
} from 'lucide-react';
import { ROLES } from './roles.js';

/**
 * Single source of truth for sidebar navigation. Each module registers one
 * entry here instead of the Sidebar component growing a hardcoded JSX list —
 * this is the extension point for every remaining phase (Customers, Leads,
 * Tasks, Follow-ups, Reports all plug in here as they ship).
 *
 * `roles: undefined` means "visible to everyone authenticated".
 */
export const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Customers', to: '/customers', icon: Users },
  { label: 'Leads', to: '/leads', icon: Target },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Follow-ups', to: '/followups', icon: PhoneCall },
  { label: 'Reports', to: '/reports', icon: BarChart3 },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    roles: [ROLES.ADMIN],
  },
];
