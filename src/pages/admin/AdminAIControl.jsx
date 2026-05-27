import { useState, useEffect } from "react";
import { 
  Activity, Settings, Play, Database, ShieldAlert, Cpu, 
  BarChart4, BrainCircuit, RefreshCw, Loader2, Save
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";

const AdminAIControl = () => {
  const [dashboard, setDashboard] = useState(null);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  const [savingSettings, setSavingSettings] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_AI_DASHBOARD);
      setDashboard(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load AI metrics.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_AI_SETTINGS);
      setSettings(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_AI_LOGS);
      setLogs(response.data?.content || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await axiosConfig.put(API_ENDPOINTS.ADMIN_AI_SETTINGS, settings);
      toast.success("AI Configuration successfully committed to persistent storage.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save AI configuration.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const response = await axiosConfig.post(API_ENDPOINTS.ADMIN_AI_REANALYZE);
      if (response.data?.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data?.message || "Analysis request failed.");
      }
      fetchLogs();
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to Python ML Bridge.");
    } finally {
      setReanalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-rose-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">AI Control Center</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage intelligence parameters, ML bridges, and system health</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { fetchDashboard(); fetchLogs(); }}
            className="btn-secondary p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title="Refresh Telemetry"
          >
            <RefreshCw size={14} className={loadingDashboard ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-[var(--radius-sm)] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
          >
            {reanalyzing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} className="fill-white" />}
            <span>Re-run Analysis</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Telemetry Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Global Health Gauge */}
            <div className="card p-5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 flex flex-col justify-between h-48 border-indigo-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-500 flex items-center gap-2">
                  <Activity size={16} />
                  <span>Global Financial Health</span>
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500/70">Aggregate</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  {loadingDashboard ? (
                    <Loader2 size={32} className="animate-spin text-indigo-500 opacity-50" />
                  ) : (
                    <div className="text-5xl font-black tracking-tighter text-[var(--text-primary)] drop-shadow-sm">
                      {dashboard?.averageHealthScore?.toFixed(1) || "0.0"}
                      <span className="text-2xl font-bold text-[var(--text-muted)] ml-1">/100</span>
                    </div>
                  )}
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] mt-2">Weighted average of all operator portfolios</p>
                </div>
              </div>
            </div>

            {/* Model Accuracy */}
            <div className="card p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 flex flex-col justify-between h-48 border-emerald-500/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                  <BrainCircuit size={16} />
                  <span>Prediction Efficacy</span>
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/70">Model v4</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  {loadingDashboard ? (
                    <Loader2 size={32} className="animate-spin text-emerald-500 opacity-50" />
                  ) : (
                    <div className="text-5xl font-black tracking-tighter text-[var(--text-primary)] drop-shadow-sm">
                      {dashboard?.predictionAccuracyRate?.toFixed(1) || "0.0"}
                      <span className="text-2xl font-bold text-emerald-500 ml-1">%</span>
                    </div>
                  )}
                  <p className="text-[10px] font-semibold text-[var(--text-secondary)] mt-2">Accuracy rate over trailing 30 days</p>
                </div>
              </div>
            </div>

          </div>

          {/* Lower Grid: Critical Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lowest Score Users */}
            <div className="card p-4">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-3 mb-3 flex items-center gap-2">
                <ShieldAlert size={14} className="text-rose-500" />
                Critical Attention Required
              </h3>
              <div className="space-y-3">
                {loadingDashboard ? (
                  <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /></div>
                ) : (
                  dashboard?.lowestScoreUsers?.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-[var(--text-primary)]">{user.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)] font-mono">{user.email}</p>
                      </div>
                      <span className={`text-xs font-black ${getScoreColor(user.score)} bg-[var(--surface-2)] px-2 py-1 rounded-md border border-[var(--border)]`}>
                        {user.score.toFixed(1)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Anomaly Detection Stats */}
            <div className="card p-4">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-primary)] border-b border-[var(--border)] pb-3 mb-3 flex items-center gap-2">
                <BarChart4 size={14} className="text-amber-500" />
                Category Anomalies
              </h3>
              <div className="space-y-3">
                {loadingDashboard ? (
                  <div className="py-4 flex justify-center"><Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /></div>
                ) : (
                  dashboard?.anomalyStats?.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[var(--text-primary)]">{stat.category}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-amber-500">{stat.anomalies} flags</span>
                        <div className="w-16 h-1.5 bg-amber-500/20 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${Math.min(stat.anomalies * 5, 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* AI Inference Logs */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-primary)] flex items-center gap-2">
                <Database size={14} className="text-[var(--text-muted)]" />
                Intelligence Log Stream
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="premium-table w-full">
                <thead className="sticky top-0 bg-[var(--surface)] shadow-sm">
                  <tr>
                    <th>Timestamp</th>
                    <th>Bridge Vector</th>
                    <th>Response Code</th>
                    <th className="text-right">Latency (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr><td colSpan={4} className="text-center py-8"><Loader2 size={16} className="animate-spin mx-auto text-[var(--text-muted)]" /></td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-xs font-semibold text-[var(--text-muted)]">No inference logs found.</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-[10px] font-mono text-[var(--text-muted)]">
                          {new Date(log.timestamp).toLocaleString("en-IN")}
                        </td>
                        <td className="text-xs font-bold text-[var(--text-primary)]">{log.endpoint}</td>
                        <td>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${log.responseStatus === 200 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {log.responseStatus}
                          </span>
                        </td>
                        <td className="text-right text-[10px] font-mono font-semibold text-[var(--text-secondary)]">{log.executionTimeMs}ms</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Side Panel: Engine Settings */}
        <div className="lg:col-span-1">
          <div className="card p-5 sticky top-24">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-5">
              <Settings size={16} className="text-[var(--text-secondary)]" />
              <span>Engine Configuration</span>
            </h3>

            {loadingSettings ? (
              <div className="py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
            ) : settings ? (
              <div className="space-y-6">
                <div>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={settings.globalAiEnabled}
                        onChange={(e) => setSettings({...settings, globalAiEnabled: e.target.checked})}
                        className="w-4 h-4 text-purple-600 bg-[var(--surface)] border-[var(--border)] rounded focus:ring-purple-500 focus:ring-2 cursor-pointer accent-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)]">Global AI Core Enabled</span>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed mt-1 font-medium">
                        Controls platform-wide access to GPT-4o inferences and Python ML algorithms.
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Confidence Threshold
                    </label>
                    <span className="text-xs font-black text-purple-500">{settings.confidenceThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.confidenceThreshold}
                    onChange={(e) => setSettings({...settings, confidenceThreshold: parseFloat(e.target.value)})}
                    className="w-full h-1.5 bg-[var(--surface-3)] rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between mt-1 text-[9px] text-[var(--text-muted)] font-bold">
                    <span>Loose (0.0)</span>
                    <span>Strict (1.0)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[var(--text-muted)]">
                    Prediction Window
                  </label>
                  <select
                    value={settings.predictionWindowDays}
                    onChange={(e) => setSettings({...settings, predictionWindowDays: parseInt(e.target.value)})}
                    className="input-styled w-full appearance-none py-2.5 pr-8 text-xs font-bold text-[var(--text-primary)]"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                      backgroundPosition: 'right 0.75rem center', 
                      backgroundSize: '1.25rem', 
                      backgroundRepeat: 'no-repeat' 
                    }}
                  >
                    <option value={7}>7 Days Trailing</option>
                    <option value={14}>14 Days Trailing</option>
                    <option value={30}>30 Days Trailing</option>
                    <option value={90}>90 Days Trailing</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-[var(--border)]">
                  <button
                    onClick={saveSettings}
                    disabled={savingSettings}
                    className="w-full btn-brand py-2.5 text-xs font-bold flex items-center justify-center gap-2"
                  >
                    {savingSettings ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    <span>Commit Settings</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-[var(--text-muted)] text-xs">Failed to load configuration.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAIControl;
