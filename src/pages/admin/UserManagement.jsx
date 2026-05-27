import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, Ban, CheckCircle, Clock, Trash2, ShieldCheck, ShieldAlert, Award, User, RefreshCw, X, Eye, Lock, Unlock, Key } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import { toast } from "sonner";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchInput from "../../components/common/SearchInput";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Get current logged-in user to check roles in frontend
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = currentUser.role === "ADMIN";

  // Action Modals State
  const [selectedUser, setSelectedUser] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("USER");
  const [updatingRole, setUpdatingRole] = useState(false);

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_USERS, {
        params: {
          page,
          size: pageSize,
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
        }
      });
      // Backend returns `{ users[], totalCount, page, pageSize }` inside `.data`
      // axiosConfig extracts `.data` and maps to response.data directly
      if (response.data) {
        setUsers(response.data.users || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setUsers([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateStatus = async () => {
    if (!statusReason.trim()) {
      toast.error("Audit reason is required");
      return;
    }

    setUpdatingStatus(true);
    try {
      await axiosConfig.put(`${API_ENDPOINTS.ADMIN_USERS}/${selectedUser.id}/status`, {
        status: newStatus,
        reason: statusReason
      });
      toast.success(`Account status updated to ${newStatus}`);
      setShowStatusModal(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateRole = async () => {
    setUpdatingRole(true);
    try {
      await axiosConfig.put(`${API_ENDPOINTS.ADMIN_USERS}/${selectedUser.id}/role`, {
        role: selectedRole
      });
      toast.success(`Role updated to ${selectedRole} successfully`);
      setShowRoleModal(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update user role");
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleToggleVerification = async (userId) => {
    try {
      await axiosConfig.put(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/verify`);
      toast.success("User verification badge toggled");
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update verification status");
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      await axiosConfig.put(`${API_ENDPOINTS.ADMIN_USERS}/${userId}/toggle-active`);
      toast.success("User login active status toggled successfully");
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update login status");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setResettingPassword(true);
    try {
      await axiosConfig.put(`${API_ENDPOINTS.ADMIN_USERS}/${selectedUser.id}/reset-password`, {
        password: newPassword
      });
      toast.success("Password reset successfully");
      setShowResetPasswordModal(false);
      setNewPassword("");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (!isAdmin) {
      toast.error("Access denied: Only Administrators can delete users.");
      setDeleteTarget(null);
      return;
    }
    setDeletingUser(true);
    try {
      await axiosConfig.delete(`${API_ENDPOINTS.ADMIN_USERS}/${deleteTarget.id}`);
      toast.success("User account deleted successfully");
      setDeleteTarget(null);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Only administrators are authorized to delete users.");
    } finally {
      setDeletingUser(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <span className="badge-income">Active</span>;
      case "INACTIVE":
        return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-500 border border-gray-500/20 rounded-[4px] text-[10px] font-semibold">Inactive</span>;
      case "SUSPENDED":
        return <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-[4px] text-[10px] font-semibold">Suspended</span>;
      case "BANNED":
        return <span className="badge-expense">Banned</span>;
      default:
        return <span className="badge-income">Active</span>;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return <span className="px-2 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-[4px] text-[10px] font-bold tracking-tight inline-flex items-center gap-1"><User size={11} /> Admin</span>;
      default:
        return <span className="px-2 py-0.5 bg-[var(--surface-3)] text-[var(--text-secondary)] border border-[var(--border)] rounded-[4px] text-[10px] font-medium inline-flex items-center gap-1">User</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* Header Viewport */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Platform Operators</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Manage user status settings, security privileges, and verification metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="input-styled w-full sm:w-36 appearance-none py-2 pr-8 text-xs font-semibold"
            style={{ 
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
              backgroundPosition: 'right 0.75rem center', 
              backgroundSize: '1.25rem', 
              backgroundRepeat: 'no-repeat' 
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>

          {/* Role filter */}
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
            className="input-styled w-full sm:w-36 appearance-none py-2 pr-8 text-xs font-semibold"
            style={{ 
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
              backgroundPosition: 'right 0.75rem center', 
              backgroundSize: '1.25rem', 
              backgroundRepeat: 'no-repeat' 
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <SearchInput
            placeholder="Search email, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            wrapperClass="w-full sm:w-56"
          />

          <button 
            onClick={fetchUsers}
            className="btn-secondary p-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-3)] transition-colors cursor-pointer"
            title="Force Reload Registries"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Users table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Account Email</th>
                <th>Phone Number</th>
                <th>Privilege Role</th>
                <th>Status Flag</th>
                <th>Access Lock</th>
                <th>Join Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <Loader2 size={20} className="animate-spin mx-auto mb-2 text-[var(--text-secondary)]" />
                    <span className="text-xs font-medium">Analyzing user directories...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center font-semibold text-xs" style={{ color: "var(--text-muted)" }}>
                    No users match current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td className="font-mono text-[10px] text-[var(--text-muted)]">#{user.id}</td>
                    <td>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[var(--text-primary)]">
                        <span>{user.fullName}</span>
                        {user.isVerified && (
                          <div className="text-blue-500" title="Verified Account">
                            <Award size={13} className="fill-blue-500/10" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">{user.email}</td>
                    <td className="font-mono text-xs text-[var(--text-secondary)]">{user.phoneNumber || "-"}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      {user.isActive ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-[4px] text-[10px] font-semibold">Allowed</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-[4px] text-[10px] font-semibold">Locked</span>
                      )}
                    </td>
                    <td className="font-mono text-[10px] text-[var(--text-muted)]">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View profile drawer */}
                        <button
                          onClick={() => { setSelectedUser(user); setShowProfileModal(true); }}
                          className="p-1.5 text-blue-500 hover:bg-blue-500/5 border border-transparent hover:border-blue-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                          title="View Profile Payload"
                        >
                          <Eye size={13} />
                        </button>
                        
                        {/* Toggle active / Block status */}
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className={`p-1.5 ${user.isActive ? "text-amber-600 hover:bg-amber-600/5 border-transparent hover:border-amber-600/10" : "text-emerald-500 hover:bg-emerald-500/5 border-transparent hover:border-emerald-500/10"} border rounded-[var(--radius-sm)] transition-all cursor-pointer`}
                          title={user.isActive ? "Block/Lock User login" : "Unblock/Unlock User login"}
                        >
                          {user.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                        </button>

                        {/* Reset password by Admin */}
                        <button
                          onClick={() => { setSelectedUser(user); setNewPassword(""); setShowResetPasswordModal(true); }}
                          className="p-1.5 text-orange-500 hover:bg-orange-500/5 border border-transparent hover:border-orange-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                          title="Reset Password"
                        >
                          <Key size={13} />
                        </button>

                        {/* Verification toggle */}
                        <button
                          onClick={() => handleToggleVerification(user.id)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-500/5 border border-transparent hover:border-indigo-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                          title="Toggle Verification Badge"
                        >
                          <Award size={13} />
                        </button>

                        {/* Change role */}
                        <button
                          onClick={() => { setSelectedUser(user); setSelectedRole(user.role || "USER"); setShowRoleModal(true); }}
                          className="p-1.5 text-purple-500 hover:bg-purple-500/5 border border-transparent hover:border-purple-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                          title="Assign Security Role"
                        >
                          <ShieldCheck size={13} />
                        </button>

                        {/* Status controls */}
                        {user.status === "ACTIVE" && (
                          <>
                            <button 
                              onClick={() => { setSelectedUser(user); setNewStatus("INACTIVE"); setStatusReason(""); setShowStatusModal(true); }}
                              className="p-1.5 text-gray-500 hover:bg-gray-500/5 border border-transparent hover:border-gray-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                              title="Deactivate Account"
                            >
                              <Ban size={13} />
                            </button>
                            <button 
                              onClick={() => { setSelectedUser(user); setNewStatus("SUSPENDED"); setStatusReason(""); setShowStatusModal(true); }}
                              className="p-1.5 text-amber-500 hover:bg-amber-500/5 border border-transparent hover:border-amber-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                              title="Suspend Account"
                            >
                              <Clock size={13} />
                            </button>
                          </>
                        )}

                        {user.status !== "ACTIVE" && (
                          <button 
                            onClick={() => { setSelectedUser(user); setNewStatus("ACTIVE"); setStatusReason(""); setShowStatusModal(true); }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/10 rounded-[var(--radius-sm)] transition-all cursor-pointer"
                            title="Activate Account"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}

                        {/* Delete User (RBAC restricted to administrator) */}
                        <button 
                          onClick={() => setDeleteTarget(user)}
                          className={`p-1.5 ${isAdmin ? "text-rose-500 hover:bg-rose-500/5" : "text-rose-300 dark:text-rose-950 opacity-40 cursor-not-allowed"} border border-transparent rounded-[var(--radius-sm)] transition-all`}
                          disabled={!isAdmin}
                          title={isAdmin ? "Delete Profile" : "Delete Profile (Administrator privilege required)"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
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

      {/* Role Assignment Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-purple-500" />
                <span>Assign Security Role</span>
              </h3>
              <button onClick={() => setShowRoleModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Modifying privileges for <span className="font-mono font-bold text-[var(--text-primary)]">{selectedUser?.email}</span>. Make sure this matches internal compliance standards.
            </p>

            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Privilege Level
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input-styled appearance-none pr-8 text-xs font-semibold"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                  backgroundPosition: 'right 0.75rem center', 
                  backgroundSize: '1.25rem', 
                  backgroundRepeat: 'no-repeat' 
                }}
              >
                <option value="USER">User (Standard Access)</option>
                <option value="ADMIN">Admin (Security Management)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={updatingRole}
                className="btn-brand px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {updatingRole && <Loader2 size={12} className="animate-spin" />}
                <span>Assign Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Key size={16} className="text-orange-500" />
                <span>Reset User Password</span>
              </h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Resetting password for operator <span className="font-mono font-bold text-[var(--text-primary)]">{selectedUser?.email}</span>. Note: This will invalidate all active sessions/tokens for this user.
            </p>

            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                New Password <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new secure password (min 6 chars)..."
                className="input-styled text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowResetPasswordModal(false)}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={!newPassword.trim() || newPassword.length < 6 || resettingPassword}
                className="btn-brand px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {resettingPassword && <Loader2 size={12} className="animate-spin" />}
                <span>Reset Password</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-scale-in" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Confirm Identity Status Shift</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              You are changing the security status of operator <span className="font-semibold text-[var(--text-primary)]">{selectedUser?.email}</span> to <span className="font-semibold text-[var(--text-primary)]">{newStatus}</span>.
            </p>
            
            <div className="mb-5">
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
                Audit Log Reason <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                required
                rows={3}
                placeholder="Specify security reasoning details for audit records..."
                className="input-styled text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="btn-secondary px-4 py-2 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={!statusReason.trim() || updatingStatus}
                className="btn-brand px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {updatingStatus && <Loader2 size={12} className="animate-spin" />}
                <span>Update Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Metadata Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end modal-overlay animate-fade-in">
          <div className="h-full w-full max-w-md p-6 bg-[var(--surface)] border-l border-[var(--border)] shadow-xl flex flex-col justify-between animate-slide-in-right">
            <div>
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-6">
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  <span>Operator Metadata Profile</span>
                </h3>
                <button onClick={() => setShowProfileModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500 mb-3">
                    <User size={32} />
                  </div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
                    {selectedUser?.fullName}
                    {selectedUser?.isVerified && <Award size={14} className="text-blue-500 fill-blue-500/10" />}
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedUser?.email}</p>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Database Node ID</span>
                    <span className="font-mono text-[var(--text-primary)] font-semibold">#{selectedUser?.id}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Phone Number</span>
                    <span className="font-mono text-[var(--text-primary)] font-semibold">{selectedUser?.phoneNumber || "-"}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Login Lock Status</span>
                    <span>
                      {selectedUser?.isActive ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-[4px] text-[10px] font-semibold">Allowed</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-[4px] text-[10px] font-semibold">Locked</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Assigned Security Role</span>
                    <span>{getRoleBadge(selectedUser?.role)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Activation Status</span>
                    <span>{getStatusBadge(selectedUser?.status)}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Verification Badge</span>
                    <span className="font-semibold text-xs text-[var(--text-primary)]">{selectedUser?.isVerified ? "Verified Identity" : "Standard Profile"}</span>
                  </div>
                  <div className="flex justify-between text-xs py-2 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">Join Registration Date</span>
                    <span className="font-mono text-[var(--text-secondary)]">
                      {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleString("en-IN") : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full btn-secondary py-2.5 text-xs font-bold text-center mt-6"
            >
              Close Panel
            </button>
          </div>
        </div>
      )}

      {/* Delete User Confirm Dialog (RBAC enforced) */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title="Forcibly Wipe User Account"
          message={`Are you sure you want to forcibly delete the profile of ${deleteTarget.fullName} (${deleteTarget.email})? This will erase all user registries, budgets, and transaction histories, and cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
          confirmLabel={deletingUser ? "Wiping Profile..." : "Confirm DB Wipe"}
        />
      )}
    </div>
  );
};

export default UserManagement;
