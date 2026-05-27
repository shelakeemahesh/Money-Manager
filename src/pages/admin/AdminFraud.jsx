import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  UserMinus, 
  RefreshCw, 
  AlertTriangle,
  FileText,
  Search,
  CheckCircle,
  HelpCircle,
  Loader2
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import SearchInput from "../../components/common/SearchInput";

const ThreatGauge = ({ score }) => {
  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = "text-emerald-500";
  let bgGradient = "from-emerald-500/5 to-transparent";
  let label = "Low Risk";
  let dotColor = "bg-emerald-500";
  let textColor = "text-emerald-600 dark:text-emerald-400";

  if (score > 80) {
    strokeColor = "text-rose-500";
    bgGradient = "from-rose-500/5 to-transparent";
    label = "Critical Risk";
    dotColor = "bg-rose-500";
    textColor = "text-rose-600 dark:text-rose-400";
  } else if (score > 60) {
    strokeColor = "text-orange-500";
    bgGradient = "from-orange-500/5 to-transparent";
    label = "Elevated Risk";
    dotColor = "bg-orange-500";
    textColor = "text-orange-600 dark:text-orange-400";
  } else if (score > 35) {
    strokeColor = "text-amber-500";
    bgGradient = "from-amber-500/5 to-transparent";
    label = "Medium Risk";
    dotColor = "bg-amber-500";
    textColor = "text-amber-600 dark:text-amber-400";
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 w-full">
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Subtle Radial Glow */}
        <div className={`absolute inset-4 rounded-full bg-gradient-to-b ${bgGradient} blur-xs opacity-55 pointer-events-none`} />
        
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Back Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
            className="opacity-40"
          />
          {/* Active Ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-out ${strokeColor}`}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black tracking-tight text-[var(--text-primary)] leading-none">{score}</span>
          <span className="text-[8px] uppercase tracking-widest font-extrabold text-[var(--text-muted)] mt-1">Threat Score</span>
        </div>
      </div>
      
      {/* Animated Status Tag */}
      <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-3)] border border-[var(--border)] shadow-xs select-none">
        <span className="relative flex h-1.5 w-1.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
        </span>
        <span className={`text-[9px] uppercase tracking-wider font-extrabold ${textColor}`}>{label}</span>
      </div>
    </div>
  );
};

