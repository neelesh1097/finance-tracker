import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Plus, 
  UserPlus, 
  Wallet, 
  Check, 
  TrendingUp, 
  HelpCircle,
  X, 
  RefreshCw,
  Coins,
  Send,
  Users,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';

export const Wallets: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form Fields state
  const [newWalletName, setNewWalletName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  // Shared Expense state
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expCategory, setExpCategory] = useState('Groceries');
  const [expSplitMethod, setExpSplitMethod] = useState<'EQUAL' | 'PERCENTAGE' | 'CUSTOM'>('EQUAL');
  const [splitShares, setSplitShares] = useState<Record<string, string>>({}); // userId -> value input string

  // Preset state
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetSplitMethod, setPresetSplitMethod] = useState<'EQUAL' | 'PERCENTAGE' | 'CUSTOM'>('EQUAL');
  const [presetSplitShares, setPresetSplitShares] = useState<Record<string, string>>({});

  const categories = [
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other'
  ];

  // Query: Get user's wallets list
  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: async () => {
      const { data } = await api.get('/wallets');
      const list = data.data || [];
      if (list.length > 0 && !selectedWalletId) {
        setSelectedWalletId(list[0].id); // auto-select first wallet
      }
      return list;
    },
  });

  // Query: Get specific wallet details (balances & settlements)
  const { data: walletDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['walletDetails', selectedWalletId],
    queryFn: async () => {
      if (!selectedWalletId) return null;
      const { data } = await api.get(`/wallets/${selectedWalletId}/balances`);
      return data.data;
    },
    enabled: !!selectedWalletId,
  });

  // Mutation: Create wallet
  const createWalletMutation = useMutation({
    mutationFn: (name: string) => api.post('/wallets', { name }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setShowCreateModal(false);
      setNewWalletName('');
      if (res.data?.data?.id) {
        setSelectedWalletId(res.data.data.id);
      }
    },
  });

  // Mutation: Invite member
  const inviteMutation = useMutation({
    mutationFn: (data: any) => api.post(`/wallets/${selectedWalletId}/invite`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletDetails', selectedWalletId] });
      setShowInviteModal(false);
      setInviteEmail('');
    },
  });

  // Mutation: Add shared expense
  const addExpenseMutation = useMutation({
    mutationFn: (data: any) => api.post(`/wallets/${selectedWalletId}/expenses`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletDetails', selectedWalletId] });
      setShowExpenseModal(false);
      resetExpenseForm();
    },
  });

  // Mutation: Create Preset
  const createPresetMutation = useMutation({
    mutationFn: (data: any) => api.post(`/wallets/${selectedWalletId}/presets`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletDetails', selectedWalletId] });
      setShowPresetModal(false);
      resetPresetForm();
    },
  });

  // Mutation: Delete Preset
  const deletePresetMutation = useMutation({
    mutationFn: (presetId: string) => api.delete(`/wallets/${selectedWalletId}/presets/${presetId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletDetails', selectedWalletId] });
    },
  });

  const resetPresetForm = () => {
    setPresetName('');
    setPresetSplitMethod('EQUAL');
    setPresetSplitShares({});
  };

  const openPresetModal = () => {
    if (!walletDetails) return;
    const defaultShares: Record<string, string> = {};
    walletDetails.members.forEach((m: any) => {
      defaultShares[m.userId] = '0';
    });
    setPresetSplitShares(defaultShares);
    setShowPresetModal(true);
  };

  const handleCreatePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    const mappedShares: Record<string, number> = {};
    Object.entries(presetSplitShares).forEach(([uid, val]) => {
      mappedShares[uid] = parseFloat(val) || 0;
    });

    createPresetMutation.mutate({
      name: presetName,
      splitMethod: presetSplitMethod,
      shares: mappedShares,
    });
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) return;
    createWalletMutation.mutate(newWalletName);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map split shares back to numeric types
    const mappedDetails: Record<string, number> = {};
    Object.entries(splitShares).forEach(([uid, val]) => {
      mappedDetails[uid] = parseFloat(val) || 0;
    });

    addExpenseMutation.mutate({
      amount: parseFloat(expAmount),
      description: expDesc,
      category: expCategory,
      splitMethod: expSplitMethod,
      splitDetails: mappedDetails,
      date: new Date().toISOString(),
    });
  };

  const openExpenseModal = () => {
    if (!walletDetails) return;
    
    // Initialize split details depending on splitting method
    const defaultSplits: Record<string, string> = {};
    const count = walletDetails.members.length;
    const amountVal = parseFloat(expAmount) || 0;

    if (expSplitMethod === 'EQUAL') {
      walletDetails.members.forEach((m: any) => {
        defaultSplits[m.userId] = (amountVal / count).toFixed(2);
      });
    } else if (expSplitMethod === 'PERCENTAGE') {
      walletDetails.members.forEach((m: any) => {
        defaultSplits[m.userId] = (100 / count).toFixed(0);
      });
    } else {
      walletDetails.members.forEach((m: any) => {
        defaultSplits[m.userId] = '0';
      });
    }

    setSplitShares(defaultSplits);
    setShowExpenseModal(true);
  };

  const resetExpenseForm = () => {
    setExpAmount('');
    setExpDesc('');
    setSplitShares({});
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Shared Wallets</h1>
          <p className="text-slate-500 text-sm">Collaborative ledger splitting for roommates, friend groups, and families.</p>
        </div>
        <div className="flex gap-2.5">
          {wallets.length > 0 && (
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="border border-slate-200 bg-white/70 px-4 py-2.5 rounded-xl text-sm font-semibold focus:outline-none"
            >
              {wallets.map((w: any) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Create Wallet</span>
          </button>
        </div>
      </div>

      {walletsLoading ? (
        <div className="py-20 text-center text-slate-400 animate-pulse font-medium">Fetching active pools...</div>
      ) : wallets.length === 0 ? (
        <div className="glass-panel py-20 text-center text-slate-450 flex flex-col items-center gap-3 border border-slate-200/50">
          <Wallet className="w-12 h-12 text-slate-350" />
          <p className="text-sm font-semibold">No collaborative wallets created yet.</p>
          <p className="text-xs text-slate-450">Click "Create Wallet" to initiate split tracking ledger.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Balances & Member Invites */}
          <div className="space-y-6">
            {/* Balances Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Pool Members</span>
                </h3>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-primary hover:text-primary-dark font-semibold text-xs flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite</span>
                </button>
              </div>

              {detailsLoading ? (
                <div className="text-center py-6 text-xs text-slate-400 animate-pulse">Loading members...</div>
              ) : walletDetails?.members.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No members found.</div>
              ) : (
                <div className="space-y-3">
                  {walletDetails?.members.map((m: any) => (
                    <div key={m.userId} className="flex justify-between items-center text-sm p-1">
                      <div>
                        <p className="font-semibold text-slate-850">{m.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">{m.role.toLowerCase()}</p>
                      </div>
                      <span className={`font-bold ${m.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {m.balance >= 0 ? `+ ₹${m.balance.toFixed(2)}` : `- ₹${Math.abs(m.balance).toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Simplified settlements plan */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4.5 h-4.5 text-slate-500" />
                  <span>Simplified Settlements</span>
                </h3>
                <span className="bg-secondary/10 text-secondary-dark text-[9px] px-2 py-0.5 rounded-full font-bold">Optimization ON</span>
              </div>

              {detailsLoading ? (
                <div className="text-center py-6 text-xs text-slate-400 animate-pulse">Running simplify logic...</div>
              ) : !walletDetails?.settlements || walletDetails.settlements.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 italic">All debts resolved. Complete settlement achieved!</p>
              ) : (
                <div className="space-y-3">
                  {walletDetails.settlements.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/50">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="font-bold text-slate-700">{s.fromName}</span>
                        <span className="text-slate-400">pays</span>
                        <span className="font-bold text-slate-700">{s.toName}</span>
                      </div>
                      <span className="font-black text-slate-800">₹{s.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Split Presets Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Split Presets</span>
                </h3>
                <button
                  onClick={openPresetModal}
                  disabled={!walletDetails}
                  className="text-primary hover:text-primary-dark font-semibold text-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Preset</span>
                </button>
              </div>

              {detailsLoading ? (
                <div className="text-center py-6 text-xs text-slate-400 animate-pulse">Loading presets...</div>
              ) : !walletDetails?.presets || walletDetails.presets.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 italic">No saved split presets yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {walletDetails.presets.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 group">
                      <div>
                        <p className="font-bold text-slate-705">{p.name}</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                          {p.splitMethod.toLowerCase()} split
                        </p>
                      </div>
                      <button
                        onClick={() => deletePresetMutation.mutate(p.id)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete Preset"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Shared Ledger Transactions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-200/50 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4.5 h-4.5 text-slate-500" />
                  <span>Shared Cost Ledger</span>
                </h3>
                <button
                  onClick={openExpenseModal}
                  disabled={!walletDetails}
                  className="bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Split Bill</span>
                </button>
              </div>

              {detailsLoading ? (
                <div className="text-center py-20 text-xs text-slate-450 animate-pulse">Reading shared bills...</div>
              ) : !walletDetails?.expenses || walletDetails.expenses.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-xs italic">
                  No group split expenses logged yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1 space-y-3">
                  {walletDetails.expenses.map((exp: any) => (
                    <div key={exp.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{exp.description}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Paid by <span className="font-bold text-slate-500">{exp.paidBy.name}</span> on {format(new Date(exp.date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-800 text-sm">₹{exp.amount.toFixed(2)}</span>
                        <span className="bg-primary/5 text-primary text-[8px] font-bold block mt-0.5 border border-primary/10 px-1 py-0.2 rounded-full w-fit ml-auto">
                          {exp.splitMethod}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Wallet */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">Create Shared Wallet</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Wallet Group Name</label>
                <input
                  type="text"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="e.g. Friends Trip, Apartment Bills"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={createWalletMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {createWalletMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Create Group</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invite Member */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-800">Invite Member to Pool</h3>
              <button onClick={() => setShowInviteModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="friend@email.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Member Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="MEMBER">Member (Full splits access)</option>
                  <option value="VIEWER">Viewer (Read-only access)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {inviteMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Send Invite</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Shared Expense (Split Bill) */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-805">Log Shared Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              {walletDetails?.presets && walletDetails.presets.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Apply Saved Preset</label>
                  <select
                    onChange={(e) => {
                      const presetId = e.target.value;
                      if (!presetId) return;
                      const preset = walletDetails.presets.find((p: any) => p.id === presetId);
                      if (preset) {
                        setExpSplitMethod(preset.splitMethod);
                        const count = walletDetails.members.length;
                        const amountVal = parseFloat(expAmount) || 0;
                        const updatedShares: Record<string, string> = {};

                        if (preset.splitMethod === 'EQUAL') {
                          walletDetails.members.forEach((m: any) => {
                            updatedShares[m.userId] = (amountVal / count).toFixed(2);
                          });
                        } else if (preset.splitMethod === 'PERCENTAGE') {
                          walletDetails.members.forEach((m: any) => {
                            const pct = preset.shares[m.userId] || 0;
                            updatedShares[m.userId] = pct.toString();
                          });
                        } else {
                          walletDetails.members.forEach((m: any) => {
                            const customVal = preset.shares[m.userId] || 0;
                            updatedShares[m.userId] = customVal.toString();
                          });
                        }
                        setSplitShares(updatedShares);
                      }
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none bg-white font-medium text-slate-700"
                  >
                    <option value="">-- Do Not Apply Preset --</option>
                    {walletDetails.presets.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.splitMethod.toLowerCase()})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="e.g. Utility electricity, dinner"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Split Method Selection</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EQUAL', 'PERCENTAGE', 'CUSTOM'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setExpSplitMethod(method as any)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        expSplitMethod === method
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic split details fields per member */}
              <div className="space-y-2 max-h-40 overflow-y-auto border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Shares Details {expSplitMethod === 'PERCENTAGE' ? '(%)' : expSplitMethod === 'CUSTOM' ? '(₹)' : '(Auto equal split)'}
                </p>
                
                {walletDetails?.members.map((m: any) => (
                  <div key={m.userId} className="flex justify-between items-center text-xs py-1">
                    <span className="font-semibold text-slate-650">{m.name}</span>
                    <div className="flex items-center gap-2">
                      {expSplitMethod === 'PERCENTAGE' && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          (₹{((parseFloat(splitShares[m.userId]) || 0) / 100 * (parseFloat(expAmount) || 0)).toFixed(2)})
                        </span>
                      )}
                      <input
                        type="number"
                        disabled={expSplitMethod === 'EQUAL'}
                        value={splitShares[m.userId] || ''}
                        onChange={(e) => {
                          const updated = { ...splitShares };
                          updated[m.userId] = e.target.value;
                          setSplitShares(updated);
                        }}
                        className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={addExpenseMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {addExpenseMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Split Cost</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Split Preset */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-805">Create Split Preset</h3>
              <button onClick={() => setShowPresetModal(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePreset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Preset Name</label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="e.g. Rent 60-40, Dinner Equal"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Preset Split Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {['EQUAL', 'PERCENTAGE', 'CUSTOM'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPresetSplitMethod(method as any)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        presetSplitMethod === method
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic split details fields per member */}
              <div className="space-y-2 max-h-40 overflow-y-auto border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Shares Details {presetSplitMethod === 'PERCENTAGE' ? '(%)' : presetSplitMethod === 'CUSTOM' ? '(Weight/Value)' : '(Equal Split)'}
                </p>
                
                {walletDetails?.members.map((m: any) => (
                  <div key={m.userId} className="flex justify-between items-center text-xs py-1">
                    <span className="font-semibold text-slate-650">{m.name}</span>
                    <input
                      type="number"
                      disabled={presetSplitMethod === 'EQUAL'}
                      value={presetSplitShares[m.userId] || ''}
                      onChange={(e) => {
                        const updated = { ...presetSplitShares };
                        updated[m.userId] = e.target.value;
                        setPresetSplitShares(updated);
                      }}
                      className="w-20 text-right border border-slate-200 rounded-lg px-2 py-1 text-xs"
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={createPresetMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {createPresetMutation.isPending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>Save Preset</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallets;
