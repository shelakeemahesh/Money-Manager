import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import {
    LayoutDashboard,
    Tag,
    TrendingUp,
    TrendingDown,
    SlidersHorizontal,
    Sparkles,
    X,
    ChevronDown,
    Settings,
    Trophy,
    Wallet
} from "lucide-react";
import AppContext from "../context/AppContext";

const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/filter", label: "Transactions", icon: SlidersHorizontal },
    { to: "/income", label: "Income", icon: TrendingUp },
    { to: "/expense", label: "Expense", icon: TrendingDown },
    { to: "/category", label: "Categories", icon: Tag },
    { to: "/budget", label: "Budgets", icon: Sparkles },
    { to: "/ai-insights", label: "AI Insights", icon: Sparkles, badge: "New" },
    { to: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = ({ onClose }) => {
    const { user } = useContext(AppContext);
    const navigate = useNavigate();
    const isProOrAdmin = user?.role === "PRO" || user?.role === "ADMIN";

    const handleNavClick = () => {
        if (onClose) onClose();
    };

    return (
        <aside className="w-[240px] min-h-screen flex flex-col shrink-0 border-r bg-[var(--surface)] border-[var(--border)] transition-colors duration-200">
            
            {/* Mobile close */}
            {onClose && (
                <button onClick={onClose}
                    className="lg:hidden self-end m-3 p-1.5 text-[var(--text-muted)] hover:text-[var(--text-secondary)] rounded-lg transition-colors">
                    <X size={18} />
                </button>
            )}

            {/* Header / Brand */}
            <div className="px-5 pt-6 pb-4 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-black dark:bg-zinc-900 flex items-center justify-center text-white select-none shadow-md shadow-black/10">
                    <Wallet size={15} />
                </div>
                <div>
                    <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Money Manager</span>
                </div>
            </div>

            {/* Main Navigation links */}
            <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1 overflow-y-auto">
                {navLinks.map((link) => (
                    <NavLink
                        key={link.label}
                        to={link.to}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 group border ${
                                isActive
                                    ? "bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/10"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] border-transparent"
                            }`
                        }
                    >
                        {({ isActive }) => {
                            const LinkIcon = link.icon;
                            return (
                                <>
                                    <LinkIcon size={14} className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors"} />
                                    <span className="flex-1 tracking-tight">{link.label}</span>
                                    {link.badge && (
                                        <span className="px-1.5 py-0.5 text-[8px] font-bold text-white bg-indigo-600 rounded-full leading-none">
                                            {link.badge}
                                        </span>
                                    )}
                                </>
                            );
                        }}
                    </NavLink>
                ))}
            </nav>

            {/* Pro Plan promo block */}
            <div className="mx-4 my-4 p-4 rounded-xl border border-indigo-500/20 dark:border-indigo-500/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/5 dark:from-indigo-950/30 dark:via-purple-950/10 dark:to-pink-950/10 relative overflow-hidden group shadow-md shadow-indigo-500/5 hover:shadow-indigo-500/10 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all duration-300">
                {/* Glow effects */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-pink-500/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />

                <div className="flex items-center gap-2 mb-2 relative z-10">
                    <div className="p-1 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0 shadow-sm">
                        {isProOrAdmin ? (
                            <Trophy size={11} className="animate-pulse" />
                        ) : (
                            <Sparkles size={11} className="animate-pulse" />
                        )}
                    </div>
                    <span className="text-xs font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        {isProOrAdmin ? "Premium Pro Active" : "Pro Plan Upgrade"}
                    </span>
                </div>
                
                <p className="text-[10px] text-[var(--text-secondary)] mb-3.5 leading-relaxed relative z-10 font-medium">
                    {isProOrAdmin 
                        ? "You have full access to predictive AI audits, forecasting models, and detailed sheets exports."
                        : "Activate predictive AI audits, forecasting models, and detailed sheets exports."
                    }
                </p>

                {/* Feature Highlights */}
                <div className="space-y-1.5 mb-4 relative z-10">
                    {[
                        "Predictive AI Insights",
                        "Unlimited Tracking Nodes",
                        "Advanced Custom Budgets"
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)]">
                            <span className={`w-1 h-1 rounded-full ${isProOrAdmin ? "bg-emerald-500" : "bg-indigo-500"}`} />
                            <span className="font-semibold">{feature}</span>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={() => navigate("/pro-plan")}
                    className={`w-full py-2 text-white text-[10px] font-black rounded-lg transition-all duration-150 cursor-pointer shadow-md active:scale-[0.98] relative z-10 uppercase tracking-wider text-center ${
                        isProOrAdmin 
                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/10 hover:shadow-emerald-600/20" 
                            : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-600/10 hover:shadow-indigo-600/20"
                    }`}
                >
                    {isProOrAdmin ? "Manage Subscription" : "Upgrade to Pro"}
                </button>
            </div>

            {/* Profile Section at bottom */}
            <div className="p-4 border-t border-[var(--border)] mt-auto flex items-center gap-3 hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
                onClick={() => navigate("/settings")}>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] shrink-0 flex items-center justify-center border border-[var(--border)]">
                    {user?.profileImageUrl ? (
                        <img src={user.profileImageUrl} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-[var(--text-secondary)] text-xs font-bold">
                            {user?.fullName?.[0]?.toUpperCase() || "A"}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[var(--text-primary)] text-xs font-bold truncate leading-none mb-1">{user?.fullName || "Admin"}</p>
                    <p className="text-[var(--text-muted)] text-[10px] truncate leading-none">{user?.email || "admin@moneymanager.com"}</p>
                </div>
                <ChevronDown size={12} className="text-[var(--text-muted)] shrink-0" />
            </div>
        </aside>
    );
};

export default Sidebar;
