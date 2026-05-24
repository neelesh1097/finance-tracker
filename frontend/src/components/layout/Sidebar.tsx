import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  LineChart,
  Target,
  Wallet,
  CalendarDays,
  TrendingUp,
  Settings,
  Menu,
  ChevronLeft
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  mobileMenuOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, mobileMenuOpen }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Investments', path: '/investments', icon: LineChart },
    { name: 'Goal Planner', path: '/goals', icon: Target },
    { name: 'Budgets', path: '/budgets', icon: TrendingUp },
    { name: 'Shared Wallets', path: '/wallets', icon: Wallet },
    { name: 'Subscriptions', path: '/subscriptions', icon: CalendarDays },
  ];

  return (
    <aside className={`glass-panel border-r border-slate-200/50 min-h-screen p-4 flex flex-col justify-between fixed left-0 top-0 z-30 pt-20 transition-all duration-300 lg:translate-x-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} ${mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between px-3 py-2">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider animate-in fade-in duration-200">
              Finance Manager
            </p>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors ml-auto flex items-center justify-center"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-250">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200/60 pt-4 px-2">
        <div className={`flex items-center gap-3 p-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
            AG
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-200">
              <h4 className="text-xs font-semibold text-slate-700"></h4>
              <p className="text-[10px] text-slate-400">Enterprise Edition</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