const AdminFraud = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [actionEvent, setActionEvent] = useState(null);
  const [actionType, setActionType] = useState(""); // CLEAR or BLOCK
  const [actionLoading, setActionLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [reasonFilter, statusFilter]);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_FRAUD_EVENTS);
      setEvents(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load fraud events ledger.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleActionClick = (event, type) => {
    setActionEvent(event);
    setActionType(type);
    setModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!actionEvent) return;
    setActionLoading(true);
    try {
      await axiosConfig.post(API_ENDPOINTS.ADMIN_FRAUD_ACTION(actionEvent.id), {
        action: actionType
      });
      toast.success(`Event #${actionEvent.id} successfully processed: ${actionType}`);
      setModalOpen(false);
      setActionEvent(null);
      fetchEvents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to execute action.");
    } finally {
      setActionLoading(false);
    }
  };

  // Compute stats
  const averageThreatScore = useMemo(() => {
    if (events.length === 0) return 0;
    const total = events.reduce((sum, e) => sum + (e.riskScore || 0), 0);
    return Math.round(total / events.length);
  }, [events]);

  const stats = useMemo(() => {
    const total = events.length;
    const underReview = events.filter(e => e.status === "UNDER_REVIEW").length;
    const blocked = events.filter(e => e.status === "BLOCKED").length;
    const cleared = events.filter(e => e.status === "CLEARED").length;

    return { total, underReview, blocked, cleared };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = 
        e.userEmail?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        e.transactionId?.toString().includes(debouncedSearch);
      
      const matchesReason = 
        reasonFilter === "ALL" || e.flagReason === reasonFilter;

      const matchesStatus = 
        statusFilter === "ALL" || e.status === statusFilter;

      return matchesSearch && matchesReason && matchesStatus;
    });
  }, [events, debouncedSearch, reasonFilter, statusFilter]);

  const paginatedEvents = useMemo(() => {
    const start = page * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, page, pageSize]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;

  const getReasonLabel = (reason) => {
    return reason?.replace(/_/g, " ") || "";
  };

  const getReasonBadgeColor = (reason) => {
    if (reason === "DUPLICATE") return "bg-rose-500/5 text-rose-600 dark:text-rose-400 border-rose-500/10";
    if (reason === "VELOCITY_SPIKE") return "bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/10";
    if (reason === "UNUSUAL_AMOUNT") return "bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/10";
    return "bg-zinc-500/5 text-zinc-600 dark:text-zinc-400 border-zinc-500/10";
  };

  const getStatusBadge = (status) => {
    if (status === "UNDER_REVIEW") {
      return (
        <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[9px] font-bold inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          REVIEW
        </span>
      );
    }
    if (status === "CLEARED") {
      return (
        <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-bold inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          SAFE
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-[4px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[9px] font-bold inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        BLOCKED
      </span>
    );
  };

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <ShieldAlert size={15} className="text-rose-500" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Fraud & Risk Detection
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Platform-wide velocity monitors, z-score statistical outliers, and user mitigation logs
            </p>
          </div>
        </div>
        <button 
          onClick={fetchEvents}
          disabled={loading}
          className="btn-secondary p-1.5 rounded-[var(--radius-sm)] flex items-center justify-center cursor-pointer disabled:opacity-50 self-start sm:self-center"
          title="Refresh Events"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch w-full">
        {/* Threat Gauge Card */}
        <div className="card p-5 lg:col-span-1 flex flex-col items-center justify-between text-center relative overflow-hidden bg-gradient-to-b from-[var(--surface)] to-[var(--surface-2)]">
          <div className="w-full flex justify-between items-center border-b border-[var(--border)] pb-3 mb-1">
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">Risk Profiler</h3>
            <ShieldAlert size={12} className="text-rose-500" />
          </div>
          <ThreatGauge score={averageThreatScore} />
        </div>

        {/* Counter Cards Area */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Under Review */}
          <div className="card p-5 flex flex-col justify-between bg-[var(--surface)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-[3px] w-full bg-amber-500" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Under Active Review</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{stats.underReview}</h3>
              </div>
              <div className="w-8 h-8 rounded-md bg-amber-500/5 dark:bg-amber-500/10 text-amber-500 border border-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[9px] text-[var(--text-muted)]">
              <span className="font-semibold text-amber-500">Requires Mitigation</span>
              <span>Needs administrator clearance</span>
            </div>
          </div>

          {/* Blocked Users */}
          <div className="card p-5 flex flex-col justify-between bg-[var(--surface)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-[3px] w-full bg-rose-500" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Banned Entities</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{stats.blocked}</h3>
              </div>
              <div className="w-8 h-8 rounded-md bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 border border-rose-500/10 flex items-center justify-center shrink-0">
                <UserMinus size={14} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[9px] text-[var(--text-muted)]">
              <span className="font-semibold text-rose-500">Secured States</span>
              <span>Total accounts restricted</span>
            </div>
          </div>

          {/* Cleared / Released */}
          <div className="card p-5 flex flex-col justify-between bg-[var(--surface)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 h-[3px] w-full bg-emerald-500" />
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Cleared Logs</p>
                <h3 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">{stats.cleared}</h3>
              </div>
              <div className="w-8 h-8 rounded-md bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[9px] text-[var(--text-muted)]">
              <span className="font-semibold text-emerald-500">Approved Logs</span>
              <span>False-positives resolved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filtration Bar */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-center justify-between bg-[var(--surface)] w-full">
        <SearchInput
          placeholder="Search by Operator Email or Tx ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          wrapperClass="w-full md:w-80"
          className="py-1.5"
        />

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Reason Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] whitespace-nowrap">Flag Type:</label>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="input-styled py-1.5 text-xs w-full sm:w-40 bg-[var(--surface)] appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 0.6rem center', 
                backgroundSize: '1rem', 
                backgroundRepeat: 'no-repeat' 
              }}
            >
              <option value="ALL">All Types</option>
              <option value="DUPLICATE">Duplicate Scans</option>
              <option value="VELOCITY_SPIKE">Velocity Spike</option>
              <option value="UNUSUAL_AMOUNT">Z-Score Outliers</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-[10px] uppercase font-bold text-[var(--text-secondary)] whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-styled py-1.5 text-xs w-full sm:w-40 bg-[var(--surface)] appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 0.6rem center', 
                backgroundSize: '1rem', 
                backgroundRepeat: 'no-repeat' 
              }}
            >
              <option value="ALL">All States</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CLEARED">Cleared</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="card p-5 w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-rose-500 animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
              Flagged Suspicious Activity Logs
            </h2>
          </div>
          <span className="badge-expense text-[9px] font-bold px-2 py-0.5 rounded border border-rose-500/10">
            {filteredEvents.length} flagged events
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Retrieving fraud registers...</span>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-xs text-[var(--text-muted)]">No suspicious fraud events flagged.</div>
          ) : (
            <table className="premium-table w-full">
              <thead>
                <tr className="text-[10px] uppercase font-bold text-[var(--text-muted)]">
                  <th className="py-2.5 px-4">Event Details</th>
                  <th className="py-2.5 px-4">Operator Email</th>
                  <th className="py-2.5 px-4">Volume (Amount)</th>
                  <th className="py-2.5 px-4">Breach Indicator</th>
                  <th className="py-2.5 px-4">Risk Index</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Mitigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {paginatedEvents.map((evt) => (
                  <tr key={evt.id} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-xs text-[var(--text-primary)]">Alert #{evt.id}</span>
                        <p className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">Tx Ref: #{evt.transactionId}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--text-secondary)] font-mono">{evt.userEmail}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-xs text-[var(--text-primary)]">₹{evt.amount?.toLocaleString("en-IN") || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-[4px] text-[8px] font-extrabold uppercase tracking-wider border ${getReasonBadgeColor(evt.flagReason)}`}>
                        {getReasonLabel(evt.flagReason)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-black text-xs ${evt.riskScore > 75 ? "text-rose-500" : evt.riskScore > 40 ? "text-amber-500" : "text-emerald-500"}`}>
                          {evt.riskScore}%
                        </span>
                        <div className="w-12 h-1 bg-[var(--surface-3)] rounded-full overflow-hidden hidden sm:block border border-[var(--border)]/10">
                          <div 
                            className={`h-full rounded-full ${evt.riskScore > 75 ? "bg-rose-500" : evt.riskScore > 40 ? "bg-amber-500" : "bg-emerald-500"}`}
                            style={{ width: `${evt.riskScore}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[10px] font-mono text-[var(--text-muted)]">
                      {new Date(evt.detectedAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(evt.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {evt.status === "UNDER_REVIEW" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleActionClick(evt, "CLEAR")}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 rounded-md cursor-pointer transition-colors"
                            title="Clear Event"
                          >
                            <ShieldCheck size={14} />
                          </button>
                          <button
                            onClick={() => handleActionClick(evt, "BLOCK")}
                            className="p-1.5 text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-md cursor-pointer transition-colors"
                            title="Block Account"
                          >
                            <UserMinus size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] italic">Mitigated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)] mt-4 rounded-b-md">
            <div className="text-xs text-[var(--text-muted)] font-medium">
              Showing <span className="font-bold text-[var(--text-primary)]">{(page * pageSize) + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min((page + 1) * pageSize, filteredEvents.length)}</span> of <span className="font-bold text-[var(--text-primary)]">{filteredEvents.length}</span> entries
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
                <option value={5}>5 / page</option>
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

      {/* Action Modal */}
      {modalOpen && actionEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-fade-in">
          <div className="card p-6 max-w-sm w-full space-y-4 animate-scale-in bg-[var(--surface)] border-[var(--border)] shadow-xl">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${actionType === "BLOCK" ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"}`}>
                {actionType === "BLOCK" ? <UserMinus size={18} /> : <ShieldCheck size={18} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {actionType === "BLOCK" ? "Confirm User Block" : "Confirm Event Clearance"}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                  Are you sure you want to {actionType === "BLOCK" ? "block" : "clear"} the alert for user <span className="font-bold">{actionEvent.userEmail}</span>?
                </p>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">
                  This action is logged and permanent for transaction audit records.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => setModalOpen(false)}
                disabled={actionLoading}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className={`py-1.5 px-3.5 text-xs rounded-[var(--radius-sm)] font-bold text-white transition-all ${actionType === "BLOCK" ? "bg-rose-500 hover:bg-rose-600 active:scale-95" : "bg-emerald-500 hover:bg-emerald-600 active:scale-95"} disabled:opacity-40 flex items-center justify-center gap-1`}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <span>Yes, {actionType === "BLOCK" ? "Block User" : "Clear Alert"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFraud;
