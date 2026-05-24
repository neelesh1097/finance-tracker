import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  X, 
  RefreshCw,
  Clock,
  CirclePlay,
  RotateCcw,
  Check
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export const Subscriptions: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [detectedList, setDetectedList] = useState<any[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [showDetectPanel, setShowDetectPanel] = useState(false);

  // Form fields state
  const [merchantName, setMerchantName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [interval, setIntervalVal] = useState('monthly');
  const [lastPaymentDate, setLastPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextPaymentDate, setNextPaymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const categories = [
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other'
  ];

  // Query: Get subscriptions list
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/subscriptions');
      return data.data;
    },
  });

  // Mutation: Create subscription
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/subscriptions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  // Mutation: Delete subscription
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/subscriptions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      merchantName,
      amount: parseFloat(amount),
      category,
      interval,
      lastPaymentDate: new Date(lastPaymentDate).toISOString(),
      nextPaymentDate: new Date(nextPaymentDate).toISOString(),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to cancel tracking this subscription?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleScanHistory = async () => {
    setDetecting(true);
    setDetectedList([]);
    setShowDetectPanel(true);
    try {
      const { data } = await api.get('/subscriptions/detect');
      setDetectedList(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const handleQuickAdd = (detected: any) => {
    createMutation.mutate({
      merchantName: detected.merchantName,
      amount: detected.amount,
      category: detected.category,
      interval: detected.interval,
      lastPaymentDate: detected.lastPaymentDate,
      nextPaymentDate: detected.nextPaymentDate,
    });
    // Remove from local preview
    setDetectedList(prev => prev.filter(d => d.merchantName !== detected.merchantName));
  };

  const resetForm = () => {
    setMerchantName('');
    setAmount('');
    setCategory('Entertainment');
    setIntervalVal('monthly');
  };

  // Compute total monthly subscription costs
  const monthlyCostTotal = subscriptions
    .filter((s: any) => s.active)
    .reduce((total: number, sub: any) => {
      const val = Number(sub.amount);
      if (sub.interval === 'monthly') return total + val;
      if (sub.interval === 'weekly') return total + val * 4;
      if (sub.interval === 'yearly') return total + val / 12;
      return total + val;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Active Subscriptions</h1>
          <p className="text-slate-500 text-sm">Monitor software bills, recurring cycles, and automatically scan expenses for unknown subscriptions.</p>
        </div>
        <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleScanHistory}
            className="glass-panel text-primary border border-primary/20 hover:bg-primary/5 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all w-full sm:w-auto"
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Scan History</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Add Subscription</span>
          </button>
        </div>
      </div>

      {/* Analytics Info Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 flex flex-wrap justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <CirclePlay className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Monthly Subscription Budget</h3>
            <p className="text-xs text-slate-400">Total monthly charges for all active trackers.</p>
          </div>
        </div>
        <div>
          <p className="text-2xl font-black text-slate-850">₹{monthlyCostTotal.toFixed(2)} / month</p>
        </div>
      </div>

      {/* Suggested Subscriptions scanner drawer */}
      {showDetectPanel && (
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-primary/10 pb-2">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>AI Forgotten Subscriptions Scanner</span>
            </h3>
            <button onClick={() => setShowDetectPanel(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {detecting ? (
            <div className="text-center py-6 text-xs text-slate-500 animate-pulse flex flex-col items-center gap-1.5">
              <RefreshCw className="w-6 h-6 text-primary animate-spin" />
              <span>Scanning transaction intervals and periodic amounts...</span>
            </div>
          ) : detectedList.length === 0 ? (
            <p className="text-center py-6 text-xs text-slate-400 italic">No new recurring subscriptions detected in your recent logs.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detectedList.map((d, idx) => (
                <div key={idx} className="bg-white/80 p-4 rounded-xl border border-primary/10 flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-805 text-sm capitalize">{d.merchantName}</h4>
                    <p className="text-xs text-slate-400 font-semibold">
                      ₹{d.amount.toFixed(2)} / {d.interval}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Next bill: {format(new Date(d.nextPaymentDate), 'MMM dd')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleQuickAdd(d)}
                    className="bg-primary hover:bg-primary-dark text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Track</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Subscriptions List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Checking subscriptions registry...</div>
      ) : subscriptions.length === 0 ? (
        <div className="glass-panel py-20 text-center text-slate-450 flex flex-col items-center gap-3 border border-slate-200/50">
          <Calendar className="w-12 h-12 text-slate-350" />
          <p className="text-sm font-semibold">No active subscriptions configured.</p>
          <p className="text-xs text-slate-450">Click "Add Subscription" or scan your history to track Netflix, Spotify, or utility autopays.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub: any) => {
            const today = new Date();
            const daysLeft = differenceInDays(new Date(sub.nextPaymentDate), today);
            
            return (
              <div key={sub.id} className="glass-card p-5 border border-slate-200/50 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider capitalize">{sub.merchantName}</h3>
                    <span className="bg-primary/5 text-primary text-[8px] font-bold border border-primary/10 px-2 py-0.2 rounded-full uppercase block mt-1 w-fit">
                      {sub.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(sub.id)}
                    className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-between items-baseline border-b border-slate-100 pb-3">
                  <p className="text-2xl font-black text-slate-850">₹{Number(sub.amount).toFixed(2)}</p>
                  <span className="text-xs text-slate-400 font-semibold capitalize">/ {sub.interval}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Next Renewal</span>
                  </span>
                  <span className="font-bold text-slate-800">{format(new Date(sub.nextPaymentDate), 'MMM dd, yyyy')}</span>
                </div>

                {/* Days remaining badge */}
                <div className="pt-2 flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                  <span>Billing Alert</span>
                  {daysLeft <= 3 ? (
                    <span className="text-red-600 flex items-center gap-1 font-bold">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Due in {daysLeft} Days
                    </span>
                  ) : (
                    <span className="text-secondary-dark font-bold">
                      Due in {daysLeft} Days
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Subscription */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-805">Configure Subscription</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Provider Name</label>
                  <input
                    type="text"
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    placeholder="Netflix, Spotify"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Billing Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Billing Cycle</label>
                  <select
                    value={interval}
                    onChange={(e) => setIntervalVal(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="weekly">Weekly Cycle</option>
                    <option value="monthly">Monthly Cycle</option>
                    <option value="yearly">Yearly Cycle</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Last Payment Date</label>
                  <input
                    type="date"
                    value={lastPaymentDate}
                    onChange={(e) => setLastPaymentDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Next Payment Date</label>
                  <input
                    type="date"
                    value={nextPaymentDate}
                    onChange={(e) => setNextPaymentDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Save Tracker</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
