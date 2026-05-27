import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from "@tanstack/react-table";
import { 
  Send, Mail, Bell, Smartphone, Clock, Settings, RefreshCw, Loader2, CheckCircle, XCircle
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";

const AdminNotificationManagement = () => {
  const [activeTab, setActiveTab] = useState("compose"); // "compose", "logs", "templates"
  
  // Compose State
  const [type, setType] = useState("EMAIL");
  const [recipientType, setRecipientType] = useState("ALL");
  const [recipientValue, setRecipientValue] = useState("");
  const [subject, setSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);

  // Logs State
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS_LOGS, {
        params: { page, size: pageSize }
      });
      if (response.data) {
        setLogs(response.data.content || []);
        setTotalCount(response.data.totalElements || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch notification logs");
    } finally {
      setLoadingLogs(false);
    }
  }, [page, pageSize]);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_NOTIFICATIONS_TEMPLATES);
      setTemplates(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch templates");
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    } else if (activeTab === "templates") {
      fetchTemplates();
    }
  }, [activeTab, fetchLogs, fetchTemplates]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject || !messageBody) {
      toast.error("Subject and Body are required.");
      return;
    }
    
    setSending(true);
    try {
      const payload = {
        type,
        recipientType,
        recipientValue: recipientType === "ALL" ? "ALL" : recipientValue,
        subject,
        messageBody,
        scheduledAt: isScheduled && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      };
      
      await axiosConfig.post(API_ENDPOINTS.ADMIN_NOTIFICATIONS_SEND, payload);
      toast.success("Notification queued for delivery.");
      
      // Reset form
      setSubject("");
      setMessageBody("");
      setRecipientValue("");
      setIsScheduled(false);
      setScheduledAt("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to queue notification.");
    } finally {
      setSending(false);
    }
  };

  // Table Columns for Logs
  const columns = useMemo(() => [
    {
      accessorKey: 'type',
      header: 'Channel',
      cell: (info) => {
        const t = info.getValue();
        return (
          <div className="flex items-center gap-1.5">
            {t === 'EMAIL' ? <Mail size={12} className="text-blue-500" /> : 
             t === 'PUSH' ? <Smartphone size={12} className="text-purple-500" /> : 
             <Bell size={12} className="text-amber-500" />}
            <span className="text-[10px] font-bold">{t}</span>
          </div>
        );
      }
    },
    {
      accessorKey: 'subject',
      header: 'Subject / Payload',
      cell: (info) => (
        <div>
          <p className="font-bold text-xs text-[var(--text-primary)] truncate max-w-[200px]">{info.getValue()}</p>
        </div>
      )
    },
    {
      accessorKey: 'recipientType',
      header: 'Audience',
      cell: (info) => {
        const rt = info.getValue();
        const rv = info.row.original.recipientValue;
        return (
          <div className="text-[10px] text-[var(--text-secondary)] font-medium">
            {rt === 'ALL' ? 'Global Broadcast' : `${rt}: ${rv}`}
          </div>
        );
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const s = info.getValue();
        if (s === 'DELIVERED') return <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm w-max text-[10px] font-black"><CheckCircle size={10} /> DELIVERED</span>;
        if (s === 'FAILED') return <span className="flex items-center gap-1 text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-sm w-max text-[10px] font-black"><XCircle size={10} /> FAILED</span>;
        return <span className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-sm w-max text-[10px] font-black"><Clock size={10} /> PENDING</span>;
      }
    },
    {
      accessorKey: 'scheduledAt',
      header: 'Scheduled For',
      cell: (info) => <span className="text-[10px] font-mono text-[var(--text-muted)]">{info.getValue() ? new Date(info.getValue()).toLocaleString("en-IN") : 'Immediate'}</span>
    },
  ], []);

  const table = useReactTable({
    data: logs,
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
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Notification Gateway</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage Firebase FCM, SendGrid emails, and in-app alerts</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setActiveTab("compose")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === "compose" ? "border-purple-500 text-purple-500" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Compose & Send
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1 ${activeTab === "logs" ? "border-purple-500 text-purple-500" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          Delivery Logs
          {activeTab === "logs" && loadingLogs && <Loader2 size={10} className="animate-spin ml-1" />}
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors ${activeTab === "templates" ? "border-purple-500 text-purple-500" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
        >
          System Templates
        </button>
      </div>

      {activeTab === "compose" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="card p-6">
              <form onSubmit={handleSend} className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Delivery Channel</label>
                    <select 
                      value={type} 
                      onChange={(e) => setType(e.target.value)}
                      className="input-styled w-full text-xs font-bold"
                    >
                      <option value="EMAIL">Email (SendGrid)</option>
                      <option value="PUSH">Push (Firebase FCM)</option>
                      <option value="IN_APP">In-App Alert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Target Audience</label>
                    <select 
                      value={recipientType} 
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="input-styled w-full text-xs font-bold"
                    >
                      <option value="ALL">All Users (Broadcast)</option>
                      <option value="ROLE">Specific Role</option>
                      <option value="SPECIFIC">Specific User (Email)</option>
                    </select>
                  </div>
                </div>

                {recipientType !== "ALL" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">
                      {recipientType === 'ROLE' ? 'Role Name (e.g. ROLE_USER)' : 'User Email Address'}
                    </label>
                    <input 
                      type="text" 
                      value={recipientValue}
                      onChange={(e) => setRecipientValue(e.target.value)}
                      className="input-styled w-full text-xs"
                      placeholder={recipientType === 'ROLE' ? 'ROLE_USER' : 'user@example.com'}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Subject Line</label>
                  <input 
                    type="text" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input-styled w-full text-xs"
                    placeholder="Enter notification subject"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[var(--text-muted)]">Message Body (Supports basic HTML/Markdown via parser in app)</label>
                  <textarea 
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="input-styled w-full text-xs min-h-[150px] resize-y"
                    placeholder="Type your message here..."
                    required
                  />
                </div>
                
                <div className="bg-[var(--surface-2)] border border-[var(--border)] p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isScheduled} 
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[var(--text-primary)]">Schedule for later</span>
                  </label>
                  
                  {isScheduled && (
                    <input 
                      type="datetime-local" 
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      className="input-styled text-xs py-1.5"
                      required
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                  <button 
                    type="submit" 
                    disabled={sending}
                    className="btn-brand px-6 py-2.5 text-xs font-bold flex items-center gap-2"
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{isScheduled ? 'Queue Notification' : 'Dispatch Now'}</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
          
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5 bg-purple-500/5 border-purple-500/20">
              <h3 className="text-xs font-bold text-purple-500 flex items-center gap-2 mb-2">
                <Settings size={14} />
                Delivery Engine Info
              </h3>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                The gateway utilizes a persistent polling mechanism running on the Spring Boot backend. 
                Pending notifications are picked up every 30 seconds.
              </p>
              <ul className="text-[10px] text-[var(--text-muted)] mt-3 space-y-1 list-disc list-inside">
                <li>Automatic retry logic (up to 3 times).</li>
                <li>Simulated external bridging enabled.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === "logs" && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[var(--text-primary)]">Outbound Dispatch Queue</h3>
            <button onClick={fetchLogs} className="btn-secondary p-1.5 rounded text-[var(--text-muted)] hover:text-purple-500">
              <RefreshCw size={14} className={loadingLogs ? "animate-spin" : ""} />
            </button>
          </div>
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
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-xs text-[var(--text-muted)] font-medium">
                      No dispatch logs found.
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
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-[var(--border)] bg-[var(--surface-2)]">
              <div className="text-xs text-[var(--text-muted)] font-medium">
                Page <span className="font-bold text-[var(--text-primary)]">{page + 1}</span> of <span className="font-bold text-[var(--text-primary)]">{totalPages}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loadingTemplates ? (
            <div className="col-span-full py-12 flex justify-center"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
          ) : templates.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-[var(--text-muted)]">No system templates found.</div>
          ) : (
            templates.map(template => (
              <div key={template.id} className="card p-5 flex flex-col h-full">
                <div className="mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-sm">
                    {template.eventName}
                  </span>
                </div>
                <div className="space-y-3 flex-1">
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">Subject Template</label>
                    <input 
                      type="text" 
                      defaultValue={template.subjectTemplate}
                      className="input-styled w-full text-xs font-medium" 
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[var(--text-muted)] mb-1">Body Template</label>
                    <textarea 
                      defaultValue={template.bodyTemplate}
                      className="input-styled w-full text-xs min-h-[80px]" 
                      readOnly
                    />
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-[var(--border)] flex justify-end">
                  <button className="btn-secondary px-3 py-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                    Edit Template
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default AdminNotificationManagement;
