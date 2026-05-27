import { useState, useEffect, useCallback } from "react";
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Folder, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";

const AdminReports = () => {
  const [reportType, setReportType] = useState("FINANCIAL_SUMMARY");
  const [format, setFormat] = useState("PDF");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userId, setUserId] = useState("");
  const [category, setCategory] = useState("");
  
  // History and Loading
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // Generation Progress states
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_REPORTS_HISTORY);
      setHistory(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch report history.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.error("Please select a valid date range.");
      return;
    }

    setGenerating(true);
    setProgress(10);
    setProgressMessage("Initiating request...");

    // Simulated progress timer
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 30) {
          setProgressMessage("Compiling ledger entries...");
          return prev + Math.floor(Math.random() * 5) + 2;
        } else if (prev < 65) {
          setProgressMessage("Assembling financial data grids...");
          return prev + Math.floor(Math.random() * 4) + 1;
        } else if (prev < 88) {
          setProgressMessage("Rendering report document templates...");
          return prev + Math.floor(Math.random() * 3) + 1;
        } else if (prev < 96) {
          setProgressMessage("Wrapping up binary package...");
          return prev + 1;
        }
        return prev;
      });
    }, 150);

    try {
      const payload = {
        type: reportType,
        format,
        fromDate,
        toDate,
        userId: userId ? parseInt(userId, 10) : null,
        category: category || null
      };

      await axiosConfig.post(API_ENDPOINTS.ADMIN_REPORTS_GENERATE, payload);
      
      clearInterval(progressInterval);
      setProgress(100);
      setProgressMessage("Report ready for download!");
      toast.success("Report generated successfully!");
      
      setTimeout(() => {
        setGenerating(false);
        setProgress(0);
        setProgressMessage("");
        fetchHistory();
      }, 1000);
      
    } catch (error) {
      clearInterval(progressInterval);
      setGenerating(false);
      setProgress(0);
      setProgressMessage("");
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to generate report.");
    }
  };

  const handleDownload = async (report) => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_REPORTS_DOWNLOAD(report.id), {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: report.format.toUpperCase() === "PDF" ? "application/pdf" : "text/csv"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.fileName || `report_${report.id}.${report.format.toLowerCase()}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Downloaded: ${report.fileName}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download report file.");
    }
  };

  const getFormatIcon = (fmt) => {
    if (fmt?.toUpperCase() === "PDF") {
      return <FileText size={16} className="text-rose-500" />;
    }
    return <FileSpreadsheet size={16} className="text-emerald-500" />;
  };

  const formatReportTypeLabel = (type) => {
    return type?.replace(/_/g, " ") || "";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Reports & Exports</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-medium">Generate financial diagnostics, compliance sheets, and ledger audits</p>
        </div>
        <button 
          onClick={fetchHistory}
          disabled={loadingHistory}
          className="btn-secondary p-2 rounded-[var(--radius-sm)] flex items-center justify-center cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingHistory ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Form */}
        <div className="card p-5 lg:col-span-1 h-max">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FileText size={16} className="text-[var(--text-secondary)]" />
            <span>Generate Custom Report</span>
          </h2>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Report Registry Type</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)}
                className="input-styled"
                required
              >
                <option value="FINANCIAL_SUMMARY">Financial Summary Audit</option>
                <option value="USER_ACTIVITY">User Registration & Actions</option>
                <option value="TRANSACTION_AUDIT">Transaction Flow Audit</option>
                <option value="BUDGET_COMPLIANCE">Budget Overrun Compliance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">From Date</label>
                <input 
                  type="date" 
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="input-styled text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">To Date</label>
                <input 
                  type="date" 
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="input-styled text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1">Output Format</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                  <input 
                    type="radio" 
                    name="format" 
                    value="PDF" 
                    checked={format === "PDF"} 
                    onChange={() => setFormat("PDF")}
                    className="accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span>PDF Document</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                  <input 
                    type="radio" 
                    name="format" 
                    value="CSV" 
                    checked={format === "CSV"} 
                    onChange={() => setFormat("CSV")}
                    className="accent-neutral-900 dark:accent-neutral-100"
                  />
                  <span>Streamed CSV</span>
                </label>
              </div>
            </div>

            <hr className="border-[var(--border)] my-2" />

            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <User size={10} /> 
                <span>Target User ID (Optional)</span>
              </label>
              <input 
                type="number" 
                placeholder="e.g. 42" 
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="input-styled text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
                <Folder size={10} /> 
                <span>Category Node (Optional)</span>
              </label>
              <input 
                type="text" 
                placeholder="e.g. Food, Travel" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-styled text-xs"
              />
            </div>

            <button 
              type="submit" 
              disabled={generating}
              className="w-full btn-brand py-2 text-xs font-bold flex items-center justify-center gap-1.5 mt-2"
            >
              {generating ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FileText size={13} />
                  <span>Execute Compilation</span>
                </>
              )}
            </button>
          </form>

          {/* Progressive Progress Loader */}
          {generating && (
            <div className="mt-5 p-4 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[var(--text-secondary)]">{progressMessage}</span>
                <span className="font-black text-[var(--text-primary)]">{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* History Grid */}
        <div className="card p-5 lg:col-span-2 flex flex-col min-h-[450px]">
          <h2 className="text-sm font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-[var(--text-secondary)]" />
            <span>Generated Reports Ledger</span>
          </h2>

          <div className="flex-1 overflow-x-auto">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-2">
                <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
                <span className="text-xs font-medium text-[var(--text-secondary)]">Loading history...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                <FileText size={32} className="text-[var(--text-muted)] opacity-40" />
                <p className="text-xs font-bold text-[var(--text-secondary)]">No reports found</p>
                <p className="text-[10px] text-[var(--text-muted)] max-w-xs">Use the left configuration panel to run a data query and generate structured tables.</p>
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Report Type</th>
                    <th>Format</th>
                    <th>Date Scope</th>
                    <th>Compiled By</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <div>
                          <p className="font-bold text-xs text-[var(--text-primary)] leading-tight capitalize">
                            {formatReportTypeLabel(report.reportType)}
                          </p>
                          <p className="text-[9px] font-mono text-[var(--text-muted)] mt-0.5">
                            ID: #{report.id} • {report.fileName || "Auto-run Monthly"}
                          </p>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold">
                          {getFormatIcon(report.format)}
                          {report.format}
                        </span>
                      </td>
                      <td>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                          {report.dateRangeFrom} to {report.dateRangeTo}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-[var(--text-secondary)]">
                          {report.generatedBy || "SYSTEM"}
                        </span>
                      </td>
                      <td>
                        {report.status === "COMPLETED" ? (
                          <span className="px-2 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 size={10} /> Done
                          </span>
                        ) : report.status === "FAILED" ? (
                          <span className="px-2 py-0.5 rounded-[4px] bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold flex items-center gap-1 w-max">
                            <AlertCircle size={10} /> Failed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold flex items-center gap-1 w-max animate-pulse">
                            <Loader2 size={10} className="animate-spin" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDownload(report)}
                          disabled={report.status !== "COMPLETED"}
                          className="btn-secondary py-1 px-2 text-[10px] inline-flex items-center gap-1 disabled:opacity-40"
                          title="Download Compilation"
                        >
                          <Download size={10} />
                          <span>Fetch File</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
