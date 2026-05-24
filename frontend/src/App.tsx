import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Expenses } from './pages/Expenses';
import { Investments } from './pages/Investments';
import { Goals } from './pages/Goals';
import { Budgets } from './pages/Budgets';
import { Wallets } from './pages/Wallets';
import { Subscriptions } from './pages/Subscriptions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Guard component to enforce authentication checks
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuthStore();
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
};

// Guard component for anonymous pages (login / sign up)
const AnonGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuthStore();
  if (accessToken) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public / Anonymous Routes */}
          <Route path="/login" element={<AnonGuard><Login /></AnonGuard>} />
          <Route path="/register" element={<AnonGuard><Register /></AnonGuard>} />

          {/* Protected Dashboard Routes */}
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/expenses" element={<AuthGuard><Expenses /></AuthGuard>} />
          <Route path="/investments" element={<AuthGuard><Investments /></AuthGuard>} />
          <Route path="/goals" element={<AuthGuard><Goals /></AuthGuard>} />
          <Route path="/budgets" element={<AuthGuard><Budgets /></AuthGuard>} />
          <Route path="/wallets" element={<AuthGuard><Wallets /></AuthGuard>} />
          <Route path="/subscriptions" element={<AuthGuard><Subscriptions /></AuthGuard>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
