import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  User,
  AlertCircle
} from "lucide-react";
import AppContext from "../context/AppContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFriendTransactions,
  createFriendTransaction,
  updateFriendTransaction,
  deleteFriendTransaction,
  settleFriendTransaction,
  getFriendTransactionsSummary,
  getFriendDetailSummary
} from "../services/friendTransactionService";
import Input from "../components/common/Input";
import useSEO from "../utils/useSEO";

const FriendLedger = () => {
  const { theme, t, user } = useContext(AppContext);
  const navigate = useNavigate();

  useSEO({
    title: "Friend Ledger",
    description: "Manage lent and borrowed balances, keep track of debts, record settlements, and audit transaction histories with friends.",
    keywords: "friend ledger, splitwise, debt tracker, lend money, borrow money, peer to peer tracking"
  });

  // Lists & Summaries
  const [overallSummary, setOverallSummary] = useState({
    totalGiven: 0,
    totalTaken: 0,
    netBalance: 0,
    friendBalances: []
  });
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" or "logs"
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Filters for flat transaction logs
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // "ALL", "GIVEN", "TAKEN"
  const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL", "PENDING", "SETTLED"

  // Expanded friend name (holds the friend detail summary)
  const [expandedFriend, setExpandedFriend] = useState(null);
  const [friendDetail, setFriendDetail] = useState(null);
  const [friendDetailLoading, setFriendDetailLoading] = useState(false);

  // Form Modal state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [friendName, setFriendName] = useState("");
  const [type, setType] = useState("GIVEN"); // "GIVEN" or "TAKEN"
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await getFriendTransactionsSummary();
      if (res.data) {
        setOverallSummary(res.data);
      }
    } catch (error) {
      toast.error("Failed to load global friend ledger summaries");
    } finally {
      setSummaryLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType !== "ALL") params.type = filterType;
      if (filterStatus !== "ALL") params.status = filterStatus;
      if (searchQuery.trim() !== "") params.friendName = searchQuery;

      const res = await getFriendTransactions(params);
      setTransactions(res.data || []);
    } catch (error) {
      toast.error("Failed to load friend transaction logs");
    } finally {
      setLoading(false);
    }
  };

  const loadFriendDetail = async (name) => {
    setFriendDetailLoading(true);
    try {
      const res = await getFriendDetailSummary(name);
      setFriendDetail(res.data);
    } catch (error) {
      toast.error(`Failed to load details for ${name}`);
    } finally {
      setFriendDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterStatus, searchQuery]);

  const handleToggleFriend = async (name) => {
    if (expandedFriend === name) {
      setExpandedFriend(null);
      setFriendDetail(null);
    } else {
      setExpandedFriend(name);
      setFriendDetail(null);
      await loadFriendDetail(name);
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setFriendName("");
    setType("GIVEN");
    setAmount("");
    setDescription("");
    setTransactionDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setFriendName(item.friendName);
    setType(item.type);
    setAmount(item.amount.toString());
    setDescription(item.description || "");
    setTransactionDate(item.transactionDate);
    setDueDate(item.dueDate || "");
    setShowForm(true);
  };

  const handleDelete = async (id, fName = null) => {
    if (!window.confirm("Are you sure you want to delete this ledger record?")) return;
    try {
      await deleteFriendTransaction(id);
      toast.success("Ledger entry removed successfully!");
      fetchSummary();
      fetchTransactions();
      if (fName || expandedFriend) {
        loadFriendDetail(fName || expandedFriend);
      }
    } catch (error) {
      toast.error("Failed to delete ledger record");
    }
  };

  const handleSettle = async (id, fName = null) => {
    if (!window.confirm("Are you sure you want to mark this transaction as settled?")) return;
    try {
      await settleFriendTransaction(id);
      toast.success("Transaction successfully settled!");
      fetchSummary();
      fetchTransactions();
      if (fName || expandedFriend) {
        loadFriendDetail(fName || expandedFriend);
      }
    } catch (error) {
      toast.error("Failed to settle transaction");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!friendName.trim() || !amount || parseFloat(amount) <= 0 || !transactionDate) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    const payload = {
      friendName: friendName.trim(),
      type,
      amount: parseFloat(amount),
      description: description.trim() || null,
      transactionDate,
      dueDate: dueDate || null
    };

    try {
      if (editId) {
        await updateFriendTransaction(editId, payload);
        toast.success("Ledger entry updated successfully!");
      } else {
        await createFriendTransaction(payload);
        toast.success("Ledger entry added successfully!");
      }
      setShowForm(false);
      fetchSummary();
      fetchTransactions();
      if (expandedFriend) {
        loadFriendDetail(expandedFriend);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save ledger entry");
    }
  };

  // Avatar generator helper
  const getAvatarColor = (name) => {
    const colors = [
      "bg-red-500/10 text-red-500 border-red-500/20",
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      "bg-amber-500/10 text-amber-500 border-amber-500/20",
      "bg-purple-500/10 text-purple-500 border-purple-500/20",
      "bg-pink-500/10 text-pink-500 border-pink-500/20"
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--surface-3)]">
            <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              {t("friendsLedger")}
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Manage lent and borrowed balances, keep track of debts, and record settlements
            </p>
          </div>
        </div>
        {(user?.role === "PRO" || user?.role === "ADMIN") && (
          <button
            onClick={handleOpenAdd}
            className="btn-brand py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Transaction</span>
          </button>
        )}
      </div>

      <div className="relative">
        {/* Premium Blur Lock Overlay */}
        {!(user?.role === "PRO" || user?.role === "ADMIN") && (
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-md z-20 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center p-6 text-center animate-fade-in min-h-[450px]">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
              <Users size={22} className="animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Unlock Friend Ledger & Debt Management</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mt-1.5 mb-5 leading-relaxed font-medium">
              Track outstanding lent/borrowed balances, log repayments, settle friend debts, and manage transaction logs with CredoWallet Pro.
            </p>
            <button
              onClick={() => navigate("/pro-plan")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Upgrade to Pro
            </button>
          </div>
        )}

        {/* Global Outstanding Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Lent (Given) */}
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none text-emerald-500">
            <ArrowUpRight size={80} />
          </div>
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Lent (Outstanding)</p>
          <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{overallSummary.totalGiven?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Money you lent to friends that is pending repayment</p>
        </div>

        {/* Total Borrowed (Taken) */}
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none text-rose-500">
            <ArrowDownLeft size={80} />
          </div>
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Borrowed (Outstanding)</p>
          <p className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400 mt-1">
            ₹{overallSummary.totalTaken?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Money you borrowed from friends that is pending settlement</p>
        </div>

        {/* Net Balance */}
        <div className="rounded-xl p-5 bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <DollarSign size={80} />
          </div>
          <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Net Outstanding Balance</p>
          <p className={`text-2xl font-black tracking-tight mt-1 ${
            overallSummary.netBalance > 0 
              ? "text-emerald-600 dark:text-emerald-400" 
              : overallSummary.netBalance < 0 
                ? "text-rose-600 dark:text-rose-400" 
                : "text-[var(--text-secondary)]"
          }`}>
            {overallSummary.netBalance > 0 ? "+" : ""}
            ₹{overallSummary.netBalance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">
            {overallSummary.netBalance > 0 
              ? "Overall, friends owe you money" 
              : overallSummary.netBalance < 0 
                ? "Overall, you owe money to friends" 
                : "All outstanding balances are settled!"}
          </p>
        </div>
      </div>

      {/* Navigation Tabs (Overview vs Transaction Logs) */}
      <div className="flex gap-2 border-b border-[var(--border)] pb-0.5">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "overview"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Friend Overviews
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-2.5 px-4 text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === "logs"
              ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          All Transaction Logs
        </button>
      </div>

      {/* Main Sections */}
      <div>
        {activeTab === "overview" ? (
          /* SECTION 1: GROUPED FRIEND OVERVIEWS */
          <div className="space-y-4">
            {summaryLoading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-[var(--text-secondary)] font-medium">Computing summaries...</span>
              </div>
            ) : overallSummary.friendBalances.length === 0 ? (
              <div className="p-16 text-center border border-[var(--border)] rounded-xl bg-[var(--surface)]">
                <Users size={32} className="mx-auto text-[var(--text-muted)] opacity-30 mb-3" />
                <h3 className="text-xs font-bold text-[var(--text-primary)]">No ledger entries yet</h3>
                <p className="text-[10px] text-[var(--text-muted)] mt-1.5 max-w-xs mx-auto">
                  Click the "Add Transaction" button at the top to record your first lent or borrowed transaction.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {overallSummary.friendBalances.map((item) => {
                  const isExpanded = expandedFriend === item.friendName;
                  const initial = item.friendName.charAt(0).toUpperCase();
                  const avatarColor = getAvatarColor(item.friendName);

                  return (
                    <div
                      key={item.friendName}
                      className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)] transition-all duration-200"
                    >
                      {/* Friend Row Header */}
                      <div
                        onClick={() => handleToggleFriend(item.friendName)}
                        className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--surface-2)] transition-colors cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 ${avatarColor}`}>
                            {initial}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[var(--text-primary)] leading-none mb-1">
                              {item.friendName}
                            </h4>
                            <p className="text-[9px] text-[var(--text-muted)] leading-none">
                              {item.totalGiven > 0 ? `Lent: ₹${item.totalGiven.toLocaleString()} ` : ""}
                              {item.totalTaken > 0 ? `Borrowed: ₹${item.totalTaken.toLocaleString()}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold ${
                            item.netBalance > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : item.netBalance < 0
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-[var(--text-secondary)]"
                          }`}>
                            {item.netBalance > 0 ? "Owes You: " : item.netBalance < 0 ? "You Owe: " : ""}
                            ₹{Math.abs(item.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          {isExpanded ? <ChevronUp size={14} className="text-[var(--text-muted)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
                        </div>
                      </div>

                      {/* Expansion Body */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="border-t border-[var(--border)] bg-[var(--surface-2)] overflow-hidden"
                          >
                            <div className="p-4 space-y-4">
                              {friendDetailLoading ? (
                                <div className="p-6 text-center flex flex-col items-center justify-center gap-2">
                                  <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-[10px] text-[var(--text-muted)]">Loading histories...</span>
                                </div>
                              ) : friendDetail ? (
                                <div className="space-y-4">
                                  {/* Friend Metrics */}
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center">
                                      <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Lent</p>
                                      <p className="text-xs font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">
                                        ₹{friendDetail.totalGiven?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center">
                                      <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Total Borrowed</p>
                                      <p className="text-xs font-extrabold mt-1 text-rose-600 dark:text-rose-400">
                                        ₹{friendDetail.totalTaken?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-center">
                                      <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Net Outstanding</p>
                                      <p className={`text-xs font-extrabold mt-1 ${
                                        friendDetail.netBalance > 0
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : friendDetail.netBalance < 0
                                            ? "text-rose-600 dark:text-rose-400"
                                            : "text-[var(--text-secondary)]"
                                      }`}>
                                        ₹{Math.abs(friendDetail.netBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Transaction History Table */}
                                  <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--surface)] shadow-sm">
                                    <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-3)] flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-[var(--text-primary)]">Transaction Ledger</span>
                                      <span className="text-[8px] font-semibold text-[var(--text-muted)] uppercase">Total: {friendDetail.allTransactions?.length || 0} logs</span>
                                    </div>

                                    {friendDetail.allTransactions?.length === 0 ? (
                                      <div className="p-8 text-center text-[10px] text-[var(--text-muted)]">
                                        No history records registered
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                          <thead>
                                            <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                                              <th className="py-2 px-3">Date</th>
                                              <th className="py-2 px-3">Type</th>
                                              <th className="py-2 px-3">Amount</th>
                                              <th className="py-2 px-3">Status</th>
                                              <th className="py-2 px-3">Due Date</th>
                                              <th className="py-2 px-3">Description</th>
                                              <th className="py-2 px-3 text-right">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {friendDetail.allTransactions.map((tx) => (
                                              <tr key={tx.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors text-[10px]">
                                                <td className="py-2 px-3 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                                                  {tx.transactionDate}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                                                    tx.type === "GIVEN"
                                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                                  }`}>
                                                    {tx.type === "GIVEN" ? "LENT" : "BORROWED"}
                                                  </span>
                                                </td>
                                                <td className={`py-2 px-3 whitespace-nowrap font-bold ${
                                                  tx.type === "GIVEN" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                }`}>
                                                  ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap">
                                                  <span className={`flex items-center gap-1 font-semibold ${
                                                    tx.status === "PENDING" ? "text-amber-500" : "text-[var(--text-muted)]"
                                                  }`}>
                                                    {tx.status === "PENDING" ? (
                                                      <>
                                                        <Clock size={10} />
                                                        <span>Pending</span>
                                                      </>
                                                    ) : (
                                                      <>
                                                        <CheckCircle size={10} className="text-emerald-500" />
                                                        <span>Settled</span>
                                                      </>
                                                    )}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-3 whitespace-nowrap text-[var(--text-muted)]">
                                                  {tx.dueDate ? (
                                                    <span className="flex items-center gap-1">
                                                      <Calendar size={10} />
                                                      <span>{tx.dueDate}</span>
                                                    </span>
                                                  ) : (
                                                    "–"
                                                  )}
                                                </td>
                                                <td className="py-2 px-3 max-w-[150px] truncate text-[var(--text-secondary)]" title={tx.description}>
                                                  {tx.description || <span className="italic text-[var(--text-muted)]">None</span>}
                                                </td>
                                                <td className="py-2 px-3 text-right">
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    {tx.status === "PENDING" && (
                                                      <button
                                                        onClick={() => handleSettle(tx.id, item.friendName)}
                                                        className="px-1.5 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[8px] uppercase tracking-wide cursor-pointer"
                                                      >
                                                        Settle
                                                      </button>
                                                    )}
                                                    <button
                                                      onClick={() => handleOpenEdit(tx)}
                                                      className="p-1 text-[var(--text-secondary)] hover:text-indigo-500 hover:bg-[var(--surface-3)] rounded transition-colors cursor-pointer"
                                                    >
                                                      <Edit2 size={11} />
                                                    </button>
                                                    <button
                                                      onClick={() => handleDelete(tx.id, item.friendName)}
                                                      className="p-1 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--surface-3)] rounded transition-colors cursor-pointer"
                                                    >
                                                      <Trash2 size={11} />
                                                    </button>
                                                  </div>
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
                                <p className="text-[10px] text-center text-[var(--text-muted)]">Failed to render details.</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* SECTION 2: FLAT TRANSACTION LOGS TABLE */
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[var(--surface)] p-3 rounded-xl border border-[var(--border)] shadow-xs">
              {/* Fuzzy Search */}
              <div className="relative flex-1 max-w-sm">
                <Search size={13} className="absolute left-2.5 top-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search friend name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-3)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Type Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Type:</span>
                  <div className="flex bg-[var(--surface-3)] p-0.5 rounded-lg border border-[var(--border)]">
                    {["ALL", "GIVEN", "TAKEN"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilterType(t)}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                          filterType === t
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {t === "ALL" ? "All" : t === "GIVEN" ? "Lent" : "Borrowed"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Status:</span>
                  <div className="flex bg-[var(--surface-3)] p-0.5 rounded-lg border border-[var(--border)]">
                    {["ALL", "PENDING", "SETTLED"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                          filterStatus === s
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {s === "ALL" ? "All" : s === "PENDING" ? "Pending" : "Settled"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Flat List Table */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface)]">
                <h3 className="text-xs font-bold text-[var(--text-primary)]">Audit Trail Logs</h3>
                <span className="text-[10px] text-[var(--text-muted)] font-semibold">{transactions.length} records matching</span>
              </div>

              {loading ? (
                <div className="p-16 text-center flex flex-col items-center justify-center gap-3">
                  <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Fetching transaction history...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-16 text-center text-[var(--text-muted)]">
                  <AlertCircle size={32} className="mx-auto text-[var(--text-muted)] opacity-30 mb-2" />
                  <h3 className="text-xs font-bold text-[var(--text-primary)]">No matching transactions</h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--surface-3)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4">Friend</th>
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Amount</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Due Date</th>
                        <th className="py-2.5 px-4">Description</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors text-xs">
                          <td className="py-2.5 px-4 whitespace-nowrap text-[var(--text-secondary)] font-medium">
                            {tx.transactionDate}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap font-semibold text-[var(--text-primary)]">
                            {tx.friendName}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                              tx.type === "GIVEN"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            }`}>
                              {tx.type === "GIVEN" ? "LENT" : "BORROWED"}
                            </span>
                          </td>
                          <td className={`py-2.5 px-4 whitespace-nowrap font-bold ${
                            tx.type === "GIVEN" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}>
                            ₹{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap">
                            <span className={`flex items-center gap-1 font-semibold ${
                              tx.status === "PENDING" ? "text-amber-500" : "text-[var(--text-muted)]"
                            }`}>
                              {tx.status === "PENDING" ? (
                                <>
                                  <Clock size={11} />
                                  <span>Pending</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle size={11} className="text-emerald-500" />
                                  <span>Settled</span>
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap text-[var(--text-muted)]">
                            {tx.dueDate ? (
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                <span>{tx.dueDate}</span>
                              </span>
                            ) : (
                              "–"
                            )}
                          </td>
                          <td className="py-2.5 px-4 max-w-[200px] truncate text-[var(--text-secondary)]" title={tx.description}>
                            {tx.description || <span className="italic text-[var(--text-muted)]">None</span>}
                          </td>
                          <td className="py-2.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {tx.status === "PENDING" && (
                                <button
                                  onClick={() => handleSettle(tx.id)}
                                  className="px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wide cursor-pointer"
                                >
                                  Settle
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(tx)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-indigo-500 hover:bg-[var(--surface-3)] rounded transition-colors cursor-pointer"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(tx.id)}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-rose-500 hover:bg-[var(--surface-3)] rounded transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* POPUP FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--surface-3)]">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {editId ? "Edit Ledger Transaction" : "Log Ledger Transaction"}
                </h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md cursor-pointer hover:bg-[var(--border)]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Type selector toggle */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Transaction Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("GIVEN")}
                    className={`py-2 text-xs font-bold rounded-lg border uppercase tracking-wider cursor-pointer text-center ${
                      type === "GIVEN"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-[var(--surface-3)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)]"
                    }`}
                  >
                    I Lent (Given)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("TAKEN")}
                    className={`py-2 text-xs font-bold rounded-lg border uppercase tracking-wider cursor-pointer text-center ${
                      type === "TAKEN"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : "bg-[var(--surface-3)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--border)]"
                    }`}
                  >
                    I Borrowed (Taken)
                  </button>
                </div>
              </div>

              {/* Friend Name */}
              <Input
                label="Friend Name *"
                type="text"
                placeholder="Who is this friend?"
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                required
              />

              {/* Amount */}
              <Input
                label="Amount (₹) *"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Transaction Date *"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                />
                <Input
                  label="Due Date (Optional)"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Description / Note (Optional)
                </label>
                <textarea
                  placeholder="Add details, reason, or notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-styled w-full min-h-[60px] max-h-[120px] !pl-3.5 !py-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Actions Footer inside modal */}
              <div className="pt-2 flex justify-end gap-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3 py-2 border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-secondary)] hover:bg-[var(--border)] text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {editId ? "Update Entry" : "Save Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendLedger;
