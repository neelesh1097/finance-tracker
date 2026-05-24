import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calculator,
  Coins,
  ArrowUpRight,
  X,
  RefreshCw,
  HelpCircle,
  PiggyBank,
  BadgeAlert
} from 'lucide-react';
import { format } from 'date-fns';

export const Investments: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'calculators'>('portfolio');
  const [calcSubTab, setCalcSubTab] = useState<'sip' | 'compound' | 'cagr' | 'simple'>('sip');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [amount, setAmount] = useState('');
  const [investmentType, setInvestmentType] = useState('Mutual_Funds');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentValue, setCurrentValue] = useState('');
  const [expectedValue, setExpectedValue] = useState('');

  // Calculator Inputs
  const [sipMonthly, setSipMonthly] = useState(5000);
  const [sipRate, setSipRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  const [ciPrincipal, setCiPrincipal] = useState(50000);
  const [ciRate, setCiRate] = useState(8);
  const [ciYears, setCiYears] = useState(5);
  const [ciCompounding, setCiCompounding] = useState(12); // monthly

  const [cagrStart, setCagrStart] = useState(10000);
  const [cagrEnd, setCagrEnd] = useState(25000);
  const [cagrYears, setCagrYears] = useState(5);

  const [siPrincipal, setSiPrincipal] = useState(50000);
  const [siRate, setSiRate] = useState(6);
  const [siYears, setSiYears] = useState(3);

  const assetTypes = [
    'Mutual_Funds', 'SIP', 'Stocks', 'Bonds', 'Fixed_Deposit', 'PPF', 'EPF', 'Crypto'
  ];

  // Query: Fetch Portfolio Summary
  const { data: portfolioRes, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: async () => {
      const { data } = await api.get('/investments/portfolio');
      return data.data;
    },
  });

  // Mutation: Create investment
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/investments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  // Mutation: Delete investment
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/investments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      amount: parseFloat(amount),
      investmentType,
      interestRate: parseFloat(interestRate),
      startDate: new Date(startDate).toISOString(),
      currentValue: parseFloat(currentValue),
      expectedValue: parseFloat(expectedValue),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setAmount('');
    setInterestRate('');
    setCurrentValue('');
    setExpectedValue('');
  };

  // ---------------------------------
  // Calculator Mathematical Results
  // ---------------------------------

  // 1. SIP calculator
  const calculateSIPResult = () => {
    const P = sipMonthly;
    const r = (sipRate / 100) / 12;
    const n = sipYears * 12;
    let futureValue = 0;
    if (r === 0) {
      futureValue = P * n;
    } else {
      futureValue = P * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    }
    const invested = P * n;
    const returns = futureValue - invested;
    return {
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(futureValue),
    };
  };

  // 2. Compound Interest
  const calculateCIResult = () => {
    const P = ciPrincipal;
    const r = ciRate / 100;
    const t = ciYears;
    const n = ciCompounding;
    const futureValue = P * Math.pow(1 + r / n, n * t);
    const returns = futureValue - P;
    return {
      invested: Math.round(P),
      returns: Math.round(returns),
      total: Math.round(futureValue),
    };
  };

  // 3. CAGR
  const calculateCAGRResult = () => {
    if (cagrStart <= 0 || cagrEnd <= 0 || cagrYears <= 0) return 0;
    const cagr = Math.pow(cagrEnd / cagrStart, 1 / cagrYears) - 1;
    return (cagr * 100).toFixed(2);
  };

  // 4. Simple Interest
  const calculateSIResult = () => {
    const P = siPrincipal;
    const r = siRate;
    const t = siYears;
    const interest = (P * r * t) / 100;
    return {
      invested: Math.round(P),
      returns: Math.round(interest),
      total: Math.round(P + interest),
    };
  };

  const summary = portfolioRes?.summary || {};
  const items = portfolioRes?.investments || [];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Investment Analytics</h1>
          <p className="text-slate-500 text-sm">Track stocks, index mutual funds, interest bonds, and run financial planning tools.</p>
        </div>
        <div className="flex gap-2.5">
          <div className="border border-slate-200 bg-white/70 p-1 rounded-xl flex gap-1">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'portfolio'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
                }`}
            >
              Assets Portfolio
            </button>
            <button
              onClick={() => setActiveTab('calculators')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'calculators'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
                }`}
            >
              Financial Calculators
            </button>
          </div>

          {activeTab === 'portfolio' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5" />
              <span>Add Asset</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'portfolio' ? (
        // ==========================================
        // PORTFOLIO TAB PANEL
        // ==========================================
        <div className="space-y-6">
          {/* KPI Mini-cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="glass-panel p-4 rounded-xl border border-slate-200/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Invested</span>
              <p className="text-xl font-black text-slate-850 mt-1">₹{summary.totalInvested?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Value</span>
              <p className="text-xl font-black text-slate-850 mt-1">₹{summary.totalCurrentValue?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Returns</span>
              <p className={`text-xl font-black mt-1 flex items-center gap-1 ${summary.totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{summary.totalReturns?.toFixed(2) || '0.00'}
                {summary.totalReturns >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-xl border border-slate-200/50">
              <span className="text-[10px] uppercase font-bold text-slate-400">Overall XIRR / CAGR</span>
              <p className="text-xl font-black text-primary mt-1">
                {(summary.overallXIRR || 0).toFixed(1)}% / {(summary.overallCAGR || 0).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Investments Table */}
          <div className="glass-panel rounded-2xl border border-slate-200/50 overflow-hidden">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400 animate-pulse">Retrieving portfolio metrics...</div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                <Coins className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-semibold">No assets listed yet.</p>
                <p className="text-xs text-slate-400">Click "Add Asset" to declare your stocks, FD, PPF, or mutual funds.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="px-6 py-4">Asset Name</th>
                      <th className="px-6 py-4">Allocation Type</th>
                      <th className="px-6 py-4">Interest Rate</th>
                      <th className="px-6 py-4 text-right">Invested Amt</th>
                      <th className="px-6 py-4 text-right">Current Value</th>
                      <th className="px-6 py-4 text-right">MoM Returns</th>
                      <th className="px-6 py-4 text-center">XIRR / CAGR</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {items.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 capitalize">
                          {inv.investmentType.replace('_', ' ')} Fund
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-primary/5 text-primary text-[10px] font-bold border border-primary/10 px-2.5 py-0.5 rounded-full uppercase">
                            {inv.investmentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-500">{inv.interestRate.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-600">₹{inv.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">₹{inv.currentValue.toFixed(2)}</td>
                        <td className={`px-6 py-4 text-right font-bold ${inv.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{inv.returns.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-700">
                          {(inv.xirr || 0).toFixed(1)}% / {(inv.cagr || 0).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        // ==========================================
        // CALCULATORS TAB PANEL
        // ==========================================
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sub menu */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 flex flex-col gap-2 h-fit">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">Calculator Select</h3>
            <button
              onClick={() => setCalcSubTab('sip')}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${calcSubTab === 'sip' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <PiggyBank className="w-4.5 h-4.5" />
              <span>SIP Monthly Projection</span>
            </button>
            <button
              onClick={() => setCalcSubTab('compound')}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${calcSubTab === 'compound' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Calculator className="w-4.5 h-4.5" />
              <span>Compound Interest</span>
            </button>
            <button
              onClick={() => setCalcSubTab('cagr')}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${calcSubTab === 'cagr' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <TrendingUp className="w-4.5 h-4.5" />
              <span>CAGR Calculator</span>
            </button>
            <button
              onClick={() => setCalcSubTab('simple')}
              className={`text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${calcSubTab === 'simple' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <Calculator className="w-4.5 h-4.5" />
              <span>Simple Interest</span>
            </button>
          </div>

          {/* Calculator Inputs & Outputs */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200/50 lg:col-span-2 space-y-6">
            {/* 1. SIP Calculator */}
            {calcSubTab === 'sip' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">SIP Monthly Contribution Projection</h3>
                  <p className="text-slate-500 text-xs">Simulate monthly contributions wealth builder.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Monthly Contribution (₹)</span>
                      <span>₹{sipMonthly}</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={100000}
                      step={500}
                      value={sipMonthly}
                      onChange={(e) => setSipMonthly(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Expected Return Rate (% p.a.)</span>
                      <span>{sipRate}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={30}
                      step={0.5}
                      value={sipRate}
                      onChange={(e) => setSipRate(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Investment Period (Years)</span>
                      <span>{sipYears} Years</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={sipYears}
                      onChange={(e) => setSipYears(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>
                </div>

                {/* Result Output */}
                {(() => {
                  const res = calculateSIPResult();
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Invested</span>
                        <p className="text-sm font-extrabold text-slate-700 mt-1">₹{res.invested.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Return Yield</span>
                        <p className="text-sm font-extrabold text-green-600 mt-1">₹{res.returns.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Maturity Value</span>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">₹{res.total.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 2. Compound Interest */}
            {calcSubTab === 'compound' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Compound Interest Simulator</h3>
                  <p className="text-slate-500 text-xs">Check yield compounding intervals.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Principal (₹)</label>
                      <input
                        type="number"
                        value={ciPrincipal}
                        onChange={(e) => setCiPrincipal(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Annual Interest Rate (%)</label>
                      <input
                        type="number"
                        value={ciRate}
                        onChange={(e) => setCiRate(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Period (Years)</label>
                      <input
                        type="number"
                        value={ciYears}
                        onChange={(e) => setCiYears(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Compounding Frequency</label>
                      <select
                        value={ciCompounding}
                        onChange={(e) => setCiCompounding(parseInt(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      >
                        <option value={1}>Yearly</option>
                        <option value={2}>Half-Yearly</option>
                        <option value={4}>Quarterly</option>
                        <option value={12}>Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Result Output */}
                {(() => {
                  const res = calculateCIResult();
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Principal</span>
                        <p className="text-sm font-extrabold text-slate-700 mt-1">₹{res.invested.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">CI Earned</span>
                        <p className="text-sm font-extrabold text-green-600 mt-1">₹{res.returns.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Compound Value</span>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">₹{res.total.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3. CAGR */}
            {calcSubTab === 'cagr' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Compound Annual Growth Rate</h3>
                  <p className="text-slate-500 text-xs">Evaluate investment performance speed.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Initial (₹)</label>
                      <input
                        type="number"
                        value={cagrStart}
                        onChange={(e) => setCagrStart(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Final (₹)</label>
                      <input
                        type="number"
                        value={cagrEnd}
                        onChange={(e) => setCagrEnd(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Years</label>
                      <input
                        type="number"
                        value={cagrYears}
                        onChange={(e) => setCagrYears(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Result Output */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Compound Annual Growth Rate (CAGR)</span>
                  <p className="text-2xl font-black text-primary mt-1">{calculateCAGRResult()}%</p>
                </div>
              </div>
            )}

            {/* 4. Simple Interest */}
            {calcSubTab === 'simple' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Simple Interest Calculator</h3>
                  <p className="text-slate-500 text-xs">Standard flat interest gains calculator.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Principal (₹)</label>
                      <input
                        type="number"
                        value={siPrincipal}
                        onChange={(e) => setSiPrincipal(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Rate (% p.a.)</label>
                      <input
                        type="number"
                        value={siRate}
                        onChange={(e) => setSiRate(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Period (Years)</label>
                      <input
                        type="number"
                        value={siYears}
                        onChange={(e) => setSiYears(parseFloat(e.target.value) || 0)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Result Output */}
                {(() => {
                  const res = calculateSIResult();
                  return (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Principal</span>
                        <p className="text-sm font-extrabold text-slate-700 mt-1">₹{res.invested.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Interest Gain</span>
                        <p className="text-sm font-extrabold text-green-600 mt-1">₹{res.returns.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Total Maturity Value</span>
                        <p className="text-sm font-extrabold text-slate-900 mt-1">₹{res.total.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Asset */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">Add Asset Record</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Invested Amount (₹)</label>
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Asset Type</label>
                  <select
                    value={investmentType}
                    onChange={(e) => setInvestmentType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {assetTypes.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Current Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Expected Value (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
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
                  <span>Save Asset</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Investments;
