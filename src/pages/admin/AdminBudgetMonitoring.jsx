import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from "@tanstack/react-table";
import { 
  Loader2, AlertTriangle, Sparkles, Target, Flame, CheckCircle, RefreshCw
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const AdminBudgetMonitoring = () => {
  const [budgets, setBudgets] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  
  // AI Recommendation State
  const [targetUserId, setTargetUserId] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_BUDGETS, {
        params: { page, size: pageSize }
      });
      if (response.data) {
        setBudgets(response.data.content || []);
        setTotalCount(response.data.totalElements || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load user budgets.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const fetchHeatmap = useCallback(async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_BUDGETS_HEATMAP);
      setHeatmap(response.data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchHeatmap();
  }, [fetchBudgets, fetchHeatmap]);

  const generateRecommendation = async () => {
    if (!targetUserId) return;
    setAiGenerating(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADMIN_AI_RECOMMENDATION(targetUserId));
      setAiRecommendation(response.data?.recommendation || "No recommendation generated.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI recommendation.");
    } finally {
      setAiGenerating(false);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'userName',
      header: 'Operator Name',
      cell: (info) => <span className="font-bold text-xs text-[var(--text-primary)]">{info.getValue()}</span>
    },
    {
      accessorKey: 'category',
      header: 'Category Node',
      cell: (info) => <span className="text-xs text-[var(--text-secondary)] font-medium">{info.getValue()}</span>
    },
    {
      accessorKey: 'budgetedAmount',
      header: 'Allocated Target',
      cell: (info) => <span className="font-bold text-xs">₹{info.getValue().toLocaleString("en-IN")}</span>
    },
    {
      accessorKey: 'spentAmount',
      header: 'Consumed Volume',
      cell: (info) => <span className="font-bold text-xs text-[var(--text-secondary)]">₹{info.getValue().toLocaleString("en-IN")}</span>
    },
    {
      accessorKey: 'remainingAmount',
      header: 'Remaining Cache',
      cell: (info) => {
        const val = info.getValue();
        return (
          <span className={`font-black text-xs ${val < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {val < 0 ? '-' : ''}₹{Math.abs(val).toLocaleString("en-IN")}
          </span>
        );
      }
    },
    {
      accessorKey: 'period',
      header: 'Cycle',
      cell: (info) => <span className="text-[10px] font-mono text-[var(--text-muted)]">{info.getValue()}</span>
    },
    {
      accessorKey: 'status',
      header: 'System Status',
      cell: (info) => {
        const status = info.getValue();
        if (status === 'ON_TRACK') return <span className="badge-income flex items-center gap-1 w-max"><CheckCircle size={10} /> ON TRACK</span>;
        if (status === 'CRITICAL') return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-[4px] text-[10px] font-bold flex items-center gap-1 w-max"><AlertTriangle size={10} /> CRITICAL</span>;
        return <span className="badge-expense flex items-center gap-1 w-max"><Flame size={10} /> OVER BUDGET</span>;
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button 
            onClick={() => {
              setTargetUserId(row.original.userId);
              setAiRecommendation("");
            }}
            className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1 shrink-0"
            title="Generate AI Advice for this User"
          >
            <Sparkles size={11} className="text-purple-500" />
            <span>AI Advice</span>
          </button>
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data: budgets,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize),
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Budget Diagnostics</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Global monitoring of user allocation targets and threshold breaches</p>
        </div>
        
        <button 
          onClick={() => { fetchBudgets(); fetchHeatmap(); }}
          className="btn-secondary p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Heatmap Visualization */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
          <Flame size={16} className="text-rose-500" />
          <span>Global Threshold Breach Heatmap (Categories)</span>
        </h3>
        
        {heatmap.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)]">
            <span className="text-xs font-semibold">No critical breaches detected across global registries.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {heatmap.map((item, idx) => {
              // Calculate opacity based on relative severity (simple heuristic)
              const maxCount = Math.max(...heatmap.map(h => h.overBudgetCount));
              const intensity = 0.2 + (0.8 * (item.overBudgetCount / maxCount));
              
              return (
                <div 
                  key={idx} 
                  className="rounded-lg p-3 border border-rose-500/20 flex flex-col justify-between h-24"
                  style={{ backgroundColor: `rgba(244, 63, 94, ${intensity * 0.15})` }} // rose-500 with variable opacity
                >
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{item.category}</p>
                  <div>
                    <p className="text-[10px] font-semibold text-rose-500/80 mb-0.5">{item.overBudgetCount} Users Breached</p>
                    <p className="text-xs font-black text-rose-500">₹{item.totalOverBudgetAmount.toLocaleString("en-IN")} Excess</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budgets Grid */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
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
                    <span className="text-xs font-medium">Scanning allocation matrices...</span>
                  </td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center font-semibold text-xs text-[var(--text-muted)]">
                    No budget allocations found in the current viewport.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)]">
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Page <span className="font-bold text-[var(--text-primary)]">{page + 1}</span> of <span className="font-bold text-[var(--text-primary)]">{totalPages}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Recommendation Modal */}
      {targetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-lg p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4 border-b border-[var(--border)] pb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                <span>OpenAI Core: Financial Assessment</span>
              </h3>
            </div>
            
            <div className="min-h-[120px] flex flex-col justify-center">
              {aiGenerating ? (
                <div className="flex flex-col items-center justify-center py-6 text-purple-500">
                  <Sparkles size={24} className="animate-pulse mb-3" />
                  <span className="text-xs font-bold tracking-widest uppercase">Synthesizing Advice Matrix...</span>
                </div>
              ) : aiRecommendation ? (
                <div className="bg-[var(--surface-2)] p-4 rounded-lg border border-[var(--border)]">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap font-medium">
                    {aiRecommendation}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Target size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                  <p className="text-xs text-[var(--text-muted)] font-medium">Ready to query GPT-4o for strategic reallocation advice.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 mt-4 border-t border-[var(--border)]">
              <button
                onClick={() => { setTargetUserId(null); setAiRecommendation(""); }}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Close Link
              </button>
              {!aiRecommendation && !aiGenerating && (
                <button
                  onClick={generateRecommendation}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-[var(--radius-sm)] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Sparkles size={13} />
                  <span>Execute Analysis</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBudgetMonitoring;
