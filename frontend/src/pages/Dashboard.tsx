import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowDownRight, 
  ArrowUpRight, 
  IndianRupee, 
  Activity, 
  Percent, 
  TrendingUp, 
  ShieldCheck, 
  HelpCircle,
  AlertTriangle,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, updateMonthlyIncome } = useAuthStore();
  const [isEditingIncome, setIsEditingIncome] = React.useState(false);
  const [incomeVal, setIncomeVal] = React.useState('');

  React.useEffect(() => {
    if (user?.monthlyIncome) {
      setIncomeVal(user.monthlyIncome.toString());
    } else {
      setIncomeVal('50000');
    }
  }, [user]);

  const handleSaveIncome = async () => {
    const num = Number(incomeVal);
    if (isNaN(num) || num < 0) {
      alert('Please enter a valid monthly income');
      return;
    }
    try {
      await api.put('/auth/income', { monthlyIncome: num });
      updateMonthlyIncome(num);
      setIsEditingIncome(false);
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardForecast'] });
    } catch (err) {
      console.error('Failed to update income', err);
      alert('Error updating monthly income');
    }
  };

  // Query 1: Dashboard KPIs
  const { data: analyticsRes, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const { data } = await api.get('/analytics/dashboard');
      return data.data;
    },
  });

  // Query 2: Predictive Forecasts
  const { data: forecastRes, isLoading: forecastLoading } = useQuery({
    queryKey: ['dashboardForecast'],
    queryFn: async () => {
      const { data } = await api.get('/forecasts');
      return data.data;
    },
  });

  if (analyticsLoading || forecastLoading) {
    return <DashboardSkeleton />;
  }

  const kpis = analyticsRes?.kpis || {};
  const categoryTotals = analyticsRes?.categoryTotals || [];
  const monthlyTrend = analyticsRes?.monthlyTrend || [];
  const forecast = forecastRes || {};

  // Custom colors for Pie chart
  const COLORS = ['#2563EB', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#64748B'];

  const pieData = categoryTotals.map((c: any) => ({
    name: c.category,
    value: c.amount,
  })).filter((c: any) => c.value > 0);

  // Ratio comparison for Chart
  const ratioData = [
    {
      name: 'Comparison',
      Expenses: kpis.currentMonthExpenses || 0,
      Investments: kpis.totalInvested || 0,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Financial Hub</h1>
          <p className="text-slate-500 text-sm">Real-time assets growth, expense categories, and balance projections.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/70 border border-slate-200/50 px-4 py-2 rounded-xl glass-panel shadow-sm">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Health Index</span>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-800">{kpis.financialHealthScore || 0}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* KPI 1: Monthly Income */}
        <div className="glass-card p-5 border-l-4 border-l-teal-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Monthly Income</p>
              {isEditingIncome ? (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-lg font-bold text-slate-800">₹</span>
                  <input
                    type="number"
                    value={incomeVal}
                    onChange={(e) => setIncomeVal(e.target.value)}
                    className="w-24 px-2 py-0.5 text-sm border border-slate-350 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary font-bold text-slate-800"
                    autoFocus
                  />
                  <button onClick={handleSaveIncome} className="p-1 hover:bg-slate-100 rounded text-green-600">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => { setIsEditingIncome(false); if (user?.monthlyIncome) setIncomeVal(user.monthlyIncome.toString()); }} className="p-1 hover:bg-slate-100 rounded text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-2xl font-extrabold text-slate-800">₹{Number(user?.monthlyIncome || kpis.monthlyIncome || 50000).toFixed(2)}</h3>
                  <button
                    onClick={() => setIsEditingIncome(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                    title="Edit monthly income"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="w-10 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs">
            <span className="text-teal-600 font-bold">Configured setting</span>
          </div>
        </div>

        {/* KPI 2: Expense Metrics */}
        <div className="glass-card p-5 border-l-4 border-l-primary flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Expenses (This Month)</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{kpis.currentMonthExpenses?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs">
            {kpis.expenseGrowth >= 0 ? (
              <span className="text-red-600 flex items-center font-bold">
                <ArrowUpRight className="w-4 h-4" />
                {kpis.expenseGrowth.toFixed(1)}%
              </span>
            ) : (
              <span className="text-green-600 flex items-center font-bold">
                <ArrowDownRight className="w-4 h-4" />
                {Math.abs(kpis.expenseGrowth).toFixed(1)}%
              </span>
            )}
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>

        {/* KPI 3: Savings Metrics */}
        <div className="glass-card p-5 border-l-4 border-l-secondary flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Savings (This Month)</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{kpis.savingsAmount?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs">
            <span className="text-secondary-dark font-bold">{kpis.savingsRate?.toFixed(1) || '0'}%</span>
            <span className="text-slate-400">savings ratio</span>
          </div>
        </div>

        {/* KPI 4: Investment Portfolio */}
        <div className="glass-card p-5 border-l-4 border-l-accent flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Investments Value</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{kpis.totalCurrentValue?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <div>
              <span className="font-semibold text-slate-600">CAGR:</span> {(kpis.overallCAGR || 0).toFixed(1)}%
            </div>
            <div>
              <span className="font-semibold text-slate-600">XIRR:</span> {(kpis.overallXIRR || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* KPI 5: Income / Spend Ratio */}
        <div className="glass-card p-5 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Income / Spend Ratio</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{kpis.incomeToSpendRatio ? kpis.incomeToSpendRatio.toFixed(2) + 'x' : '0.00x'}</h3>
            </div>
            <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center text-sky-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-xs">
            <span className="text-sky-600 font-bold">{kpis.spendToIncomeRatio?.toFixed(1) || '0'}%</span>
            <span className="text-slate-400">spend to income ratio</span>
          </div>
        </div>

        {/* KPI 6: Month-End Forecast */}
        <div className="glass-card p-5 border-l-4 border-l-purple-500 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Predicted EOM Balance</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">₹{forecast.predictedBalance?.toFixed(2) || '0.00'}</h3>
            </div>
            <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs">
            {forecast.predictedOverspend > 0 ? (
              <span className="text-red-600 font-bold flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Overspending: ₹{forecast.predictedOverspend.toFixed(2)}
              </span>
            ) : (
              <span className="text-green-600 font-bold">Stable spending projected</span>
            )}
          </div>
        </div>
      </div>

      {/* Forecast Alerts Banner */}
      {forecast.alerts && forecast.alerts.length > 0 && (
        <div className="space-y-2">
          {forecast.alerts.map((alert: any, idx: number) => (
            <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 text-sm ${
              alert.type === 'DANGER' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 ${alert.type === 'DANGER' ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <p className="font-semibold">{alert.type === 'DANGER' ? 'Budget Overload Risk' : 'Financial Warning'}</p>
                <p className="text-xs mt-0.5 opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Trend Chart */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 border border-slate-200/50 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">6-Month Spending Trend</h3>
            <span className="text-xs text-slate-400">Total Spent per Month</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94A3B8' }} />
                <YAxis tickLine={false} axisLine={false} style={{ fontSize: '11px', fill: '#94A3B8' }} />
                <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Spent']} />
                <Area type="monotone" dataKey="expenses" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Categories Weight</h3>
            <span className="text-xs text-slate-400">Share %</span>
          </div>
          <div className="h-60 flex-1 relative">
            {pieData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                No expense entries logged this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] justify-center mt-2 max-h-16 overflow-y-auto">
            {pieData.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-500 font-medium">{entry.name} (₹{Number(entry.value).toFixed(2)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment vs Expense Ratio Chart and Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ratio Chart */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Asset Allocation vs Spend</h3>
            <span className="text-xs text-slate-400">Cumulative Ratio</span>
          </div>
          <div className="h-48 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ratioData} layout="vertical" barCategoryGap="20%">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend iconType="circle" />
                <Bar dataKey="Expenses" stackId="a" fill="#EF4444" radius={[10, 0, 0, 10]} />
                <Bar dataKey="Investments" stackId="a" fill="#14B8A6" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between text-xs font-semibold text-slate-500 px-4">
            <span className="text-red-600">Expenses: {kpis.expenseRatio?.toFixed(1) || '0'}%</span>
            <span className="text-secondary-dark">Investments: {kpis.investmentRatio?.toFixed(1) || '0'}%</span>
          </div>
        </div>

        {/* Predictive Spending Report Summary */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-slate-200/50 pb-2">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Predictive Spending Report</h3>
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">Regression-based</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Next Month Projection</span>
              <p className="text-2xl font-black text-slate-800">₹{forecast.predictedSpending?.toFixed(2) || '0.00'}</p>
              <p className="text-slate-400 text-xs">Estimated monthly expenses run-rate based on linear regression trends.</p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Expected Category Load</span>
              <div className="space-y-1.5">
                {forecast.categoryForecasts && Object.entries(forecast.categoryForecasts).slice(0, 3).map(([cat, amt]: any) => (
                  <div key={cat} className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">{cat}</span>
                    <span className="text-slate-700 font-bold">₹{amt.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 italic">
            This forecast is modeled using sliding moving averages of your historical expense data. For higher accuracy, import bank statements containing older logs.
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader UI to meet under 2 second visually loaded appearance
const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-72 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-2xl border border-slate-200/50"></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-slate-200 rounded-2xl lg:col-span-2"></div>
        <div className="h-80 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  );
};

export default Dashboard;
