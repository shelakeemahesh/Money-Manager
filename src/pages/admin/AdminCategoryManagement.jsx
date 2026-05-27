import { useState, useEffect } from "react";
import { 
  Plus, Edit, Trash2, Tag, Loader2, Save, X, Globe, BarChart2,
  PieChart, Activity, AlertTriangle, Archive, RefreshCw, Layers
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell 
} from "recharts";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Input from "../../components/common/Input";

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

const AdminCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    id: null,
    name: "",
    type: "EXPENSE",
    icon: "📁",
    color: "#6366f1",
    globalTemplate: false
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setLoadingAnalytics(true);
    try {
      const [catRes, statsRes] = await Promise.all([
        axiosConfig.get(API_ENDPOINTS.ADMIN_CATEGORIES),
        axiosConfig.get(API_ENDPOINTS.ADMIN_CATEGORIES_ANALYTICS)
      ]);
      setCategories(catRes.data || []);
      
      const stats = statsRes.data || [];
      // Sort stats by amount descending for better chart rendering
      stats.sort((a, b) => b.amount - a.amount);
      setAnalytics(stats.slice(0, 10)); // Top 10 categories
    } catch (error) {
      console.error(error);
      toast.error("Failed to load category data");
    } finally {
      setLoading(false);
      setLoadingAnalytics(false);
    }
  };

  const openAddModal = () => {
    setCurrentCategory({
      id: null,
      name: "",
      type: "EXPENSE",
      icon: "📁",
      color: "#6366f1",
      globalTemplate: false
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setCurrentCategory({
      id: category.id,
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      globalTemplate: category.globalTemplate || false
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!currentCategory.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    
    setSubmitting(true);
    try {
      if (isEditing) {
        await axiosConfig.put(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${currentCategory.id}`, currentCategory);
        toast.success("Global category updated successfully");
      } else {
        await axiosConfig.post(API_ENDPOINTS.ADMIN_CATEGORIES, currentCategory);
        toast.success("Global category created successfully");
      }
      setShowModal(false);
      fetchData(); // Refresh data to get propagation effects and correct state
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await axiosConfig.delete(`${API_ENDPOINTS.ADMIN_CATEGORIES}/${deleteTarget.id}`);
      toast.success(response.data?.message || "Category deleted/archived successfully");
      setDeleteTarget(null);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  // Custom Tooltip for Bar Chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--surface-2)] border border-[var(--border)] p-3 rounded-lg shadow-xl">
          <p className="text-xs font-bold text-[var(--text-primary)] mb-2">{label}</p>
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Volume:</span>
            <span className="text-xs font-black text-[var(--text-primary)]">
              ₹{payload[0].value.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Count:</span>
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              {payload[0].payload.count} TXNs
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Taxonomy & Categories</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage global schemas, default templates, and usage analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="btn-secondary p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title="Reload Systems"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          <button 
            onClick={openAddModal}
            className="btn-brand p-2 rounded-[var(--radius-sm)] transition-colors cursor-pointer flex items-center gap-2 px-3"
          >
            <Plus size={14} />
            <span className="text-xs font-semibold">New Schema</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Grid: Categories */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" />
                <span>Global Schemas Configuration</span>
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center">Icon</th>
                    <th>Schema Details</th>
                    <th>Node Type</th>
                    <th>Propagation</th>
                    <th className="text-right">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-[var(--text-muted)]">
                        <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[var(--text-secondary)]" />
                        <span className="text-xs font-medium">Loading schemas...</span>
                      </td>
                    </tr>
                  ) : categories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center font-semibold text-xs text-[var(--text-muted)]">
                        No global categories initialized.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className={cat.archived ? "opacity-60 bg-gray-500/5" : ""}>
                        <td className="text-center">
                          <div 
                            className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm shadow-sm"
                            style={{ backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }}
                          >
                            {cat.icon}
                          </div>
                        </td>
                        <td>
                          <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
                            {cat.name}
                            {cat.archived && <Archive size={12} className="text-amber-500" title="Archived (In Use)" />}
                          </div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">#{cat.id}</div>
                        </td>
                        <td>
                          <span className={cat.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                            {cat.type === 'INCOME' ? 'Inflow' : 'Outflow'}
                          </span>
                        </td>
                        <td>
                          {cat.globalTemplate ? (
                            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-[4px] text-[10px] font-bold inline-flex items-center gap-1">
                              <Globe size={10} /> Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border)] rounded-[4px] text-[10px] font-medium">
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/5 border border-transparent hover:border-blue-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                              title="Edit Configuration"
                            >
                              <Edit size={13} />
                            </button>
                            <button 
                              onClick={() => setDeleteTarget(cat)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                              title="Archive/Delete Schema"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Side Panel: Analytics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card p-5 h-full flex flex-col">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
              <BarChart2 size={16} className="text-emerald-500" />
              <span>Platform Volumetrics (30D)</span>
            </h3>

            {loadingAnalytics ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] min-h-[300px]">
                <Loader2 size={24} className="animate-spin mb-3 text-[var(--text-secondary)]" />
                <span className="text-xs font-semibold">Computing metrics...</span>
              </div>
            ) : analytics.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] min-h-[300px]">
                <Activity size={32} className="mb-3 opacity-20" />
                <span className="text-xs font-semibold text-center max-w-[200px]">Insufficient aggregate data to generate visualization vectors.</span>
              </div>
            ) : (
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis 
                      dataKey="category" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                      dy={10}
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
                      tickFormatter={(value) => `₹${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
                    />
                    <RechartsTooltip cursor={{ fill: 'var(--surface-3)', opacity: 0.5 }} content={<CustomTooltip />} />
                    <Bar 
                      dataKey="amount" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                    >
                      {analytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-[10px] font-semibold text-[var(--text-muted)]">
              <span>Top 10 High-Volume Nodes</span>
              <span className="flex items-center gap-1"><AlertTriangle size={10} /> Auto-Calculated</span>
            </div>
          </div>
        </div>

      </div>

      {/* Category Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-6 border-b border-[var(--border)] pb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Tag size={16} className="text-blue-500" />
                <span>{isEditing ? "Modify Schema" : "Initialize Global Schema"}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  Classification Vector <span className="text-rose-500 font-bold">*</span>
                </label>
                <select
                  value={currentCategory.type}
                  onChange={(e) => setCurrentCategory({...currentCategory, type: e.target.value})}
                  className="input-styled w-full appearance-none py-2.5 pr-8 text-xs font-bold text-[var(--text-primary)]"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                    backgroundPosition: 'right 0.75rem center', 
                    backgroundSize: '1.25rem', 
                    backgroundRepeat: 'no-repeat' 
                  }}
                  disabled={isEditing}
                >
                  <option value="EXPENSE">Expense (Outflow)</option>
                  <option value="INCOME">Income (Inflow)</option>
                </select>
                {isEditing && <p className="text-[10px] text-[var(--text-muted)] mt-1.5 font-medium">Classification vectors cannot be mutated after initialization.</p>}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                  Schema Nomenclature <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="input-styled w-full py-2.5 text-xs font-semibold"
                  placeholder="e.g. Server Infrastructure"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                    Icon Glyph
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {currentCategory.icon}
                    </div>
                    <input
                      type="text"
                      value={currentCategory.icon}
                      onChange={(e) => setCurrentCategory({...currentCategory, icon: e.target.value})}
                      className="input-styled w-full py-2.5 text-xs"
                      maxLength={2}
                      placeholder="Emoji"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                    Hex Color
                  </label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-10 h-10 rounded-md border border-[var(--border)] shrink-0 shadow-sm"
                      style={{ backgroundColor: currentCategory.color }}
                    ></div>
                    <input
                      type="text"
                      value={currentCategory.color}
                      onChange={(e) => setCurrentCategory({...currentCategory, color: e.target.value})}
                      className="input-styled w-full py-2.5 text-xs font-mono uppercase"
                      placeholder="#000000"
                      maxLength={7}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-blue-500/50 transition-colors">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={currentCategory.globalTemplate}
                      onChange={(e) => setCurrentCategory({...currentCategory, globalTemplate: e.target.checked})}
                      className="w-4 h-4 text-blue-600 bg-[var(--surface)] border-[var(--border)] rounded focus:ring-blue-500 focus:ring-2 cursor-pointer accent-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">Force Global Propagation</span>
                    <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-1 font-medium">
                      If enabled, this schema will be automatically cloned and inserted into every existing and new user's personal registry. 
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 mt-2 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-brand px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span>{isEditing ? "Save Mutations" : "Initialize Schema"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Destructive Operation"
          message={`Are you sure you want to remove the global schema "${deleteTarget.name}"? If it is already bound to platform transactions, it will be soft-archived instead of hard-deleted to preserve ledger integrity.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel={deleting ? "Executing..." : "Confirm Removal"}
        />
      )}
    </div>
  );
};

export default AdminCategoryManagement;
