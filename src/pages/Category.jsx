import { useContext, useState, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Search, Tag, LayoutGrid } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import AppContext from "../context/AppContext";
import { toast } from "sonner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import axiosConfig from "../utils/axiosConfig";
import Input from "../components/common/Input";
import SearchInput from "../components/common/SearchInput";

const Category = () => {
  const { categoryList, setCategoryList } = useContext(AppContext);

  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); // ALL, EXPENSE, INCOME

  const [form, setForm] = useState({
    name: "",
    type: "EXPENSE",
    icon: "🛒",
  });

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.GET_CATEGORY);
      setCategoryList(response.data);
    } catch {
      toast.error("Failed to fetch categories.");
    }
  };

  const ICONS = [
    "🛒", "🍔", "🚗", "🏠", "💊", "🎮", "✈️", "📱", "🎬", "⚡",
    "💰", "💼", "🏦", "📈", "🎁", "🥗", "🏋️", "📚", "💈", "🎨",
    "🐾", "💡", "🛡️", "🔧", "🍹", "👗", "🍿", "☕", "🧴"
  ];

  const openAdd = () => {
    setEditTarget(null);
    setForm({ name: "", type: "EXPENSE", icon: "🛒" });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({
      name: item.name,
      type: item.type,
      icon: item.icon || "🛒",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      if (editTarget) {
        const response = await axiosConfig.put(`${API_ENDPOINTS.GET_CATEGORY}/${editTarget.id}`, form);
        setCategoryList((prev) =>
          prev.map((c) => (c.id === editTarget.id ? response.data : c))
        );
        toast.success("Category updated.");
      } else {
        const response = await axiosConfig.post(API_ENDPOINTS.ADD_CATEGORY, form);
        setCategoryList((prev) => [...prev, response.data]);
        toast.success("Category added.");
      }
      setShowModal(false);
      setEditTarget(null);
    } catch {
      toast.error("Failed to save category.");
    }
  };

  const confirmDelete = async () => {
    try {
      await axiosConfig.delete(`${API_ENDPOINTS.GET_CATEGORY}/${deleteTarget.id}`);
      setCategoryList((prev) =>
        prev.filter((c) => c.id !== deleteTarget.id)
      );
      toast.success("Category deleted.");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete category.");
    }
  };

  // Filter & Search Logic
  const filteredCategories = categoryList.filter((cat) => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "ALL" || cat.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const expenseCategories = filteredCategories.filter(c => c.type === "EXPENSE");
  const incomeCategories = filteredCategories.filter(c => c.type === "INCOME" || c.type === "Income");

  // Grid animation variables
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.12 } }
  };

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <LayoutGrid size={15} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Category Hub
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Structure category labels and spending limits</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Search box */}
          <SearchInput
            placeholder="Search category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            wrapperClass="w-40"
            className="py-1.5"
          />

          {/* Add category trigger */}
          <button
            onClick={openAdd}
            className="btn-brand flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium shrink-0"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
        <div className="flex gap-0.5 p-1 rounded-md bg-[var(--surface-3)]">
          {[
            { id: "ALL", label: "All Nodes" },
            { id: "EXPENSE", label: "Outflows" },
            { id: "INCOME", label: "Inflows" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {filteredCategories.length} categories registered
        </span>
      </div>

      {/* Categories Content Grid */}
      {filteredCategories.length === 0 ? (
        <div className="card p-12 text-center shadow-sm">
          <div className="w-10 h-10 rounded-md flex items-center justify-center mx-auto mb-3 bg-[var(--surface-3)] border border-[var(--border)]">
            <Tag size={16} className="text-[var(--text-secondary)]" />
          </div>
          <h3 className="text-xs font-bold text-[var(--text-primary)]">No categories found</h3>
          <p className="text-[10px] mt-1 max-w-xs mx-auto text-[var(--text-muted)]">
            Try adjusting your search filters or create a new custom category classification.
          </p>
          <button
            onClick={openAdd}
            className="mt-4 btn-secondary px-3 py-1.5 text-xs"
          >
            Create Category Node
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* EXPENSES GROUP */}
            {(activeTab === "ALL" || activeTab === "EXPENSE") && (
              <div className="space-y-3">
                <h3 className="text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  Expense Allocations ({expenseCategories.length})
                </h3>

                {expenseCategories.length === 0 ? (
                  <p className="text-[11px] py-8 rounded-md text-center border border-dashed border-[var(--border)] text-[var(--text-muted)]">
                    No expense categories configured.
                  </p>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {expenseCategories.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        className="card p-3 flex items-center gap-3 group relative overflow-hidden"
                      >
                        <div className="w-8 h-8 rounded-md bg-[var(--expense-bg)] border border-[var(--expense)]/10 flex items-center justify-center text-lg shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-xs font-bold truncate leading-snug text-[var(--text-primary)]">{item.name}</p>
                          <span className="badge-expense mt-1 text-[9px] py-0 px-1.5">
                            Expense
                          </span>
                        </div>

                        {/* Slide-in Hover Action Buttons */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150 bg-[var(--surface)] pl-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1 text-[var(--text-secondary)] hover:text-blue-500 rounded-md hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 text-[var(--text-secondary)] hover:text-rose-500 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* INCOMES GROUP */}
            {(activeTab === "ALL" || activeTab === "INCOME") && (
              <div className="space-y-3">
                <h3 className="text-[9px] font-semibold uppercase tracking-widest flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Income Allocations ({incomeCategories.length})
                </h3>

                {incomeCategories.length === 0 ? (
                  <p className="text-[11px] py-8 rounded-md text-center border border-dashed border-[var(--border)] text-[var(--text-muted)]">
                    No income categories configured.
                  </p>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {incomeCategories.map((item) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        className="card p-3 flex items-center gap-3 group relative overflow-hidden"
                      >
                        <div className="w-8 h-8 rounded-md bg-[var(--income-bg)] border border-[var(--income)]/10 flex items-center justify-center text-lg shrink-0">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0 pr-8">
                          <p className="text-xs font-bold truncate leading-snug text-[var(--text-primary)]">{item.name}</p>
                          <span className="badge-income mt-1 text-[9px] py-0 px-1.5">
                            Income
                          </span>
                        </div>

                        {/* Hover Actions */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-150 bg-[var(--surface)] pl-2">
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1 text-[var(--text-secondary)] hover:text-blue-500 rounded-md hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 text-[var(--text-secondary)] hover:text-rose-500 rounded-md hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category Node"
        message="Are you sure you want to delete this category classification? Uncategorised transactions will fallback to general types."
        confirmLabel="Delete"
        confirmClass="bg-rose-600 hover:bg-rose-700"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Category Creation / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowModal(false); setEditTarget(null); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              className="relative w-full sm:max-w-md bg-[var(--surface)] rounded-t-lg sm:rounded-md shadow-lg p-5 overflow-hidden z-10 border border-[var(--border)] text-[var(--text-primary)]"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-4">
                <h2 className="text-sm font-bold">
                  {editTarget ? "Modify Category Node" : "Register Category Node"}
                </h2>
                <button
                  onClick={() => { setShowModal(false); setEditTarget(null); }}
                  className="p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-md transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Icon Selection */}
              <div className="mb-4">
                <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                  Select Icon / Emoji
                </label>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={`text-xl h-8 w-full rounded-md flex items-center justify-center transition-colors cursor-pointer border ${
                        form.icon === icon
                          ? "bg-[var(--brand)] border-[var(--brand)] text-[var(--surface)] font-bold shadow-sm"
                          : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--brand)]"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Category Title"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Shopping, Freelance"
                />

                {/* Type Selection */}
                <div>
                  <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
                    Allocation Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-[var(--surface-2)] p-1.5 border border-[var(--border)] rounded-md">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: "EXPENSE" }))}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        form.type === "EXPENSE"
                          ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Expense Node
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: "INCOME" }))}
                      className={`py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        form.type === "INCOME"
                          ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-xs"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      Income Node
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditTarget(null); }}
                  className="flex-1 py-2 text-xs font-semibold btn-secondary border-[var(--border)]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2 text-xs font-bold btn-brand"
                >
                  Save Category
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Category;