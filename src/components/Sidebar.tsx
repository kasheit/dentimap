import { motion } from 'framer-motion';
import {
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutGrid,
  LogOut,
  MapPin,
  Settings,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavKey = 'portfolio' | 'locations' | 'landlords' | 'documents' | 'activity' | 'courses';

interface SidebarProps {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  locationCount: number;
  onSignOut: () => void;
}

interface NavItem {
  key: NavKey;
  label: string;
  icon: LucideIcon;
  badge?: number;
  sectionBreak?: string;
}

const navItems: NavItem[] = [
  { key: 'portfolio', label: 'Portfolio overview', icon: LayoutGrid },
  { key: 'locations', label: 'Locations', icon: MapPin, badge: 12 },
  { key: 'landlords', label: 'Landlords', icon: Building2 },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'activity', label: 'Activity log', icon: Activity },
  { key: 'courses', label: 'Course planning', icon: GraduationCap, sectionBreak: 'Personal' },
];

export function Sidebar({
  active,
  onNavigate,
  collapsed,
  onToggleCollapse,
  locationCount,
  onSignOut,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 264 }}
      transition={{ type: 'spring', stiffness: 380, damping: 38 }}
      className="fixed inset-y-0 left-0 z-30 flex flex-col bg-navy-800 text-navy-100 dark:bg-navy-900 dark:text-navy-100"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-navy-900 shadow-lg shadow-teal-500/20">
          <Stethoscope className="h-5 w-5" strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="min-w-0"
          >
            <p className="font-brand text-lg font-bold tracking-tight text-white">
              Dentimap
            </p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-navy-300">
              Clinical real estate
            </p>
          </motion.div>
        )}
      </div>

      {/* Workspace switcher */}
      <div className="px-3">
        <button
          className={`flex w-full items-center gap-3 rounded-xl border border-navy-700/60 bg-navy-700/40 px-3 py-2.5 text-left transition-colors hover:border-navy-600 hover:bg-navy-700/70 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-600 text-xs font-semibold text-teal-300">
            EW
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">Eshan's workspace</p>
              <p className="truncate text-[11px] text-navy-300">Owner &amp; Admin</p>
            </div>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const isActive = active === item.key;
          const Icon = item.icon;
          const badge = item.key === 'locations' ? locationCount : item.badge;
          return (
            <div key={item.key}>
              {item.sectionBreak && !collapsed && (
                <p className="mb-1 mt-4 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                  {item.sectionBreak}
                </p>
              )}
              {item.sectionBreak && collapsed && (
                <div className="mx-3 mb-2 mt-3 border-t border-navy-700/60" />
              )}
              <button
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-teal-500/15 text-white'
                    : 'text-navy-200 hover:bg-navy-700/50 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-teal-400"
                  />
                )}
                <Icon
                  className={`h-[18px] w-[18px] shrink-0 ${
                    isActive ? 'text-teal-300' : 'text-navy-300 group-hover:text-white'
                  }`}
                  strokeWidth={2}
                />
                {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
                {!collapsed && badge !== undefined && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isActive
                        ? 'bg-teal-500/25 text-teal-200'
                        : 'bg-navy-700/70 text-navy-300'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 px-3 pb-3">
        <button
          title={collapsed ? 'Settings' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-navy-200 transition-colors hover:bg-navy-700/50 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Settings className="h-[18px] w-[18px] text-navy-300" strokeWidth={2} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          title={collapsed ? 'Help center' : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-navy-200 transition-colors hover:bg-navy-700/50 hover:text-white ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <HelpCircle className="h-[18px] w-[18px] text-navy-300" strokeWidth={2} />
          {!collapsed && <span>Help center</span>}
        </button>
      </div>

      {/* User profile */}
      <div className="border-t border-navy-700/60 px-3 py-3">
        <div
          className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-xs font-semibold text-navy-900">
            EH
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-white">Eshan</p>
              <p className="truncate text-[11px] text-navy-300">Owner &amp; admin</p>
            </div>
          )}
          <button
            onClick={onSignOut}
            title="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-navy-400 transition-colors hover:bg-navy-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-navy-700 bg-navy-700 text-navy-200 shadow-md transition-colors hover:bg-navy-600 hover:text-white"
        aria-label="Toggle sidebar"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </motion.aside>
  );
}

export function UserRoundPlaceholder() {
  return <UserRound />;
}
