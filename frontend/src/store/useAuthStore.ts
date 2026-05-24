import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER' | 'VIEWER';
  emailVerified: boolean;
  monthlyIncome: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  theme: 'light' | 'dark';
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setVerified: () => void;
  updateAccessToken: (token: string) => void;
  updateMonthlyIncome: (income: number) => void;
  clearAuth: () => void;
  toggleTheme: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Try to load initial auth from localStorage
  const storedUser = localStorage.getItem('user');
  const storedAccess = localStorage.getItem('accessToken');
  const storedRefresh = localStorage.getItem('refreshToken');
  const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    accessToken: storedAccess || null,
    refreshToken: storedRefresh || null,
    theme: storedTheme || 'light',
    
    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      set({ user, accessToken, refreshToken });
    },

    setVerified: () => {
      set((state) => {
        if (!state.user) return {};
        const updatedUser = { ...state.user, emailVerified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    },

    updateAccessToken: (accessToken) => {
      localStorage.setItem('accessToken', accessToken);
      set({ accessToken });
    },

    updateMonthlyIncome: (monthlyIncome) => {
      set((state) => {
        if (!state.user) return {};
        const updatedUser = { ...state.user, monthlyIncome };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return { user: updatedUser };
      });
    },

    clearAuth: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null, refreshToken: null });
    },

    toggleTheme: () => {
      set((state) => {
        const nextTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { theme: nextTheme };
      });
    },
  };
});
