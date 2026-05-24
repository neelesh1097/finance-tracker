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
  Settings
} from 'lucide-react';

export const Sidebar: React.FC = () => {
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
    <aside className="w-64 glass-panel border-r border-slate-200/50 min-h-screen p-4 flex flex-col justify-between fixed left-0 top-0 z-30 pt-20">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Finance Manager
          </p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200/60 pt-4 px-2">
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            AG
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-700">Antigravity V1.0</h4>
            <p className="text-[10px] text-slate-400">Enterprise Edition</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
