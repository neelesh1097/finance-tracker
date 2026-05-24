import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import {
  Bell,
  LogOut,
  ShieldAlert,
  CheckCircle,
  Menu,
  Moon,
  Sun,
  UserCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, clearAuth, theme, toggleTheme } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data || []);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error(err);
    } finally {
      clearAuth();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass-panel border-b border-slate-200/50 flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors mr-1"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-md shadow-primary/20">
          <TrendingUpIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            FINANCE
          </span>
          <span className="text-xs font-semibold text-slate-400 ml-1.5 uppercase tracking-widest">
            Tracker
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Verification Alert Banner */}
        {user && !user.emailVerified && (
          <div className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-200 text-xs flex items-center gap-1.5 font-medium animate-pulse">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Verify your email to unlock dashboard.</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4.5 h-4.5 bg-red-500 text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-3 w-80 glass-panel-dark text-slate-200 rounded-2xl shadow-xl border border-white/10 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-secondary hover:text-secondary-light font-medium"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2.5">
                  {notifications.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border transition-colors ${n.read
                          ? 'bg-white/5 border-white/5 text-slate-400'
                          : 'bg-white/10 border-white/10 text-white'
                          }`}
                      >
                        <p className="text-xs">{n.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200/50 pl-4">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <h4 className="text-sm font-semibold text-slate-800">{user.name}</h4>
                {user.emailVerified ? (
                  <CheckCircle className="w-3.5 h-3.5 text-secondary-dark fill-secondary/20" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 capitalize">{user.role.toLowerCase()}</p>
            </div>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

const TrendingUpIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

export default Header;
