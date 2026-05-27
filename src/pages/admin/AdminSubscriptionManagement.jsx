import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender 
} from "@tanstack/react-table";
import { 
  Users, CreditCard, ArrowUpRight, ArrowDownRight, 
  RefreshCw, Loader2, Play, Database, Settings, History, Activity, Check, X, ShieldAlert
} from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const AdminSubscriptionManagement = () => {
  const [activeTab, setActiveTab] = useState("manual"); // "manual" | "stripe"
  const [dashboard, setDashboard] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [manualRequests, setManualRequests] = useState([]);
  
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  
  const [loading, setLoading] = useState(true);
  const [loadingManual, setLoadingManual] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  
  // Modals & Drawers
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [changingPlan, setChangingPlan] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_SUBSCRIPTIONS_DASHBOARD);
      setDashboard(response.data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_SUBSCRIPTIONS, {
        params: { page, size: pageSize }
      });
      if (response.data) {
        setSubscriptions(response.data.content || []);
        setTotalCount(response.data.totalElements || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  const fetchManualRequests = useCallback(async () => {
    setLoadingManual(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_SUBSCRIPTION_REQUESTS);
      if (response.data) {
        setManualRequests(response.data || []);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load manual payment requests.");
    } finally {
      setLoadingManual(false);
    }
  }, []);

  const fetchPlans = useCallback(async () => {
    setLoadingPlans(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_SUBSCRIPTIONS_PLANS);
      setPlans(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchPlans();
    if (activeTab === "stripe") {
      fetchSubscriptions();
    } else {
      fetchManualRequests();
    }
  }, [activeTab, fetchDashboard, fetchSubscriptions, fetchManualRequests, fetchPlans]);

  const handleApproveManual = async (id) => {
    setActioningId(id);
    try {
      const res = await axiosConfig.post(API_ENDPOINTS.ADMIN_APPROVE_SUBSCRIPTION(id));
      toast.success(res.message || "Manual payment request approved and plan activated!");
      fetchManualRequests();
      fetchDashboard();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve manual subscription.");
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectManual = async (id) => {
    setActioningId(id);
    try {
      const res = await axiosConfig.post(API_ENDPOINTS.ADMIN_REJECT_SUBSCRIPTION(id));
      toast.success(res.message || "Manual payment request rejected.");
      fetchManualRequests();
      fetchDashboard();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject manual subscription.");
    } finally {
      setActioningId(null);
    }
  };

  const fetchPaymentHistory = useCallback(async (userId) => {
    setLoadingHistory(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_SUBSCRIPTIONS_PAYMENTS(userId));
      setPaymentHistory(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const openHistory = useCallback((userSub) => {
    setSelectedUser(userSub);
    setIsHistoryDrawerOpen(true);
    fetchPaymentHistory(userSub.user.id);
  }, [fetchPaymentHistory]);

  const openChangePlan = useCallback((userSub) => {
    setSelectedUser(userSub);
    setSelectedPlanId(userSub.plan?.id || "");
    setIsChangePlanModalOpen(true);
  }, []);

  const handleChangePlan = async () => {
    if (!selectedPlanId) return;
    setChangingPlan(true);
    try {
      await axiosConfig.post(`${API_ENDPOINTS.ADMIN_SUBSCRIPTIONS_CHANGE_PLAN}?userId=${selectedUser.user.id}&planId=${selectedPlanId}`);
      toast.success("Subscription plan updated successfully.");
      setIsChangePlanModalOpen(false);
      fetchSubscriptions();
      fetchDashboard();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update subscription.");
    } finally {
      setChangingPlan(false);
    }
  };

  const handleExportCSV = () => {
    toast.success("Exporting subscribers list to CSV...");
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'user.email',
      header: 'Subscriber',
      cell: (info) => (
        <div>
          <p className="font-bold text-xs text-[var(--text-primary)]">{info.row.original.user?.fullName}</p>
          <p className="text-[10px] text-[var(--text-muted)] font-mono">{info.getValue()}</p>
        </div>
      )
    },
    {
      accessorKey: 'plan.name',
      header: 'Plan Tier',
      cell: (info) => {
        const planName = info.getValue();
        let colorClass = "bg-gray-500/10 text-gray-500";
        if (planName === 'Pro') colorClass = "bg-purple-500/10 text-purple-500 border-purple-500/20 border";
        if (planName === 'Enterprise') colorClass = "bg-rose-500/10 text-rose-500 border-rose-500/20 border";
        return <span className={`text-[10px] font-bold px-2 py-1 rounded-[4px] ${colorClass}`}>{planName || 'None'}</span>;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        return (
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {status}
          </span>
        );
      }
    },
    {
      accessorKey: 'renewalDate',
      header: 'Renewal Date',
      cell: (info) => <span className="text-xs font-mono text-[var(--text-secondary)]">{info.getValue() ? new Date(info.getValue()).toLocaleDateString("en-IN") : 'N/A'}</span>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => openHistory(row.original)}
            className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <History size={11} />
            <span>Ledger</span>
          </button>
          <button 
            onClick={() => openChangePlan(row.original)}
            className="btn-brand py-1 px-2 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Settings size={11} />
            <span>Manage Plan</span>
          </button>
        </div>
      )
    }
  ], [openHistory, openChangePlan]);

  const table = useReactTable({
    data: subscriptions,
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
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Subscription Management</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Approve manual UPI payments, monitor recurring revenue, and manage billing plans</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportCSV}
            className="btn-secondary px-3 py-2 rounded-[var(--radius-sm)] text-xs font-bold cursor-pointer"
          >
            Export to CSV
          </button>
          <button 
            onClick={() => setIsPlanModalOpen(true)}
            className="btn-brand px-3 py-2 rounded-[var(--radius-sm)] text-xs font-bold cursor-pointer"
          >
            Manage Master Plans
          </button>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
            <Users size={14} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Active Subscribers</h3>
          </div>
          <p className="text-2xl font-black text-[var(--text-primary)]">{dashboard?.activeSubscribers || 0}</p>
        </div>
        <div className="card p-4 flex flex-col justify-between bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/10">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <CreditCard size={14} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Monthly Recurring (MRR)</h3>
          </div>
          <p className="text-2xl font-black text-emerald-500 drop-shadow-sm">₹{(dashboard?.mrr || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
            <Database size={14} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Churn Rate</h3>
          </div>
          <p className="text-2xl font-black text-rose-500">{(dashboard?.churnRate || 0).toFixed(1)}%</p>
        </div>
        <div className="card p-4 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-[var(--text-muted)] mb-2">
            <Activity size={14} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Movements</h3>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex items-center gap-1 text-emerald-500">
              <ArrowUpRight size={14} />
              <span className="text-sm font-bold">{dashboard?.upgradeCount || 0}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-500">
              <ArrowDownRight size={14} />
              <span className="text-sm font-bold">{dashboard?.downgradeCount || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        <button
          onClick={() => setActiveTab("manual")}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === "manual"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Manual UPI Requests ({manualRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("stripe")}
          className={`px-4 py-2 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
            activeTab === "stripe"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Stripe Subscribers
        </button>
      </div>

      {/* Subscriptions Grid & Manual requests table */}
      <div className="card overflow-hidden">
        {activeTab === "manual" ? (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr className="border-b border-[var(--border)] text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
                  <th className="py-2.5 px-4 font-bold text-left">Subscriber</th>
                  <th className="py-2.5 px-4 font-bold text-left">Plan Type</th>
                  <th className="py-2.5 px-4 font-bold text-left">Amount</th>
                  <th className="py-2.5 px-4 font-bold text-left">Transaction ID (UTR)</th>
                  <th className="py-2.5 px-4 font-bold text-left">Submitted At</th>
                  <th className="py-2.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)] font-medium text-xs">
                {loadingManual ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                      <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[var(--text-secondary)]" />
                      <span className="text-xs font-medium">Scanning UPI ledger logs...</span>
                    </td>
                  </tr>
                ) : manualRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)] font-semibold">
                      No pending payment requests.
                    </td>
                  </tr>
                ) : (
                  manualRequests.map(req => (
                    <tr key={req.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-bold text-xs text-[var(--text-primary)]">{req.user?.fullName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{req.user?.email}</p>
                          <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{req.user?.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          {req.planType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[var(--text-primary)]">₹{req.amount}</td>
                      <td className="py-3 px-4 font-mono font-bold text-xs tracking-wider text-[var(--text-primary)]">{req.transactionId}</td>
                      <td className="py-3 px-4 text-[10px] text-[var(--text-muted)]">
                        {new Date(req.submittedAt).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleRejectManual(req.id)}
                            disabled={actioningId === req.id}
                            className="p-1 rounded-md text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 text-[10px] px-2"
                            title="Reject Payment"
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => handleApproveManual(req.id)}
                            disabled={actioningId === req.id}
                            className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 text-[10px] px-2 font-bold"
                            title="Approve & Activate PRO"
                          >
                            {actioningId === req.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                            <span>Approve</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
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
                      <span className="text-xs font-medium">Scanning subscription registries...</span>
                    </td>
                  </tr>
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center font-semibold text-xs text-[var(--text-muted)]">
                      No subscriptions found.
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
        )}

        {/* Pagination controls for Stripe Tab */}
        {activeTab === "stripe" && totalPages > 1 && (
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

      {/* Change Plan Modal */}
      {isChangePlanModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-sm p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border)] pb-3">
              Manage Subscription Tier
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Select a new plan for <span className="font-bold">{selectedUser.user?.email}</span>. This will override existing Stripe mandates.
            </p>
            <div className="space-y-3 mb-6">
              {loadingPlans ? (
                <div className="flex justify-center"><Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /></div>
              ) : (
                plans.map(plan => (
                  <label key={plan.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-md cursor-pointer hover:bg-[var(--surface-2)]">
                    <div className="flex items-center gap-3">
                       <input 
                        type="radio" 
                        name="planSelection" 
                        value={plan.id}
                        checked={selectedPlanId === plan.id}
                        onChange={() => setSelectedPlanId(plan.id)}
                        className="accent-purple-500"
                      />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{plan.name}</span>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-secondary)]">₹{plan.price}/{plan.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                  </label>
                ))
              )}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button
                onClick={() => setIsChangePlanModalOpen(false)}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePlan}
                disabled={changingPlan}
                className="btn-brand px-4 py-2 text-xs font-bold flex items-center gap-2"
              >
                {changingPlan && <Loader2 size={13} className="animate-spin" />}
                <span>Confirm Change</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Drawer */}
      <AnimatePresence>
        {isHistoryDrawerOpen && selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryDrawerOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight">Payment Ledger</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{selectedUser.user?.email}</p>
                </div>
                <button
                  onClick={() => setIsHistoryDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-[var(--surface-2)]">
                {loadingHistory ? (
                  <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-10 text-xs font-semibold text-[var(--text-muted)]">No payment history recorded.</div>
                ) : (
                  <div className="space-y-3">
                    {paymentHistory.map(ph => (
                      <div key={ph.id} className="card p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-[var(--text-primary)]">₹{ph.amount.toLocaleString("en-IN")}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${ph.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {ph.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
                          <span className="font-mono">{new Date(ph.paymentDate).toLocaleString("en-IN")}</span>
                          <span className="font-mono text-[var(--text-muted)]">{ph.stripeInvoiceId || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage Plans Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-lg p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 border-b border-[var(--border)] pb-3">
              Manage Master Plans
            </h3>
            <div className="space-y-4 mb-6">
              {loadingPlans ? (
                 <div className="flex justify-center"><Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /></div>
              ) : plans.map(plan => (
                <div key={plan.id} className="p-4 border border-[var(--border)] rounded-md bg-[var(--surface-2)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{plan.name}</span>
                    <span className="text-xs font-mono font-bold text-emerald-500">₹{plan.price} / {plan.billingCycle}</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] font-mono">{plan.features}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <button onClick={() => setIsPlanModalOpen(false)} className="btn-brand px-4 py-2 text-xs font-bold cursor-pointer">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubscriptionManagement;
