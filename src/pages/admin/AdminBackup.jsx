import { useState, useEffect, useCallback } from "react";
import {
  Database,
  RefreshCw,
  Download,
  ShieldAlert,
  Lock,
  Calendar,
  Cloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
  Save,
  Play
} from "lucide-react";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import Input from "../../components/common/Input";

const formatBytes = (bytes) => {
  if (bytes === 0 || !bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const AdminBackup = () => {
  // Page Loading
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [triggeringBackup, setTriggeringBackup] = useState(false);
  const [refreshingHistory, setRefreshingHistory] = useState(false);

  // Settings state
  const [backupSettings, setBackupSettings] = useState({
    frequency: "DAILY",
    retentionPeriodDays: 30,
    storageDestination: "LOCAL",
    awsBucket: "",
    awsAccessKey: "",
    awsSecretKey: "",
    awsRegion: ""
  });

  const [retentionSettings, setRetentionSettings] = useState({
    retentionPeriodDays: 30
  });

  // History logs
  const [history, setHistory] = useState([]);
  
  // Clipboard copy state
  const [copiedId, setCopiedId] = useState(null);

  // Restore Modal State
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restorePassword, setRestorePassword] = useState("");
  const [restoring, setRestoring] = useState(false);

  // Deployment readiness state
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployPassword, setDeployPassword] = useState("");
  const [preparingDeploy, setPreparingDeploy] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await axiosConfig.get("/admin/backup/settings");
      if (response.data && response.data.data) {
        const { backup, retention } = response.data.data;
        if (backup) {
          setBackupSettings({
            frequency: backup.frequency || "DAILY",
            retentionPeriodDays: backup.retentionPeriodDays || 30,
            storageDestination: backup.storageDestination || "LOCAL",
            awsBucket: backup.awsBucket || "",
            awsAccessKey: backup.awsAccessKey || "",
            awsSecretKey: backup.awsSecretKey || "",
            awsRegion: backup.awsRegion || ""
          });
        }
        if (retention) {
          setRetentionSettings({
            retentionPeriodDays: retention.retentionPeriodDays || 30
          });
        }
      }
    } catch (err) {
      toast.error("Failed to load backup and retention configuration.");
    }
  }, []);

  const fetchHistory = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshingHistory(true);
    try {
      const response = await axiosConfig.get("/admin/backup/history");
      if (response.data && response.data.data) {
        setHistory(response.data.data);
      }
    } catch (err) {
      toast.error("Failed to retrieve database backup history logs.");
    } finally {
      setRefreshingHistory(false);
    }
  }, []);

  const initData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSettings(), fetchHistory(true)]);
    setLoading(false);
  }, [fetchSettings, fetchHistory]);

  useEffect(() => {
    initData();
  }, [initData]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = {
        backup: {
          ...backupSettings,
          retentionPeriodDays: parseInt(backupSettings.retentionPeriodDays)
        },
        retention: {
          retentionPeriodDays: parseInt(retentionSettings.retentionPeriodDays)
        }
      };

      const response = await axiosConfig.put("/admin/backup/settings", payload);
      if (response.data) {
        toast.success("Backup & recovery configurations saved successfully.");
        fetchSettings(); // refresh state
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    try {
      const response = await axiosConfig.post("/admin/backup/trigger");
      if (response.data) {
        toast.success("Database snapshot triggered and finalized successfully.");
        fetchHistory(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Manual backup execution failed. Ensure dump utilities (mysqldump / pg_dump) are available.");
    } finally {
      setTriggeringBackup(false);
    }
  };

  const handleOpenRestoreModal = (backup) => {
    setSelectedBackup(backup);
    setRestorePassword("");
    setShowRestoreModal(true);
  };

  const handleRestore = async () => {
    if (!restorePassword.trim()) {
      toast.error("Admin verification password is required.");
      return;
    }

    setRestoring(true);
    try {
      const response = await axiosConfig.post(`/admin/backup/restore/${selectedBackup.id}`, {
        password: restorePassword
      });
      if (response.data) {
        toast.success("Database restored successfully to selected restore point.");
        setShowRestoreModal(false);
        fetchHistory(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Restoration rejected. Please verify the admin password.");
    } finally {
      setRestoring(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Local backup file path copied to clipboard.");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenDeployModal = () => {
    setDeployPassword("");
    setShowDeployModal(true);
  };

  const handlePrepareDeploy = async () => {
    if (!deployPassword.trim()) {
      toast.error("Admin verification password is required.");
      return;
    }

    setPreparingDeploy(true);
    try {
      const response = await axiosConfig.post("/admin/backup/prepare-deploy", {
        password: deployPassword
      });
      if (response.data) {
        toast.success("Database cleared! Application is ready to deploy.");
        setShowDeployModal(false);
        fetchHistory(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Deployment preparation failed. Verify admin password.");
    } finally {
      setPreparingDeploy(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)] font-bold">
            Backup & Recovery Center
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">
            Manage automated scheduler tasks, AWS S3 storage configurations, retention cleanup thresholds, and system recoveries.
          </p>
        </div>
        <button
          onClick={() => {
            fetchSettings();
            fetchHistory(false);
          }}
          disabled={loading || refreshingHistory}
          className="btn-secondary p-2 rounded-[var(--radius-sm)] flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Refresh stats and records"
        >
          <RefreshCw size={14} className={refreshingHistory ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-3">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Loading registry settings...
          </span>
        </div>
      ) : (
        <>
          {/* Main settings forms & Quick actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Automated backup configuration */}
            <div className="card p-5 lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <Calendar size={16} className="text-indigo-500" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-primary)]">
                  Scheduled Database Backups
                </h3>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frequency */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Backup Interval Trigger
                    </label>
                    <select
                      value={backupSettings.frequency}
                      onChange={(e) =>
                        setBackupSettings({ ...backupSettings, frequency: e.target.value })
                      }
                      className="input-styled"
                    >
                      <option value="DAILY">Daily (Runs every day at midnight)</option>
                      <option value="WEEKLY">Weekly (Runs every Sunday at midnight)</option>
                    </select>
                  </div>

                  {/* Backup Retention */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Backup Dump Lifespan
                    </label>
                    <select
                      value={backupSettings.retentionPeriodDays}
                      onChange={(e) =>
                        setBackupSettings({
                          ...backupSettings,
                          retentionPeriodDays: parseInt(e.target.value)
                        })
                      }
                      className="input-styled"
                    >
                      <option value="7">7 Days (Weekly cleanup)</option>
                      <option value="14">14 Days (Bi-weekly cleanup)</option>
                      <option value="30">30 Days (Monthly cleanup)</option>
                      <option value="90">90 Days (Quarterly cleanup)</option>
                    </select>
                  </div>
                </div>

                {/* Storage Target Option */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Backup Storage Destination
                  </label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="storageDestination"
                        value="LOCAL"
                        checked={backupSettings.storageDestination === "LOCAL"}
                        onChange={() =>
                          setBackupSettings({ ...backupSettings, storageDestination: "LOCAL" })
                        }
                        className="accent-indigo-600"
                      />
                      <span>Local Filesystem Storage (Server Disk)</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="storageDestination"
                        value="S3"
                        checked={backupSettings.storageDestination === "S3"}
                        onChange={() =>
                          setBackupSettings({ ...backupSettings, storageDestination: "S3" })
                        }
                        className="accent-indigo-600"
                      />
                      <span className="flex items-center gap-1">
                        <Cloud size={13} className="text-sky-500" /> Amazon S3 Cloud Bucket
                      </span>
                    </label>
                  </div>
                </div>

                {/* Conditional AWS S3 Fields */}
                {backupSettings.storageDestination === "S3" && (
                  <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-md space-y-4 animate-scale-in">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-sky-500">
                      <Cloud size={14} />
                      <span>AWS Simple Storage Service Integration Credentials</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          AWS Bucket Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. moneymanager-db-backups"
                          value={backupSettings.awsBucket}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, awsBucket: e.target.value })
                          }
                          className="input-styled"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          AWS Region
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. us-east-1"
                          value={backupSettings.awsRegion}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, awsRegion: e.target.value })
                          }
                          className="input-styled"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          AWS Access Key ID
                        </label>
                        <input
                          type="text"
                          placeholder="AKIAIOSFODNN7EXAMPLE"
                          value={backupSettings.awsAccessKey}
                          onChange={(e) =>
                            setBackupSettings({ ...backupSettings, awsAccessKey: e.target.value })
                          }
                          className="input-styled"
                        />
                      </div>

                      <Input
                        label="AWS Secret Access Key"
                        type="password"
                        placeholder="••••••••••••••••••••••••••••••••••••"
                        value={backupSettings.awsSecretKey}
                        onChange={(e) =>
                          setBackupSettings({ ...backupSettings, awsSecretKey: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-[var(--border)] flex justify-end">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="btn-brand flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold"
                  >
                    {savingSettings ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    <span>Save Settings</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Actions & Retention policy */}
            <div className="space-y-6">
              
              {/* Manual Backup Runner */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <Play size={16} className="text-emerald-500" />
                  <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-primary)]">
                    Manual Backup Snapshot
                  </h3>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Need to perform immediate database maintenance or migrations? Trigger a full database dump snapshot right now.
                </p>

                <button
                  onClick={handleTriggerBackup}
                  disabled={triggeringBackup}
                  className="w-full btn-brand bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white flex items-center justify-center gap-2 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {triggeringBackup ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Backing Up Database...</span>
                    </>
                  ) : (
                    <>
                      <Database size={14} />
                      <span>Trigger Backup Now</span>
                    </>
                  )}
                </button>
              </div>

              {/* Accounts User Data Retention */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <Trash2 size={16} className="text-rose-500" />
                  <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-primary)]">
                    User Data Retention Purges
                  </h3>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  To remain compliant with regulations (e.g. GDPR), users whose accounts are suspended or flagged for deletion are permanently scrubbed from all registries after N days.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Data Scrubbing Retention (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={retentionSettings.retentionPeriodDays}
                    onChange={(e) =>
                      setRetentionSettings({
                        ...retentionSettings,
                        retentionPeriodDays: e.target.value ? parseInt(e.target.value) : ""
                      })
                    }
                    className="input-styled font-mono font-bold"
                  />
                  <span className="text-[9px] font-semibold text-[var(--text-muted)] block mt-1">
                    💡 Purging Cron schedule is active daily at 1:00 AM.
                  </span>
                </div>
              </div>

              {/* Deployment Readiness Control */}
              <div className="card p-5 border-dashed border-rose-500/30 bg-rose-500/5 space-y-4">
                <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                  <ShieldAlert size={16} className="text-rose-500" />
                  <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-primary)]">
                    Production Deployment Prep
                  </h3>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Ready to deploy? Clear all mock logs, metrics, transactions, and standard user test accounts from the database. Only the admin account will remain.
                </p>

                <button
                  onClick={handleOpenDeployModal}
                  className="w-full btn-brand bg-rose-600 hover:bg-rose-700 border-rose-600 text-white flex items-center justify-center gap-2 py-2.5 text-xs font-bold cursor-pointer"
                >
                  <ShieldAlert size={14} />
                  <span>Prepare Database for Deployment</span>
                </button>
              </div>

            </div>
          </div>

          {/* Backup history table */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-indigo-500" />
                <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--text-primary)]">
                  Previous Backups & Recovery Points
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-[4px] bg-[var(--surface-3)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-secondary)]">
                {history.length} Logged Points
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Created At</th>
                    <th>File Name</th>
                    <th>Size</th>
                    <th>Type</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-xs text-[var(--text-muted)]">
                        No previous backups found in registry history database.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id}>
                        <td className="text-[10px] font-mono text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleString()}
                        </td>
                        <td className="font-mono text-xs max-w-xs truncate text-[var(--text-primary)]" title={item.fileName}>
                          {item.fileName}
                        </td>
                        <td className="font-mono text-xs text-[var(--text-secondary)]">
                          {formatBytes(item.size)}
                        </td>
                        <td className="text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-[var(--surface-3)] border border-[var(--border)] text-[9px] font-bold text-[var(--text-secondary)]">
                            {item.type}
                          </span>
                        </td>
                        <td className="text-xs font-semibold text-[var(--text-secondary)]">
                          {item.storageDestination}
                        </td>
                        <td>
                          {item.status === "SUCCESS" ? (
                            <span className="badge-income">
                              <CheckCircle2 size={10} /> {item.status}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold inline-flex items-center gap-1">
                              <XCircle size={10} /> {item.status}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            {/* Copy path or Download button */}
                            {item.status === "SUCCESS" && (
                              <>
                                {item.storageDestination === "S3" && item.filePathOrUrl ? (
                                  <a
                                    href={item.filePathOrUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary p-1 rounded hover:text-indigo-500 transition-colors flex items-center justify-center"
                                    title="Download backup dump from S3"
                                  >
                                    <Download size={13} />
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => copyToClipboard(item.filePathOrUrl, item.id)}
                                    className="btn-secondary p-1 rounded hover:text-indigo-500 transition-colors flex items-center justify-center cursor-pointer"
                                    title="Copy local backup directory filepath"
                                  >
                                    {copiedId === item.id ? (
                                      <Check size={13} className="text-emerald-500" />
                                    ) : (
                                      <Copy size={13} />
                                    )}
                                  </button>
                                )}

                                {/* Restore trigger point */}
                                <button
                                  onClick={() => handleOpenRestoreModal(item)}
                                  className="btn-secondary px-2 py-1 rounded text-[10px] font-bold hover:bg-amber-500/5 hover:border-amber-500/20 hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Restore database backup"
                                >
                                  <Lock size={10} />
                                  Restore
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Restore Recovery point secure password verification modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div
            className="card w-full max-w-md p-6 animate-scale-in"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
                <span>Confirm Database Restoration</span>
              </h3>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-md mb-4 text-xs font-semibold leading-relaxed flex gap-2">
              <AlertTriangle size={24} className="shrink-0 text-amber-500" />
              <div>
                <span className="font-bold">CRITICAL WARNING:</span> This action is highly destructive! The database will be completely rolled back to the backup state. Current transaction records will be overridden.
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="text-xs text-[var(--text-secondary)] space-y-1">
                <div>
                  <span className="font-bold text-[var(--text-primary)]">Target File:</span>{" "}
                  <span className="font-mono bg-[var(--surface-3)] px-1 rounded text-[11px] truncate inline-block max-w-[250px]" title={selectedBackup?.fileName}>
                    {selectedBackup?.fileName}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)]">Backup Date:</span>{" "}
                  <span>{new Date(selectedBackup?.timestamp).toLocaleString()}</span>
                </div>
                <div>
                  <span className="font-bold text-[var(--text-primary)]">File Size:</span>{" "}
                  <span>{formatBytes(selectedBackup?.size)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Input
                  label="Enter Session Security Password"
                  type="password"
                  placeholder="Verify admin password"
                  value={restorePassword}
                  onChange={(e) => setRestorePassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setShowRestoreModal(false)}
                className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                disabled={restoring}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="btn-brand bg-rose-600 hover:bg-rose-700 border-rose-600 text-white flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer"
              >
                {restoring ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Restoring Database...</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Verify & Restore Database</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Readiness verification modal */}
      {showDeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div
            className="card w-full max-w-md p-6 animate-scale-in"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldAlert size={16} className="text-rose-500 animate-pulse" />
                <span>Confirm Deployment Cleansing</span>
              </h3>
              <button
                onClick={() => setShowDeployModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <XCircle size={16} />
              </button>
            </div>

            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-md mb-4 text-xs font-semibold leading-relaxed flex gap-2">
              <AlertTriangle size={24} className="shrink-0 text-rose-500" />
              <div>
                <span className="font-bold">CRITICAL WARNING:</span> This action will wipe all standard users, expenses, incomes, budgets, categories, support tickets, fraud reports, and logs from the database, leaving ONLY the administrator account (`shelakemahesh024@gmail.com`) and default configurations.
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <p className="text-xs text-[var(--text-secondary)]">
                Please verify your administrative credentials to authorize this cleanup process.
              </p>
              <div className="pt-2">
                <Input
                  label="Enter Administrative Password"
                  type="password"
                  placeholder="Verify admin password"
                  value={deployPassword}
                  onChange={(e) => setDeployPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => setShowDeployModal(false)}
                className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                disabled={preparingDeploy}
              >
                Cancel
              </button>
              <button
                onClick={handlePrepareDeploy}
                disabled={preparingDeploy}
                className="btn-brand bg-rose-600 hover:bg-rose-700 border-rose-600 text-white flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold cursor-pointer"
              >
                {preparingDeploy ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Wiping Raw Data...</span>
                  </>
                ) : (
                  <>
                    <Lock size={13} />
                    <span>Confirm Ready to Deploy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBackup;
