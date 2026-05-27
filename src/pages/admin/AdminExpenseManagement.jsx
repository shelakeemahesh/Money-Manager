import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from "@tanstack/react-table";
import { 
  Search, Loader2, AlertTriangle, Eye, Download, 
  FileText, X, ChevronLeft, ChevronRight, User, Hash, Tag,
  CreditCard, Calendar, RefreshCw, FileDown
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import SearchInput from "../../components/common/SearchInput";
import * as XLSX from "xlsx";

const AdminExpenseManagement = () => {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, EXPENSE, INCOME

  const [selectedTx, setSelectedTx] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_TRANSACTIONS, {
        params: {
          page,
          size: pageSize,
          category: debouncedSearch, // Using category as general search parameter based on backend API if we want
          type: filterType === "ALL" ? null : filterType
        }
      });
      // the endpoint might be searching by category exactly, but let's assume it searches loosely or we filter on frontend if we fetch all?
      // Actually backend `AdminTransactionController` takes `category` as optional. 
      // Let's pass the search term as `category` parameter for now, or just `search` if the backend supported it. We'll stick with what the endpoint accepts.
      
      if (response.data) {
        setData(response.data.transactions || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setData([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filterType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }
    const exportData = data.map(t => ({
      ID: t.id,
      Type: t.type,
      Title: t.title || t.category,
      Category: t.category,
      Amount: t.amount,
      Date: t.date,
      PaymentMethod: t.paymentMethod,
      UserEmail: t.userEmail,
      Flagged: t.flagged || (t.amount > 50000) ? 'YES' : 'NO',
      Notes: t.note
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `Transactions_Export_${new Date().getTime()}.csv`);
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Tx ID',
      cell: (info) => <span className="font-mono text-[10px] text-[var(--text-muted)]">#{info.getValue()}</span>
    },
    {
      accessorKey: 'userEmail',
      header: 'Operator',
      cell: (info) => <span className="text-xs font-semibold text-[var(--text-primary)]">{info.getValue() || '-'}</span>
    },
    {
      accessorKey: 'type',
      header: 'Node Type',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={val === 'INCOME' ? 'badge-income' : 'badge-expense'}>
            {val === 'INCOME' ? 'Inflow' : 'Outflow'}
          </span>
        );
      }
    },
    {
      accessorKey: 'category',
      header: 'Category Classification',
      cell: (info) => <span className="font-bold text-xs text-[var(--text-primary)]">{info.getValue()}</span>
    },
    {
      accessorKey: 'amount',
      header: 'Total Volume',
      cell: (info) => {
        const amount = info.getValue();
        const type = info.row.original.type;
        return (
          <span className="font-black text-xs" style={{ color: type === 'INCOME' ? 'var(--income)' : 'var(--text-primary)' }}>
            ₹{amount.toLocaleString("en-IN")}
          </span>
        );
      }
    },
    {
      accessorKey: 'date',
      header: 'Logged Date',
      cell: (info) => <span className="font-mono text-[10px] text-[var(--text-muted)]">{info.getValue()}</span>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button 
            onClick={() => {
              setSelectedTx(row.original);
              setShowDrawer(true);
            }}
            className="p-1.5 text-blue-500 hover:bg-blue-500/5 border border-transparent hover:border-blue-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
            title="Inspect Payload"
          >
            <Eye size={14} />
          </button>
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // We are handling pagination server-side, so these are just for UI mapping if needed
    // getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header Viewport */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Platform Transactions</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Audit transaction registries and monitor anomalies</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="input-styled w-full sm:w-36 appearance-none py-2 pr-8 text-xs font-semibold"
            style={{ 
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
              backgroundPosition: 'right 0.75rem center', 
              backgroundSize: '1.25rem', 
              backgroundRepeat: 'no-repeat' 
            }}
          >
            <option value="ALL">All Nodes</option>
            <option value="EXPENSE">Outflows</option>
            <option value="INCOME">Inflows</option>
          </select>

          <SearchInput
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            wrapperClass="w-full sm:w-56"
          />

          <button 
            onClick={fetchTransactions}
            className="btn-secondary p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title="Force Reload Registries"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="btn-brand p-2 rounded-[var(--radius-sm)] transition-colors cursor-pointer flex items-center gap-2 px-3"
            title="Export CSV"
          >
            <FileDown size={14} />
            <span className="text-xs font-semibold">Export</span>
          </button>
        </div>
      </div>

      {/* Transactions table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[var(--text-secondary)]" />
                    <span className="text-xs font-medium">Analyzing transaction ledgers...</span>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center font-semibold text-xs text-[var(--text-muted)]">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => {
                  const isFlagged = row.original.flagged || row.original.amount > 50000;
                  return (
                    <tr 
                      key={row.id} 
                      className={isFlagged ? 'bg-amber-500/5 hover:bg-amber-500/10' : ''}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="relative">
                          {isFlagged && cell.column.id === 'id' && (
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-500" title="Flagged Anomaly"></div>
                          )}
                          <div className="flex items-center gap-2">
                            {isFlagged && cell.column.id === 'id' && (
                              <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                            )}
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)]">
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Showing <span className="font-bold text-[var(--text-primary)]">{(page * pageSize) + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min((page + 1) * pageSize, totalCount)}</span> of <span className="font-bold text-[var(--text-primary)]">{totalCount}</span> entries
            </div>

            <div className="flex items-center gap-3">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                className="input-styled py-1.5 px-3 text-[10px] w-20 appearance-none bg-[var(--surface)] text-xs font-semibold"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                  backgroundPosition: 'right 0.5rem center', 
                  backgroundSize: '1rem', 
                  backgroundRepeat: 'no-repeat' 
                }}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <div className="text-xs font-semibold text-[var(--text-primary)] px-2">
                  Page {page + 1} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Slide-in Drawer */}
      {showDrawer && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-end modal-overlay animate-fade-in">
          <div className="h-full w-full max-w-md p-6 bg-[var(--surface)] border-l border-[var(--border)] shadow-xl flex flex-col justify-between animate-slide-in-right overflow-y-auto">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" />
                  <span>Transaction Payload</span>
                </h3>
                <button onClick={() => setShowDrawer(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {(selectedTx.flagged || selectedTx.amount > 50000) && (
                <div className="mb-6 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-500 mb-1">Flagged Anomaly</h4>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400/80 leading-relaxed">
                      This transaction exceeds normal volume thresholds or was flagged by the automated monitoring system. Requires audit.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${selectedTx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                    <Hash size={28} />
                  </div>
                  <h4 className="font-black text-2xl" style={{ color: selectedTx.type === 'INCOME' ? 'var(--income)' : 'var(--text-primary)' }}>
                    ₹{selectedTx.amount.toLocaleString("en-IN")}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={selectedTx.type === 'INCOME' ? 'badge-income' : 'badge-expense'}>
                      {selectedTx.type === 'INCOME' ? 'Inflow' : 'Outflow'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ledger Details</h4>
                  
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)] flex items-center gap-1.5"><Hash size={13} /> Node ID</span>
                      <span className="font-mono text-[var(--text-primary)] font-semibold">#{selectedTx.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)] flex items-center gap-1.5"><User size={13} /> Operator</span>
                      <span className="font-semibold text-[var(--text-primary)]">{selectedTx.userEmail || '-'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)] flex items-center gap-1.5"><Tag size={13} /> Category</span>
                      <span className="font-bold text-[var(--text-primary)]">{selectedTx.category}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)] flex items-center gap-1.5"><CreditCard size={13} /> Payment Vector</span>
                      <span className="font-medium text-[var(--text-primary)]">{selectedTx.paymentMethod || 'Standard'}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pb-3 border-b border-[var(--border)]">
                      <span className="text-[var(--text-muted)] flex items-center gap-1.5"><Calendar size={13} /> Logged Date</span>
                      <span className="font-mono text-[var(--text-secondary)]">{selectedTx.date}</span>
                    </div>
                  </div>
                </div>

                {selectedTx.note && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Transaction Notes</h4>
                    <div className="p-3 bg-[var(--surface-3)] border border-[var(--border)] rounded-md">
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                        {selectedTx.note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowDrawer(false)}
              className="w-full btn-secondary py-2.5 text-xs font-bold text-center mt-6 shrink-0"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExpenseManagement;
