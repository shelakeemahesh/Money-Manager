import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Settings,
  LogOut,
  FolderTree,
  Activity,
  Target,
  Crown,
  BellRing,
  UserCog,
  FileText,
  ShieldAlert,
  Cpu,
  Database,
  X
} from "lucide-react";

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "User Management", icon: Users, path: "/admin/users" },
    { name: "Transactions", icon: CreditCard, path: "/admin/transactions" },
    { name: "Categories", icon: FolderTree, path: "/admin/categories" },
    { name: "Budget Monitors", icon: Target, path: "/admin/budgets" },
    { name: "AI Engine Control", icon: Activity, path: "/admin/ai" },
    { name: "Subscriptions", icon: Crown, path: "/admin/subscriptions" },
    { name: "Notifications", icon: BellRing, path: "/admin/notifications" },
    { name: "Reports & Exports", icon: FileText, path: "/admin/reports" },
    { name: "Fraud Detection", icon: ShieldAlert, path: "/admin/fraud" },
    { name: "System Health", icon: Cpu, path: "/admin/monitoring" },
    { name: "Backups & Recovery", icon: Database, path: "/admin/backup" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 border-r bg-[var(--surface)] border-[var(--border)] transition-transform duration-200 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo and Close button */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-[var(--border)]">
          <Link to="/admin/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
              <UserCog size={15} className="text-[var(--surface)]" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] block">Admin Portal</span>
              <span className="text-[var(--text-muted)] text-[9px] font-bold tracking-wider uppercase block leading-none">Security Center</span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <p className="text-[var(--text-muted)] text-[9px] uppercase tracking-widest font-semibold mb-3 px-3">Management</p>
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-md text-xs font-semibold transition-all border ${
                  isActive
                    ? "bg-[var(--brand-50)] text-[var(--text-primary)] border-[var(--border)] shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] border-transparent"
                }`}
              >
                <item.icon size={15} className={isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"} />
                <span className="tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--border)] flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--text-secondary)]">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-none">Administrator</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate mt-1">Full Access</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 rounded-md transition-all cursor-pointer"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
