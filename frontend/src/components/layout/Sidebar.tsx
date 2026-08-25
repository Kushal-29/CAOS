import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileSpreadsheet, FileCheck, FolderLock, ShieldCheck,
  ListChecks, KanbanSquare, CalendarClock, UserCheck, BellRing, Wallet, Activity, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: any;
  end?: boolean;
  roles?: string[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'CA Dashboard V2', icon: LayoutDashboard, end: true },
  { to: '/clients', label: 'Client Master', icon: Users },
  { to: '/gst', label: 'GST Workspace', icon: FileSpreadsheet },
  { to: '/itr', label: 'ITR Workspace', icon: FileCheck },
  { to: '/documents', label: 'Document Vault', icon: FolderLock },
  { to: '/credentials', label: 'Credential Vault', icon: ShieldCheck },
  { to: '/tasks', label: 'Tasks Board', icon: ListChecks },
  { to: '/kanban', label: 'Kanban Tracking', icon: KanbanSquare },
  { to: '/compliance', label: 'Compliance Calendar', icon: CalendarClock },
  { to: '/employees', label: 'Staff & Employees', icon: UserCheck },
  { to: '/followups', label: 'Follow-up Tracker', icon: BellRing },
  { to: '/revenue', label: 'Revenue & Billing', icon: Wallet },
  { to: '/activity', label: 'Activity Timeline', icon: Activity },
  { to: '/reports', label: 'Practice Reports', icon: BarChart3 },
];

export default function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-500/20">
          CA
        </div>
        <div>
          <p className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">CAOS</p>
          <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 leading-none mt-1">CA Firm OS 700+</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 custom-scrollbar">
        {navItems
          .filter((item) => !item.roles || item.roles.includes(user?.role || ''))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
          <div className="h-7 w-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
            {user?.name?.[0] || 'C'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
