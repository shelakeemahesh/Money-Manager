import React, { useState, useEffect, useContext } from "react";
import { Users, Plus, Edit2, Trash2, Search, Calendar, DollarSign, Tag, MessageSquare, ArrowRight, X } from "lucide-react";
import AppContext from "../context/AppContext";
import { toast } from "sonner";
import { 
  getFriendExpenses, 
  createFriendExpense, 
  updateFriendExpense, 
  deleteFriendExpense, 
  getFriendStats 
} from "../services/friendService";
import Input from "../components/common/Input";

const categories = ["Food", "Drinks", "Travel", "Entertainment", "Shopping", "Gifts", "Others"];

const FriendSpends = () => {
  const { theme, t } = useContext(AppContext);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ totalSpent: 0, friendBreakdown: [], categoryBreakdown: {} });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [friendName, setFriendName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const expRes = await getFriendExpenses();
      const statsRes = await getFriendStats();
      setExpenses(expRes.data || []);
      setStats(statsRes.data || { totalSpent: 0, friendBreakdown: [], categoryBreakdown: {} });
    } catch (error) {
      toast.error("Failed to load friend expenditures data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setFriendName("");
    setAmount("");
    setCategory("Food");
    setDescription("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item.id);
    setFriendName(item.friendName);
    setAmount(item.amount);
    setCategory(item.category);
    setDescription(item.description || "");
    setExpenseDate(item.expenseDate);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this spend record?")) return;
    try {
      await deleteFriendExpense(id);
      toast.success("Spend record deleted successfully!");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!friendName.trim() || !amount || parseFloat(amount) <= 0 || !expenseDate) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    const payload = {
      friendName: friendName.trim(),
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      expenseDate
    };

    try {
      if (editId) {
        await updateFriendExpense(editId, payload);
        toast.success("Spend record updated successfully!");
      } else {
        await createFriendExpense(payload);
        toast.success("Spend record logged successfully!");
      }
      setShowForm(false);
      fetchExpenses();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save record");
    }
  };

  // Filtered list
  const filteredExpenses = expenses.filter(item => {
    const matchesSearch = item.friendName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--surface-3)]">
            <Users size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-[var(--text-primary)] leading-tight">
              Friend Spends Tracker
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Log expenditures on friends, manage outflows, and analyze friend budgets
            </p>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-brand py-2 px-3 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus size={14} />
          <span>Log Friend Spend</span>
        </button>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Spent */}
        <div className="rounded-md p-5 bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <DollarSign size={80} />
          </div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Total spent on friends</p>
          <p className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{stats.totalSpent?.toLocaleString() || "0"}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Cumulative friend transaction volume</p>
        </div>

        {/* Top Friend */}
        <div className="rounded-md p-5 bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Users size={80} />
          </div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Top spent friend</p>
          <p className="text-xl font-bold tracking-tight text-[var(--text-primary)] mt-1.5 truncate">
            {stats.friendBreakdown && stats.friendBreakdown.length > 0 
              ? stats.friendBreakdown[0].friendName 
              : "No Records"}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1">
            {stats.friendBreakdown && stats.friendBreakdown.length > 0 
              ? `Totaling ₹${stats.friendBreakdown[0].totalAmount?.toLocaleString()}` 
              : "Log spends to identify top friend"}
          </p>
        </div>

        {/* Categories Spanned */}
        <div className="rounded-md p-5 bg-[var(--surface)] border border-[var(--border)] relative overflow-hidden shadow-sm">
          <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <Tag size={80} />
          </div>
          <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Categories Spanned</p>
          <p className="text-2xl font-black tracking-tight text-[var(--text-primary)] mt-1">
            {stats.categoryBreakdown ? Object.keys(stats.categoryBreakdown).length : "0"}
          </p>
          <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">Unique payment channels used</p>
        </div>
      </div>

      {/* Main Grid: Spends List & Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Spends Ledger (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[var(--surface)] p-3 rounded-md border border-[var(--border)] shadow-xs">
            <div className="relative w-full md:w-64">
              <Search size={13} className="absolute left-2.5 top-3 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search friend or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-3)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            
            {/* Category Select Tabs */}
            <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {["All", ...categories.slice(0, 4), "Others"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-[var(--surface-3)] text-[var(--text-secondary)] hover:bg-[var(--border)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="text-xs font-bold text-[var(--text-primary)]">Transaction Ledger</h3>
            </div>
            
            {loading ? (
              <div className="p-10 text-center text-[var(--text-muted)] flex flex-col items-center justify-center gap-2">
                <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Fetching transactions...</span>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="p-12 text-center text-[var(--text-muted)]">
                <Users size={24} className="mx-auto text-[var(--text-muted)] opacity-30 mb-2" />
                <p className="text-xs font-semibold">No transactions logged</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Adjust filters or click "Log Friend Spend" to add a record</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--surface-3)] text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      <th className="py-2.5 px-4">Friend</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Notes</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4 text-right">Outflow</th>
                      <th className="py-2.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] text-xs">
                    {filteredExpenses.map((item) => (
                      <tr key={item.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                          {item.friendName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)] max-w-[150px] truncate">
                          {item.description || "—"}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {new Date(item.expenseDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                          ₹{item.amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1 rounded text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 rounded text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
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

        {/* Right Side: Analytical Breakdowns (2 columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Friends Spend Breakdown list */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] mb-4">Spending by Friend</h3>
            
            {stats.friendBreakdown && stats.friendBreakdown.length > 0 ? (
              <div className="space-y-3.5">
                {stats.friendBreakdown.map((item, idx) => {
                  const percent = stats.totalSpent > 0 ? (item.totalAmount / stats.totalSpent) * 100 : 0;
                  return (
                    <div key={item.friendName} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{item.friendName}</span>
                        <span className="font-bold text-[var(--text-secondary)]">
                          ₹{item.totalAmount?.toLocaleString()} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">No breakdowns available</p>
            )}
          </div>

          {/* Category Breakdown list */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md p-4 shadow-sm">
            <h3 className="text-xs font-bold text-[var(--text-primary)] mb-4">Spending by Category</h3>
            
            {stats.categoryBreakdown && Object.keys(stats.categoryBreakdown).length > 0 ? (
              <div className="space-y-3.5">
                {Object.entries(stats.categoryBreakdown).map(([cat, val]) => {
                  const percent = stats.totalSpent > 0 ? (val / stats.totalSpent) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--text-primary)]">{cat}</span>
                        <span className="font-bold text-[var(--text-secondary)]">
                          ₹{val?.toLocaleString()} ({percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface-3)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">No breakdowns available</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal Form Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[420px] bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg overflow-hidden relative"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                {editId ? "Edit Friend Spend Record" : "Log Friend Spend Record"}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Friend Name */}
              <Input
                label="Friend Name"
                type="text"
                placeholder="Enter friend's name..."
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                {/* Outflow Amount */}
                <Input
                  label="Outflow (₹)"
                  type="number"
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  required
                />

                {/* Category Dropdown */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--surface-3)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <Input
                label="Logged Date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />

              {/* Description/Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Description / Note
                </label>
                <textarea
                  placeholder="Dinner, cab fare share, gift contribution etc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-3)] border border-[var(--border)] rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 min-h-[60px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-3.5 py-2 rounded text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-semibold btn-brand flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{editId ? "Save Changes" : "Log Spend"}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FriendSpends;
