import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Gauge
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const Budgets: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);

  // Form Fields state
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetCategory, setBudgetCategory] = useState('Groceries');
  const [budgetType, setBudgetType] = useState('MONTHLY');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const categories = [
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other'
  ];

  // Query: Get budgets with utilization details
  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data } = await api.get('/budgets');
      return data.data;
    },
  });

  // Mutation: Create budget
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  // Mutation: Delete budget
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      budgetAmount: parseFloat(budgetAmount),
      budgetCategory,
      budgetType,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget limit?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setBudgetAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Budgets Planner</h1>
          <p className="text-slate-500 text-sm">Configure category caps, check limits utilization, and receive warnings.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          <span>Set Limit</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Checking budget spends...</div>
      ) : budgets.length === 0 ? (
        <div className="glass-panel py-20 text-center text-slate-450 flex flex-col items-center gap-3 border border-slate-200/50">
          <Gauge className="w-12 h-12 text-slate-300" />
          <p className="text-sm font-semibold">No budget limits configured yet.</p>
          <p className="text-xs text-slate-450">Click "Set Limit" to track category caps (like Groceries or Shopping).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b: any) => {
            const isOverspent = b.utilization >= 100;
            const isWarning = b.utilization >= 90 && b.utilization < 100;
            const isCaution = b.utilization >= 75 && b.utilization < 90;

            let colorTheme = 'bg-primary';
            let borderTheme = 'border-slate-200';
            if (isOverspent) {
              colorTheme = 'bg-red-500';
              borderTheme = 'border-red-200';
            } else if (isWarning) {
              colorTheme = 'bg-amber-500';
              borderTheme = 'border-amber-200';
            } else if (isCaution) {
              colorTheme = 'bg-yellow-500';
              borderTheme = 'border-yellow-250';
            }

            return (
              <div key={b.id} className={`glass-card p-5 border flex flex-col justify-between space-y-4 shadow-sm ${borderTheme}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">{b.budgetCategory} Limit</h3>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                    <span className="capitalize">{b.budgetType.toLowerCase()} cycle:</span>
                    <span>{format(new Date(b.startDate), 'MMM dd')} - {format(new Date(b.endDate), 'MMM dd')}</span>
                  </div>
                </div>

                {/* Utilization Progress */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colorTheme} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min(100, b.utilization)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">₹{b.spent.toFixed(2)} spent</span>
                    <span className="text-slate-800">₹{b.budgetAmount.toFixed(2)} limit</span>
                  </div>
                </div>

                {/* Status Alert Banner */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{b.utilization.toFixed(0)}% Utilized</span>
                  {isOverspent ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4.5 h-4.5" />
                      Over Limit
                    </span>
                  ) : isWarning ? (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-4.5 h-4.5" />
                      Near Limit
                    </span>
                  ) : (
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                      Within Limit
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Set Limit */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-805">Configure Budget Cap</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Limit Amount (₹)</label>
                  <input
                    type="number"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={budgetCategory}
                    onChange={(e) => setBudgetCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cycle Frequency</label>
                  <select
                    value={budgetType}
                    onChange={(e) => setBudgetType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="DAILY">Daily Cycle</option>
                    <option value="WEEKLY">Weekly Cycle</option>
                    <option value="MONTHLY">Monthly Cycle</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Save Limit</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budgets;
