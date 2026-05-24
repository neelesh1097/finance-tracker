import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Plus, 
  Trash2, 
  Target, 
  Calendar, 
  TrendingUp, 
  ShieldAlert, 
  X, 
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const Goals: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);

  // Form fields state
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [expectedAnnualReturn, setExpectedAnnualReturn] = useState('');
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Query: Get goals list with calculations
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const { data } = await api.get('/goals');
      return data.data;
    },
  });

  // Mutation: Create Goal
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  // Mutation: Delete Goal
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/goals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      goalName,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      monthlyContribution: parseFloat(monthlyContribution),
      expectedAnnualReturn: parseFloat(expectedAnnualReturn),
      targetDate: new Date(targetDate).toISOString(),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this financial goal?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setGoalName('');
    setTargetAmount('');
    setCurrentAmount('');
    setMonthlyContribution('');
    setExpectedAnnualReturn('');
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Goal Planner</h1>
          <p className="text-slate-500 text-sm">Create targeted financial goals and track projected timelines with compounding yield calculators.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          <span>New Goal</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse">Running projections simulations...</div>
      ) : goals.length === 0 ? (
        <div className="glass-panel py-20 text-center text-slate-450 flex flex-col items-center gap-3 border border-slate-200/50">
          <Target className="w-12 h-12 text-slate-300" />
          <p className="text-sm font-semibold">No goals configured yet.</p>
          <p className="text-xs text-slate-450">Click "New Goal" to schedule your house deposits, vacation, or emergency fund targets.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {goals.map((goal: any) => (
            <div key={goal.id} className="glass-panel p-6 rounded-2xl border border-slate-200/50 grid grid-cols-1 lg:grid-cols-3 gap-6 shadow-sm">
              {/* Left Column: Title and inputs */}
              <div className="space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-850 flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      <span>{goal.goalName}</span>
                    </h3>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-slate-500">
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider block">Target Value</span>
                      <span className="text-sm font-bold text-slate-800">₹{goal.targetAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 uppercase tracking-wider block">Target Date</span>
                      <span className="text-sm font-bold text-slate-800">{format(new Date(goal.targetDate), 'MMM yyyy')}</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Saved: ₹{goal.currentAmount.toLocaleString()}</span>
                    <span className="text-slate-800 font-bold">{goal.completionPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, goal.completionPercentage)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Simulation outputs */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-450" />
                      <span>Projected Term</span>
                    </span>
                    <span className="font-bold text-slate-800">{goal.projectedCompletionMonths} Months</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-slate-455" />
                      <span>Projected Date</span>
                    </span>
                    <span className="font-bold text-slate-800">{format(new Date(goal.projectedCompletionDate), 'MMM yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-secondary-dark" />
                      <span>Success Likelihood</span>
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                      goal.probability >= 80 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : goal.probability >= 50 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {goal.probability}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Trajectory simulation graph */}
              <div className="lg:col-span-2 space-y-2 flex flex-col justify-between">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Compounded Growth Curve (24-Mo Projection)</span>
                  <span className="text-[10px] text-slate-400 font-medium">Rate: {goal.expectedAnnualReturn}% p.a.</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={goal.trajectory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`colorGoal-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '9px', fill: '#94A3B8' }} />
                      <YAxis tickLine={false} axisLine={false} style={{ fontSize: '9px', fill: '#94A3B8' }} />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Area type="monotone" dataKey="amount" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill={`url(#colorGoal-${goal.id})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Goal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">Configure Savings Target</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Goal Name</label>
                <input
                  type="text"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="e.g. Electric Vehicle Fund"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Target Amount (₹)</label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Current Savings (₹)</label>
                  <input
                    type="number"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Monthly Savings (₹)</label>
                  <input
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Expected Return (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={expectedAnnualReturn}
                    onChange={(e) => setExpectedAnnualReturn(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
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
                  <span>Save Plan</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
