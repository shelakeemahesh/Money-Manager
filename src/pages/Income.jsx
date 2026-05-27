import { useContext, useState, useEffect } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Plus, Trash2, Download, X, TrendingUp, AlertTriangle, Pencil } from "lucide-react";
import AppContext from "../context/AppContext";
import { toast } from "sonner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import * as XLSX from "xlsx";
import { API_ENDPOINTS } from "../utils/apiEndpoints";
import axiosConfig from "../utils/axiosConfig";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const Income = () => {
    const { incomeList, setIncomeList, categoryList, addAnomaly } = useContext(AppContext);
    const [showModal, setShowModal] = useState(false);
    const [confirmStep, setConfirmStep] = useState(false);
    const [pendingEntry, setPendingEntry] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [editTarget, setEditTarget] = useState(null);
    const [form, setForm] = useState({ category: "", amount: "", date: "", icon: "💰" });

    const ICONS = ["💰", "💼", "🏦", "🎓", "🏠", "📈", "🎵", "🛠️", "🌐", "🎁"];
    const incomeCategories = categoryList.filter(c => c.type === "INCOME" || c.type === "Income");
    const fallbackCategories = ["Salary", "Freelance", "Investments", "Rent", "Grants", "Gifts", "Other"];

    useEffect(() => {
        fetchIncome();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchIncome = async () => {
        try {
            const response = await axiosConfig.get(API_ENDPOINTS.GET_INCOME);
            setIncomeList(response.data);
        } catch {
            toast.error("Failed to load income data");
        }
    };

    const isAnomalous = (amount) => {
        if (incomeList.length === 0) return amount > 100000;
        const avg = incomeList.reduce((s, i) => s + i.amount, 0) / incomeList.length;
        return amount > Math.max(100000, avg * 3);
    };

    const openAdd = () => {
        setEditTarget(null);
        setForm({ category: "", amount: "", date: "", icon: "💰" });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditTarget(item);
        setForm({ category: item.category || item.source || "", amount: String(item.amount), date: item.date, icon: item.icon || "💰" });
        setConfirmStep(false);
        setShowModal(true);
    };

    const commitAdd = async (entryReq) => {
        try {
            const response = await axiosConfig.post(API_ENDPOINTS.ADD_INCOME, entryReq);
            setIncomeList((prev) => [response.data, ...prev]);
            toast.success("Income registered successfully!");
            setForm({ category: "", amount: "", date: "", icon: "💰" });
            setShowModal(false);
            setConfirmStep(false);
            setPendingEntry(null);
        } catch {
            toast.error("Failed to add income");
        }
    };

    const commitEdit = async () => {
        if (!form.category.trim() || !form.amount || !form.date) {
            toast.error("Please fill all required fields.");
            return;
        }

        const entryReq = {
            source: form.category,
            amount: parseFloat(form.amount),
            date: form.date,
            category: form.category,
            icon: form.icon
        };

        try {
            const response = await axiosConfig.put(`${API_ENDPOINTS.GET_INCOME}/${editTarget.id}`, entryReq);
            setIncomeList((prev) =>
                prev.map((i) => (i.id === editTarget.id ? response.data : i))
            );
            toast.success("Income updated successfully!");
            setShowModal(false);
            setEditTarget(null);
        } catch {
            toast.error("Failed to update income");
        }
    };

    const handleAdd = () => {
        if (!form.category.trim() || !form.amount || !form.date) {
            toast.error("Please fill all required fields.");
            return;
        }

        const amt = parseFloat(form.amount);
        const entryReq = {
            source: form.category,
            amount: amt,
            date: form.date,
            category: form.category,
            icon: form.icon
        };

        if (isAnomalous(amt)) {
            setPendingEntry(entryReq);
            setConfirmStep(true);
        } else {
            commitAdd(entryReq);
        }
    };

    const handleConfirmAnomaly = () => {
        if (pendingEntry) {
            addAnomaly("income", `High inflow: ${pendingEntry.category} (${formatCurrency(pendingEntry.amount)})`);
            commitAdd(pendingEntry);
        }
    };

    const handleCancelAnomaly = () => {
        setConfirmStep(false);
    };

    const handleDelete = (item) => {
        setDeleteTarget(item);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axiosConfig.delete(`${API_ENDPOINTS.GET_INCOME}/${deleteTarget.id}`);
            setIncomeList((prev) => prev.filter((i) => i.id !== deleteTarget.id));
            toast.success("Income deleted successfully");
            setDeleteTarget(null);
        } catch {
            toast.error("Failed to delete income");
        }
    };

    const downloadExcel = () => {
        if (incomeList.length === 0) {
            toast.error("No income records to export.");
            return;
        }
        const wb = XLSX.utils.book_new();
        const rows = incomeList.map((item, index) => ({
            "S.No": index + 1,
            "Source": item.source,
            "Category": item.category || "-",
            "Amount (INR)": item.amount,
            "Date": item.date || "-",
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws, "Income");
        XLSX.writeFile(wb, "income_details.xlsx");
        toast.success("Income report downloaded!");
    };

    // Prepare chart data (reverse to chronological)
    const chartData = [...incomeList]
        .reverse()
        .map((item) => ({
            date: formatDate(item.date),
            income: item.amount,
        }));

    // Recharts ticks mapping
    const maxVal = chartData.reduce((max, d) => (d.income > max ? d.income : max), 0);
    const niceMax = maxVal > 0 ? Math.ceil(maxVal / 10000) * 10000 : 10000;
    const incomeTicks = [0, Math.round(niceMax / 2), niceMax];

    return (
        <div className="space-y-5 pb-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[var(--income-bg)] border border-[var(--income)]/10 flex items-center justify-center text-[var(--income)] shrink-0">
                        <TrendingUp size={15} />
                    </div>
                    <div>
                        <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">
                            Inflow Center
                        </h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Monitor and classify cash inflows</p>
                    </div>
                </div>
                <button
                    onClick={openAdd}
                    className="btn-brand flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium self-start sm:self-center"
                >
                    <Plus size={14} />
                    <span>Record Income</span>
                </button>
            </div>

            {/* Chart */}
            <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Inflow Trend</h2>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Deposits and earnings over time</p>
                    </div>
                    <span className="badge-income">
                        {incomeList.length} entry nodes
                    </span>
                </div>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                            <YAxis
                                tick={{ fontSize: 8, fill: "var(--text-muted)" }}
                                tickFormatter={(v) => v.toLocaleString("en-IN")}
                                ticks={incomeTicks}
                                domain={[0, niceMax]}
                                width={45}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "6px", fontSize: 11 }} />
                            <Area type="monotone" dataKey="income" stroke="var(--income)" fillOpacity={0.03} fill="var(--income)" strokeWidth={2} name="Income" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Income Sources List */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div>
                        <h2 className="font-semibold text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Income Nodes</h2>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">All registered cash inflows</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={downloadExcel} className="flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer text-[var(--text-primary)]">
                            <Download size={12} />
                            <span>Export Sheets</span>
                        </button>
                    </div>
                </div>

                {incomeList.length === 0 ? (
                    <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                        No inflow transactions registered yet.
                    </div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {incomeList.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--surface-2)] transition-colors group">
                                <div className="w-8 h-8 rounded-md bg-[var(--income-bg)] border border-[var(--income)]/10 flex items-center justify-center text-sm shrink-0">
                                    {item.icon || "💰"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate text-[var(--text-primary)]">{item.category || item.source}</p>
                                    <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{formatDate(item.date)}</p>
                                </div>
                                <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-xs font-bold text-emerald-500">+{formatCurrency(item.amount)}</span>
                                    <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEdit(item)} className="p-1 rounded-md text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer">
                                            <Pencil size={12} />
                                        </button>
                                        <button onClick={() => handleDelete(item)} className="p-1 rounded-md text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Income Node"
                message="Are you sure you want to delete this income transaction?"
                confirmLabel="Delete"
                confirmClass="bg-rose-600 hover:bg-rose-700"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Income Modals */}
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
                            {confirmStep ? (
                                <div className="text-center py-1">
                                    <div className="w-10 h-10 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                                        <AlertTriangle size={18} className="text-amber-500" />
                                    </div>
                                    <h2 className="text-sm font-bold mb-1">Large Transaction Alert</h2>
                                    <p className="text-xs text-[var(--text-secondary)] mb-4">You are registering an unusually high inflow node:</p>
                                    <p className="text-xl font-bold text-amber-500 mb-1">{formatCurrency(pendingEntry?.amount)}</p>
                                    <p className="text-[10px] mb-4 text-[var(--text-muted)]">Category: <span className="font-semibold text-[var(--text-primary)]">"{pendingEntry?.category || pendingEntry?.source}"</span></p>
                                    <p className="text-xs p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-amber-600 dark:text-amber-400 mb-5">
                                        This deposit deviates significantly from your historical average. Please verify if correct.
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={handleCancelAnomaly} className="flex-1 py-2 text-xs font-semibold btn-secondary">
                                            Modify details
                                        </button>
                                        <button onClick={handleConfirmAnomaly} className="flex-1 py-2 text-xs font-bold btn-brand bg-amber-500 border-amber-500 hover:bg-amber-600">
                                            Confirm & Register
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)] mb-4">
                                        <h2 className="text-sm font-bold">{editTarget ? "Modify Income Node" : "Register Income Node"}</h2>
                                        <button onClick={() => { setShowModal(false); setEditTarget(null); }} className="p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-3)] rounded-md cursor-pointer">
                                            <X size={15} />
                                        </button>
                                    </div>
                                    
                                    <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Select Icon</label>
                                    <div className="flex flex-wrap gap-2 mb-4 bg-[var(--surface-2)] p-2 rounded-md border border-[var(--border)]">
                                        {ICONS.map((icon) => (
                                            <button key={icon} onClick={() => setForm((f) => ({ ...f, icon }))}
                                                className={`text-lg w-8 h-8 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${form.icon === icon ? "border-[var(--income)] bg-[var(--income-bg)]" : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--brand)]"}`}>
                                                {icon}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3.5">
                                        <div>
                                            <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Classification Category *</label>
                                            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                                                className="input-styled appearance-none"
                                                style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                                            >
                                                <option value="">Choose Label</option>
                                                {incomeCategories.length > 0
                                                    ? incomeCategories.map((cat) => <option key={cat.id} value={cat.name}>{cat.icon || cat.emoji} {cat.name}</option>)
                                                    : fallbackCategories.map((c) => <option key={c} value={c}>{c}</option>)
                                                }
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Amount (INR) *</label>
                                                <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                                                    className="input-styled" />
                                            </div>
                                            <div>
                                                <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Effective Date *</label>
                                                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                                    className="input-styled" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2.5 mt-5 pt-3 border-t border-[var(--border)]">
                                        <button onClick={() => { setShowModal(false); setEditTarget(null); }} className="flex-1 py-2 text-xs font-semibold btn-secondary border-[var(--border)]">Cancel</button>
                                        {editTarget ? (
                                            <button onClick={commitEdit} className="flex-1 py-2 text-xs font-bold btn-brand">Save Node</button>
                                        ) : (
                                            <button onClick={handleAdd} className="flex-1 py-2 text-xs font-bold btn-brand">Add Node</button>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Income;
