import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  AlertTriangle,
  Database,
  Cpu,
  Clock,
  RefreshCw,
  Search,
  CheckCircle,
  Loader2,
  Terminal
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import SearchInput from "../../components/common/SearchInput";

const formatMemory = (bytes) => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const formatUptime = (totalSeconds) => {
  if (!totalSeconds) return "0s";
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let str = "";
  if (days > 0) str += `${days}d `;
  if (hours > 0) str += `${hours}h `;
  if (minutes > 0) str += `${minutes}m `;
  str += `${seconds}s`;
  return str;
};

const AdminMonitoring = () => {
  const [stats, setStats] = useState(null);
  const [volumeData, setVolumeData] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  const [slowQueries, setSlowQueries] = useState([]);
  
  // Pagination & Loading
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorPage, setErrorPage] = useState(0);
  const [errorTotalPages, setErrorTotalPages] = useState(1);
  const [errorTotalCount, setErrorTotalCount] = useState(0);
  
  const fetchVolumeData = useCallback(async () => {
    try {
      const response = await axiosConfig.get("/admin/monitoring/request-volume");
      if (response.data) {
        setVolumeData(response.data);
      }
    } catch (err) {
      console.error("Failed to load request volume trends", err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosConfig.get("/admin/monitoring/stats");
      if (response.data) {
        setStats(response.data);
      }
    } catch (err) {
      toast.error("Failed to load server monitoring metrics.");
    }
  }, []);

  const fetchErrorLogs = useCallback(async () => {
    try {
      const response = await axiosConfig.get("/admin/monitoring/errors", {
        params: { page: errorPage, size: 10 }
      });
      if (response.data) {
        setErrorLogs(response.data.content || []);
        setErrorTotalPages(response.data.totalPages || 1);
        setErrorTotalCount(response.data.totalElements || 0);
      }
    } catch (err) {
      toast.error("Failed to fetch server error logs.");
    }
  }, [errorPage]);

  const fetchSlowQueries = useCallback(async () => {
    try {
      const response = await axiosConfig.get("/admin/monitoring/slow-queries");
      if (response.data) {
        setSlowQueries(response.data);
      }
    } catch (err) {
      console.error("Failed to load slow query metrics", err);
    }
  }, []);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    await Promise.all([
      fetchStats(),
      fetchVolumeData(),
      fetchErrorLogs(),
      fetchSlowQueries()
    ]);
    
    setLoading(false);
    setRefreshing(false);
  }, [fetchStats, fetchVolumeData, fetchErrorLogs, fetchSlowQueries]);

  useEffect(() => {
    fetchAllData();
    
    // Live Auto-polling every 10s as requested
    const interval = setInterval(() => {
      fetchStats();
      fetchVolumeData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchAllData, fetchStats, fetchVolumeData]);

  // Refetch logs when page changes
  useEffect(() => {
    fetchErrorLogs();
  }, [errorPage, fetchErrorLogs]);

  // Alert thresholds calculations
  const thresholdAlerts = {
    responseTime: stats?.avgResponseTimeMs > 500, // Response time exceeding 500ms
    dbPool: stats && stats.totalDbConnections > 0 && (stats.activeDbConnections / stats.totalDbConnections) >= 0.8, // Active connections >= 80% pool
    errorRate: stats?.errorRateLastHour > 5.0 // Error rate exceeding 5.0%
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)] font-bold">System Health & Metrics</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">Real-time Spring Boot JVM resources, Hikari connection pools, database performance Aspect, and API response logs</p>
        </div>
        <button 
          onClick={() => fetchAllData(true)}
          disabled={loading || refreshing}
          className="btn-secondary p-2 rounded-[var(--radius-sm)] flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Refresh metrics logs"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="text-xs font-semibold text-[var(--text-secondary)]">Analyzing metrics data streams...</span>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* API Latency Card */}
            <div className={`card p-5 relative overflow-hidden transition-all duration-300 ${thresholdAlerts.responseTime ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/2" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">API Latency (Avg)</p>
                <Clock size={16} className={thresholdAlerts.responseTime ? "text-rose-500" : "text-[var(--text-muted)]"} />
              </div>
              <p className={`text-3xl font-black mt-3 leading-none ${thresholdAlerts.responseTime ? "text-rose-500" : "text-[var(--text-primary)]"}`}>
                {stats?.avgResponseTimeMs || 0} <span className="text-xs font-bold">ms</span>
              </p>
              <div className="flex items-center gap-1.5 mt-4 text-[10px] font-semibold">
                {thresholdAlerts.responseTime ? (
                  <span className="text-rose-500 flex items-center gap-1">⚠️ LATENCY THRESHOLD EXCEEDED (&gt;500ms)</span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Normal Processing Speed</span>
                )}
              </div>
            </div>

            {/* Uptime Card */}
            <div className="card p-5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">System Uptime</p>
                <Activity size={16} className="text-emerald-500" />
              </div>
              <p className="text-xl font-black mt-3.5 leading-none text-[var(--text-primary)]">
                {formatUptime(stats?.uptimeSeconds || 0)}
              </p>
              <div className="flex items-center gap-1 mt-4 text-[10px] font-semibold text-[var(--text-secondary)]">
                <span className="font-bold text-emerald-500">SLA: {stats?.uptimePercentage}%</span>
                <span>• Live Running Server Node</span>
              </div>
            </div>

            {/* Active DB Connections Card */}
            <div className={`card p-5 relative overflow-hidden transition-all duration-300 ${thresholdAlerts.dbPool ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/2" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Active DB Connections</p>
                <Database size={16} className={thresholdAlerts.dbPool ? "text-rose-500" : "text-[var(--text-muted)]"} />
              </div>
              <p className={`text-3xl font-black mt-3 leading-none ${thresholdAlerts.dbPool ? "text-rose-500" : "text-[var(--text-primary)]"}`}>
                {stats?.activeDbConnections || 0} <span className="text-xs font-bold">/ {stats?.totalDbConnections || 1}</span>
              </p>
              <div className="flex items-center gap-1.5 mt-4 text-[10px] font-semibold">
                {thresholdAlerts.dbPool ? (
                  <span className="text-rose-500 flex items-center gap-1">⚠️ POOL CAPACITY AT CRITICAL LOAD (&gt;80%)</span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Connection Pool Stable</span>
                )}
              </div>
            </div>

            {/* Error Rate Card */}
            <div className={`card p-5 relative overflow-hidden transition-all duration-300 ${thresholdAlerts.errorRate ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/2" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Error Rate (Last 1hr)</p>
                <AlertTriangle size={16} className={thresholdAlerts.errorRate ? "text-rose-500" : "text-[var(--text-muted)]"} />
              </div>
              <p className={`text-3xl font-black mt-3 leading-none ${thresholdAlerts.errorRate ? "text-rose-500" : "text-[var(--text-primary)]"}`}>
                {stats?.errorRateLastHour || 0}%
              </p>
              <div className="flex items-center gap-1.5 mt-4 text-[10px] font-semibold">
                {thresholdAlerts.errorRate ? (
                  <span className="text-rose-500 flex items-center gap-1">⚠️ ERROR SPIKE (&gt;5%)</span>
                ) : (
                  <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={10} /> Normal Error Rate</span>
                )}
              </div>
            </div>
          </div>

          {/* Line Chart & System Resources Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Chart Panel */}
            <div className="card p-5 lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                  <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)]">Live Request Volume (Per Min)</h3>
                </div>
                <span className="text-[10px] font-bold text-[var(--text-muted)]">Auto-polling 10s</span>
              </div>

              <div className="h-64 w-full">
                {volumeData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-[var(--text-muted)]">
                    Aggregating request payload metrics...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={volumeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: "var(--text-muted)" }} stroke="var(--border)" />
                      <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} stroke="var(--border)" />
                      <Tooltip 
                        contentStyle={{ background: "var(--surface)", borderColor: "var(--border)", borderRadius: "var(--radius-sm)", fontSize: 11 }}
                        labelStyle={{ fontWeight: "bold", color: "var(--text-primary)" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#6366f1" 
                        strokeWidth={2.5}
                        dot={{ r: 3, stroke: "#6366f1", strokeWidth: 1.5, fill: "var(--surface)" }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* JVM Resources Panel */}
            <div className="card p-5 space-y-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Cpu size={14} className="text-indigo-500" />
                <span>JVM & Actuator Resources</span>
              </h3>

              <div className="space-y-4">
                {/* Heap Memory */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">JVM Heap Usage</span>
                    <span className="font-mono text-[var(--text-primary)] font-bold">
                      {formatMemory(stats?.jvmHeapUsedBytes)} / {formatMemory(stats?.jvmHeapMaxBytes)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-500" 
                      style={{ 
                        width: stats?.jvmHeapMaxBytes > 0 
                          ? `${(stats.jvmHeapUsedBytes / stats.jvmHeapMaxBytes) * 100}%` 
                          : "0%" 
                      }}
                    />
                  </div>
                </div>

                {/* DB Connection pool details */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">Hikari Connection Pool</span>
                    <span className="font-mono text-[var(--text-primary)] font-bold">
                      {stats?.activeDbConnections || 0} Active • {stats?.idleDbConnections || 0} Idle
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500" 
                      style={{ 
                        width: stats?.totalDbConnections > 0 
                          ? `${(stats.activeDbConnections / stats.totalDbConnections) * 100}%` 
                          : "0%" 
                      }}
                    />
                  </div>
                </div>

                {/* Thread count */}
                <div className="flex justify-between text-xs border-b border-[var(--border)] py-2.5">
                  <span className="text-[var(--text-secondary)]">Active OS Thread Count</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{stats?.jvmThreadCount || 0} Threads</span>
                </div>

                {/* Total queries */}
                <div className="flex justify-between text-xs border-b border-[var(--border)] py-2.5">
                  <span className="text-[var(--text-secondary)]">Total SQL Query Invocations</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{stats?.dbQueryCount || 0}</span>
                </div>

                {/* Spring Boot Actuator status */}
                <div className="flex justify-between text-xs items-center pt-2">
                  <span className="text-[var(--text-secondary)]">Actuator Health Check</span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold">
                    HEALTHY
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Database Health & Slow Queries & Error Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Error Logs Table */}
            <div className="card p-5 lg:col-span-2 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                <Terminal size={14} className="text-rose-500" />
                <span>Paginated Application Error Logs</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Method & Path</th>
                      <th>Status</th>
                      <th>Exception / Details</th>
                      <th>Operator</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-xs text-[var(--text-muted)]">
                          No server exception logs recorded. Uptime is healthy.
                        </td>
                      </tr>
                    ) : (
                      errorLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="text-[9px] font-mono text-[var(--text-muted)]">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="font-mono text-xs">
                            <span className="font-bold text-[9px] px-1 py-0.5 bg-[var(--surface-3)] text-[var(--text-secondary)] border rounded mr-1">
                              {log.method}
                            </span>
                            <span className="text-[var(--text-primary)]">{log.endpoint}</span>
                          </td>
                          <td className="font-bold text-xs text-rose-500">{log.statusCode}</td>
                          <td className="text-xs text-[var(--text-secondary)] truncate max-w-xs" title={log.message}>
                            {log.message}
                          </td>
                          <td className="text-[10px] font-mono text-[var(--text-muted)]">{log.userId}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {errorTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Showing {errorLogs.length} of {errorTotalCount} errors
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setErrorPage((p) => Math.max(0, p - 1))}
                      disabled={errorPage === 0}
                      className="btn-secondary px-2.5 py-1 text-[10px] font-bold disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                      Page {errorPage + 1} of {errorTotalPages}
                    </span>
                    <button
                      onClick={() => setErrorPage((p) => Math.min(errorTotalPages - 1, p + 1))}
                      disabled={errorPage === errorTotalPages - 1}
                      className="btn-secondary px-2.5 py-1 text-[10px] font-bold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Slow Database Queries Panel */}
            <div className="card p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                  <Database size={14} className="text-amber-500" />
                  <span>Slow Repository Queries (&gt;500ms)</span>
                </h3>
                <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold">
                  {stats?.slowQueriesCount || 0} Alerts
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {slowQueries.length === 0 ? (
                  <div className="text-center py-16 text-xs text-[var(--text-muted)]">
                    No slow query anomalies detected. Aspect is active.
                  </div>
                ) : (
                  slowQueries.map((q, idx) => (
                    <div key={idx} className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-md flex flex-col gap-1 hover:border-amber-500/20 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9.5px] font-bold text-[var(--text-primary)] truncate max-w-[180px]" title={q.signature}>
                          {q.signature}
                        </span>
                        <span className="text-[10px] font-bold text-rose-500 whitespace-nowrap">{q.durationMs}ms</span>
                      </div>
                      <span className="text-[8px] font-mono text-[var(--text-muted)]">
                        {new Date(q.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminMonitoring;
