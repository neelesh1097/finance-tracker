import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { api } from '../../services/api';
import { ShieldCheck, Mail, ArrowRight, RefreshCw } from 'lucide-react';

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setVerified } = useAuthStore();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await api.post('/auth/verify', { email: user.email, token });
      setVerified(); // Updates Zustand and local storage
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user) return;
    setError('');
    setMessage('');
    setResending(true);

    try {
      const { data } = await api.post('/auth/resend-verification', { email: user.email });
      setMessage(data.data.message || 'Verification code resent.');
      // For demonstration, log the verification token if returned in development
      if (data.data.devVerificationToken) {
        console.log(`[DEMO ONLY] Resent Token: ${data.data.devVerificationToken}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  // Verification Gate Page
  if (user && !user.emailVerified) {
    return (
      <div className="min-h-screen bg-auth-mesh bg-mesh flex flex-col justify-between">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-6 pt-24 pb-12">
          <div className="w-full max-w-md glass-card-no-hover p-8 text-center border border-white/50 space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary animate-pulse">
              <Mail className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800">Verify Your Email</h2>
              <p className="text-sm text-slate-500">
                We've sent a 6-digit verification code to <span className="font-semibold text-slate-700">{user.email}</span>. Please enter it below to unlock your dashboard.
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-bold py-3.5 px-4 rounded-xl border border-slate-200 bg-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>

              {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
              {message && <p className="text-xs text-secondary-dark font-semibold">{message}</p>}

              <button
                type="submit"
                disabled={loading || token.length !== 6}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Verify Account</span>}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="border-t border-slate-200/50 pt-4 flex items-center justify-between text-xs text-slate-500">
              <span>Didn't receive the code?</span>
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-primary hover:underline font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'Resend Code'}
              </button>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-[10px] text-slate-400">
          © 2026 Antigravity. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh bg-mesh-light">
      <Header onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <div className="flex">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />
        {mobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-45 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <main className={`flex-1 pr-4 pl-4 lg:pr-8 pt-24 pb-12 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-28' : 'lg:pl-72'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
