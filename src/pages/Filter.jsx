import { useContext, useState } from "react";
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, Calendar, ArrowUpDown, Download } from "lucide-react";
import AppContext from "../context/AppContext";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import Input from "../components/common/Input";
import SearchInput from "../components/common/SearchInput";

const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const Filter = () => {
    const { incomeList, expenseList } = useContext(AppContext);

    const [filters, setFilters] = useState({
        type: "Income",
        startDate: "",
        endDate: "",
        sortField: "Date",
        sortOrder: "Ascending",
        search: "",
    });
    const [applied, setApplied] = useState(false);
    const [results, setResults] = useState([]);

    const handleApply = () => {
        let list =
            filters.type === "Income"
                ? incomeList.map((i) => ({ ...i, type: "Income", label: i.source }))
                : expenseList.map((e) => ({ ...e, type: "Expense", label: e.category }));

        if (filters.startDate) list = list.filter((i) => new Date(i.date) >= new Date(filters.startDate));
        if (filters.endDate) list = list.filter((i) => new Date(i.date) <= new Date(filters.endDate));
        if (filters.search.trim()) {
            const q = filters.search.toLowerCase();
            list = list.filter((i) => (i.label || "").toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            let valA = filters.sortField === "Date" ? new Date(a.date || 0) : (a.amount || 0);
            let valB = filters.sortField === "Date" ? new Date(b.date || 0) : (b.amount || 0);
            return filters.sortOrder === "Ascending" ? valA - valB : valB - valA;
        });

        setResults(list);
        setApplied(true);
    };

    const update = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

    const totalFiltered = results.reduce((s, i) => s + (i.amount || 0), 0);

    const downloadExcel = () => {
        if (results.length === 0) {
            toast.error("No filtered data to download.");
            return;
        }
        const rows = results.map((item, i) => ({
            "S.No": i + 1,
            "Name / Label": item.label,
            "Type": item.type,
            "Amount": item.amount,
            "Date": item.date ? new Date(item.date).toLocaleDateString("en-IN") : "-",
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Filtered_Results");
        XLSX.writeFile(wb, `filtered_transactions.xlsx`);
        toast.success("Filtered report downloaded successfully!");
    };

    return (
        <div className="space-y-5 pb-10 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                        <SlidersHorizontal size={15} />
                    </div>
                    <div>
                        <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">Filter Node Registry</h1>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Query and locate specific transaction logs</p>
                    </div>
                </div>
                {applied && results.length > 0 && (
                    <button onClick={downloadExcel} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold self-start sm:self-center">
                        <Download size={13} />
                        <span>Export Results</span>
                    </button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="card p-4">
                <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal size={14} className="text-[var(--text-secondary)]" />
                    <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">Query Parameters</h2>
                </div>

                {/* Type Toggle */}
                <div className="flex gap-2 mb-4">
                    {["Income", "Expense"].map(type => (
                        <button
                          key={type}
                          onClick={() => update("type", type)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                              filters.type === type
                                  ? type === "Income"
                                      ? "bg-[var(--income-bg)] text-[var(--income)] border-[var(--income)]/10"
                                      : "bg-[var(--expense-bg)] text-[var(--expense)] border-[var(--expense)]/10"
                                  : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-2)]"
                          }`}
                        >
                          {type === "Income" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                          <span>{type} nodes</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                    {/* Start Date */}
                    <div>
                        <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                            <Calendar size={11} className="inline mr-1 -mt-0.5" />Start Date
                        </label>
                        <input type="date" value={filters.startDate} onChange={(e) => update("startDate", e.target.value)}
                            className="input-styled" />
                    </div>

                    {/* End Date */}
                    <div>
                        <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                            <Calendar size={11} className="inline mr-1 -mt-0.5" />End Date
                        </label>
                        <input type="date" value={filters.endDate} onChange={(e) => update("endDate", e.target.value)}
                            className="input-styled" />
                    </div>

                    {/* Sort Field */}
                    <div>
                        <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                            <ArrowUpDown size={11} className="inline mr-1 -mt-0.5" />Sort Attribute
                        </label>
                        <select value={filters.sortField} onChange={(e) => update("sortField", e.target.value)}
                            className="input-styled appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                        >
                            <option>Date</option>
                            <option>Amount</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div>
                        <label className="block text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1">Ordering Direction</label>
                        <select value={filters.sortOrder} onChange={(e) => update("sortOrder", e.target.value)}
                            className="input-styled appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
                        >
                            <option>Ascending</option>
                            <option>Descending</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div className="sm:col-span-2">
                        <div className="flex items-end gap-2">
                            <SearchInput
                                label="Search text"
                                placeholder="Query name, source, or description..."
                                value={filters.search}
                                onChange={(e) => update("search", e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleApply()}
                                wrapperClass="flex-1"
                            />
                            <button onClick={handleApply}
                                className="btn-brand px-4 py-2.5 text-xs font-semibold shrink-0 flex items-center gap-1.5 h-[35px] cursor-pointer">
                                <Search size={13} />
                                <span>Query</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Table */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                    <div>
                        <h2 className="font-semibold text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">Query Results</h2>
                        {applied && (
                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5">
                                Found {results.length} nodes · Cumulative Volume: <span className={`font-bold ${filters.type === "Income" ? "text-emerald-500" : "text-rose-500"}`}>{formatCurrency(totalFiltered)}</span>
                            </p>
                        )}
                    </div>
                </div>

                {!applied ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3 bg-[var(--surface-3)] border border-[var(--border)]">
                            <SlidersHorizontal size={16} className="text-[var(--text-secondary)]" />
                        </div>
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Awaiting filter compilation</p>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Adjust query parameters and execute the query</p>
                    </div>
                ) : results.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">Zero records retrieved</p>
                        <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Modify date bounds or text search and query again</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>Source / Category</th>
                                    <th className="hidden sm:table-cell">Type Node</th>
                                    <th>Logged Date</th>
                                    <th className="text-right">Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((item, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{item.icon}</span>
                                                <span className="truncate max-w-[140px] sm:max-w-none font-semibold text-[var(--text-primary)]">{item.label}</span>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell">
                                            <span className={item.type === "Income" ? "badge-income" : "badge-expense"}>{item.type}</span>
                                        </td>
                                        <td className="text-xs text-[var(--text-muted)]">
                                            {item.date ? new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                                        </td>
                                        <td className={`text-right font-semibold ${item.type === "Income" ? "text-emerald-500" : "text-rose-500"}`}>
                                            {item.type === "Income" ? "+" : "-"}{formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Filter;
