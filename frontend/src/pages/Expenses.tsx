import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  SlidersHorizontal, 
  UploadCloud, 
  FileCheck, 
  FileSpreadsheet, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';

export const Expenses: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  
  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);

  // Statement Upload state
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);

  // Form Fields state
  const [amount, setAmount] = useState('');
  const [expCategory, setExpCategory] = useState('Groceries');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [merchantName, setMerchantName] = useState('');
  const [recurring, setRecurring] = useState(false);

  const categories = [
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other', 'Needs_Review'
  ];

  // Query: Get expenses list
  const { data: expensesRes, isLoading, refetch } = useQuery({
    queryKey: ['expenses', page, search, category, minAmount, maxAmount],
    queryFn: async () => {
      const { data } = await api.get('/expenses', {
        params: {
          page,
          search: search || undefined,
          category: category || undefined,
          minAmount: minAmount || undefined,
          maxAmount: maxAmount || undefined,
          limit: 10,
        },
      });
      return data.data;
    },
  });

  // Mutation: Create expense
  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardForecast'] });
      closeFormModal();
    },
  });

  // Mutation: Update expense
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardForecast'] });
      closeFormModal();
    },
  });

  // Mutation: Delete expense
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardForecast'] });
    },
  });

  // Mutation: Confirm Statement Import
  const importMutation = useMutation({
    mutationFn: (data: any) => api.post('/expenses/confirm-import', { transactions: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardAnalytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardForecast'] });
      setShowUploadModal(false);
      setUploadPreview([]);
      setStatementFile(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      amount: parseFloat(amount),
      category: expCategory,
      description,
      date: new Date(date).toISOString(),
      paymentMethod,
      merchantName,
      recurring,
    };

    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (exp: any) => {
    setEditingExpense(exp);
    setAmount(exp.amount.toString());
    setExpCategory(exp.category);
    setDescription(exp.description || '');
    setDate(format(new Date(exp.date), 'yyyy-MM-dd'));
    setPaymentMethod(exp.paymentMethod);
    setMerchantName(exp.merchantName);
    setRecurring(exp.recurring);
    setShowFormModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteMutation.mutate(id);
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditingExpense(null);
    setAmount('');
    setDescription('');
    setMerchantName('');
    setRecurring(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatementFile(file);
    setUploadError('');
    setUploadProgress(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/expenses/upload-statement', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadPreview(data.data || []);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to parse the bank statement.');
    } finally {
      setUploadProgress(false);
    }
  };

  const executeImport = () => {
    if (uploadPreview.length === 0) return;
    importMutation.mutate(uploadPreview);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-sans">Expense Ledger</h1>
          <p className="text-slate-500 text-sm">Log transactions, analyze payments, and scan bank statements.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowUploadModal(true)}
            className="glass-panel text-slate-700 hover:text-slate-900 border border-slate-200/50 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all"
          >
            <UploadCloud className="w-5 h-5 text-slate-500" />
            <span>Import Statement</span>
          </button>
          
          <button
            onClick={() => setShowFormModal(true)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 w-full md:max-w-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search description, merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-200 bg-white/70 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min Amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-24 border border-slate-200 bg-white/70 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
          />
          
          <input
            type="number"
            placeholder="Max Amount"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-24 border border-slate-200 bg-white/70 px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
          />
        </div>
      </div>

      {/* Main Expense Table */}
      <div className="glass-panel rounded-2xl border border-slate-200/50 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 animate-pulse">Loading transaction records...</div>
        ) : !expensesRes || expensesRes.items.length === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
            <TrendingDown className="w-12 h-12 text-slate-300" />
            <p className="text-sm font-semibold">No expense records found.</p>
            <p className="text-xs text-slate-400">Click "Add Expense" or upload a bank statement to begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Merchant</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {expensesRes.items.map((exp: any) => (
                  <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {format(new Date(exp.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{exp.merchantName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        exp.category === 'Needs_Review'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-primary/5 text-primary border border-primary/10'
                      }`}>
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">{exp.paymentMethod}</td>
                    <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{exp.description || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">₹{Number(exp.amount).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="bg-slate-50/60 border-t border-slate-200/80 px-6 py-4 flex items-center justify-between text-xs text-slate-500">
              <span>Showing Page {expensesRes.pagination.page} of {expensesRes.pagination.pages || 1}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-slate-200 bg-white rounded-lg disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= expensesRes.pagination.pages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 border border-slate-200 bg-white rounded-lg disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 1: Add/Edit Form */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-lg text-slate-850">
                {editingExpense ? 'Modify Expense' : 'Log New Expense'}
              </h3>
              <button onClick={closeFormModal} className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    {categories.filter(c => c !== 'Needs_Review').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Merchant Name</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="e.g. Uber, Blinkit"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  placeholder="Additional note (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Autopay">Bank Autopay</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="rounded text-primary focus:ring-primary w-4.5 h-4.5 border-slate-350"
                />
                <label htmlFor="recurring" className="text-xs text-slate-600 font-semibold select-none">
                  Flag as monthly recurring subscription
                </label>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Save Record</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Drag and Drop Bank Statement Intelligence Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-xl border border-slate-100 animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 shrink-0">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-secondary-dark" />
                <h3 className="font-bold text-lg text-slate-800">
                  Bank Statement intelligence Ingestion
                </h3>
              </div>
              <button 
                onClick={() => { setShowUploadModal(false); setUploadPreview([]); setStatementFile(null); }} 
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Uploader Box */}
              {uploadPreview.length === 0 && (
                <div className="border-2 border-dashed border-slate-200/80 rounded-2xl p-10 text-center hover:border-primary/50 transition-colors relative">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-secondary/10 text-secondary-dark rounded-full flex items-center justify-center mx-auto">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-slate-600">
                      <p className="text-sm font-semibold">Drag & Drop statement file here</p>
                      <p className="text-xs text-slate-400 mt-1">Supports CSV, XLSX, XLS bank worksheets</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Loader */}
              {uploadProgress && (
                <div className="py-12 text-center text-slate-500 animate-pulse flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-secondary-dark animate-spin" />
                  <p className="text-sm font-semibold">Running intelligence rules engine...</p>
                </div>
              )}

              {/* Error */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-2 text-xs font-semibold">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Preview Table */}
              {uploadPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-secondary/5 border border-secondary/15 p-3 rounded-xl text-xs text-secondary-dark font-medium">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4" />
                      <span>Found {uploadPreview.length} items. Preview parsed transactions.</span>
                    </div>
                    <span className="font-bold">{statementFile?.name}</span>
                  </div>

                  <div className="border border-slate-200/60 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-[9px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Narration Description</th>
                          <th className="px-4 py-3 text-right">Debit (₹)</th>
                          <th className="px-4 py-3 text-right">Credit (₹)</th>
                          <th className="px-4 py-3">Auto Category</th>
                          <th className="px-4 py-3 text-center">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600">
                        {uploadPreview.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 whitespace-nowrap">
                              {format(new Date(tx.date), 'MMM dd, yyyy')}
                            </td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800 max-w-xs truncate">{tx.description}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-red-600">
                              {tx.debit > 0 ? `₹${tx.debit.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-green-600">
                              {tx.credit > 0 ? `₹${tx.credit.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-2.5">
                              <select
                                value={tx.category}
                                onChange={(e) => {
                                  const updated = [...uploadPreview];
                                  updated[idx].category = e.target.value;
                                  setUploadPreview(updated);
                                }}
                                className="border border-slate-200 bg-white/70 px-2 py-1 rounded-lg text-xs"
                              >
                                {categories.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                tx.confidence >= 0.8
                                  ? 'bg-green-50 text-green-700'
                                  : tx.confidence >= 0.5
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-red-50 text-red-700'
                              }`}>
                                {Math.round(tx.confidence * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            {uploadPreview.length > 0 && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => { setUploadPreview([]); setStatementFile(null); }}
                  className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-xl"
                >
                  Clear File
                </button>
                <button
                  onClick={executeImport}
                  disabled={importMutation.isPending}
                  className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {importMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Confirm Import</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
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

export default Expenses;
