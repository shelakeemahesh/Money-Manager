import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axiosConfig.get(`${API_ENDPOINTS.ADMIN_AUDIT_LOGS}?size=100`);
      setLogs(response.data.content || []);
    } catch {
      toast.error("Failed to fetch audit logs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>Security Trail</h1>
          <p className="text-xs mt-0.5 font-medium" style={{ color: "var(--text-muted)" }}>Audit logging node tracking administrative inputs</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="btn-secondary px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh trail</span>
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Security Epoch</th>
                <th>Operator</th>
                <th>Action Payload</th>
                <th>Audit Details</th>
                <th>Network IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[var(--text-secondary)]" />
                    <span className="text-xs font-medium">Analyzing operational trail logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center font-semibold text-xs" style={{ color: "var(--text-muted)" }}>
                    No security operations recorded on this cycle.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="font-mono text-[10px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="font-bold whitespace-nowrap text-xs" style={{ color: "var(--text-primary)" }}>
                      {log.admin?.email}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="px-2 py-0.5 border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-primary)] rounded-[4px] text-[10px] font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                      {log.details}
                    </td>
                    <td className="font-mono text-[10px] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {log.ipAddress || "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
