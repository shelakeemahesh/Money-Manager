import { useState, useContext, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { Menu, Bell, Search, Sun, Moon, User, Settings, LogOut, Info, Plus } from "lucide-react";
import AppContext from "../context/AppContext";
import SearchInput from "../components/common/SearchInput";

const PAGE_TITLES = {
    "/dashboard": "Dashboard",
    "/category": "Categories",
    "/income": "Incomes",
    "/expense": "Expenses",
    "/filter": "Transactions",
    "/budget": "Budgets",
    "/ai-insights": "AI Insights Hub",
    "/pro-plan": "Premium Pro Plan",
    "/settings": "Settings",
};

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    
    const { theme, toggleTheme, user, anomalyAlerts, dismissAnomaly } = useContext(AppContext);
    
    const location = useLocation();
    const navigate = useNavigate();
    const notifyRef = useRef(null);

    const pageTitle = PAGE_TITLES[location.pathname] || "Money Manager";

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifyRef.current && !notifyRef.current.contains(event.target)) {
                setNotificationOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isDashboard = location.pathname === "/dashboard";
    const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Admin";

    return (
        <div className="flex h-screen overflow-hidden text-[var(--text-primary)] bg-[var(--surface-2)] transition-colors duration-200">

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/30 dark:bg-black/60 backdrop-blur-xs lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-out
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                lg:relative lg:translate-x-0 lg:z-auto`}>
                <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

                {/* Top Sticky Navbar */}
                <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 border-b bg-[var(--glass-bg)] border-[var(--border)] transition-colors duration-200"
                    style={{
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                    }}>
                    
                    {/* Left side: Hamburger button & page header / greeting */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors border border-[var(--border)]"
                        >
                            <Menu size={15} />
                        </button>
                        {isDashboard ? (
                            <div>
                                <h1 className="text-xs sm:text-base lg:text-lg font-black tracking-tight text-[var(--text-primary)] flex items-center gap-1">
                                    Good morning, {firstName}! <span className="animate-pulse">👋</span>
                                </h1>
                                <p className="hidden sm:block text-[9px] text-[var(--text-muted)] mt-0.5">
                                    Here's what's happening with your finances today.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-xs sm:text-base lg:text-lg font-black tracking-tight text-[var(--text-primary)]">
                                    {pageTitle}
                                </h1>
                                <p className="hidden sm:block text-[9px] text-[var(--text-muted)] mt-0.5">
                                    {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right side: Search, Theme Toggle, Notification & Profile dropdown */}
                    <div className="flex items-center gap-3">
                        {/* Search Input Box */}
                        <div className="hidden lg:block">
                            <SearchInput 
                                placeholder="Search transactions, categories..."
                                wrapperClass="w-60"
                                className="!py-1.5 focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                                onClick={() => navigate("/filter")}
                                readOnly
                            />
                        </div>

                        {/* Theme Toggle Button */}
                        <button 
                            onClick={toggleTheme}
                            className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors border border-[var(--border)] cursor-pointer"
                        >
                            {theme === "dark" ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
                        </button>

                        {/* Notifications Menu */}
                        <div className="relative" ref={notifyRef}>
                            <button 
                                onClick={() => setNotificationOpen(!notificationOpen)}
                                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-3)] transition-colors border border-[var(--border)] relative cursor-pointer"
                            >
                                <Bell size={14} />
                                {anomalyAlerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center">
                                        {anomalyAlerts.length}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {notificationOpen && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        transition={{ duration: 0.12 }}
                                        className="absolute right-0 mt-2 w-[280px] max-h-[360px] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-md p-3 shadow-lg z-50 text-[var(--text-primary)]"
                                    >
                                        <h3 className="font-bold text-[9px] uppercase tracking-wider text-[var(--text-muted)] mb-3">Notifications</h3>
                                        
                                        {anomalyAlerts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                                <Info size={16} className="text-indigo-400 mb-1.5" />
                                                <p className="text-xs font-semibold text-[var(--text-secondary)]">All quiet here</p>
                                                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">No new anomalies or warnings</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {anomalyAlerts.map(alert => (
                                                    <div key={alert.id} className="p-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-md flex items-start gap-2 relative group">
                                                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.type === "expense" ? "bg-rose-500" : "bg-amber-500"}`} />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-semibold text-[var(--text-primary)]">{alert.label}</p>
                                                            <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{alert.time}</p>
                                                        </div>
                                                        <button 
                                                            onClick={() => dismissAnomaly(alert.id)}
                                                            className="text-[9px] text-indigo-500 hover:text-indigo-700 font-medium shrink-0 ml-1"
                                                        >
                                                            Dismiss
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Add Transaction Button */}
                        <button 
                            onClick={() => navigate("/expense")}
                            className="px-2 py-1.5 sm:px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                        >
                            <Plus size={13} />
                            <span className="hidden sm:inline">Add Transaction</span>
                        </button>
                    </div>
                </header>

                {/* Page Content with Page Transition Animation */}
                <main className={`flex-1 p-4 lg:p-5 min-h-0 flex flex-col ${isDashboard ? "lg:overflow-hidden overflow-y-auto" : "overflow-y-auto"}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="h-full flex flex-col min-h-0"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
};

export default Layout;