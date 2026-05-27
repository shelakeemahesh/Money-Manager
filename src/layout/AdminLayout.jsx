import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-2)] text-[var(--text-primary)] flex transition-colors duration-200">
      <AdminSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 flex-1 flex flex-col min-h-screen min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center h-16 px-5 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-30 justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md hover:bg-[var(--surface-3)] border border-[var(--border)] transition-colors"
            >
              <Menu size={15} />
            </button>
            <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">Admin Portal</span>
          </div>
        </header>

        {/* Page Content with Framer Motion slide-in */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full max-w-7xl mx-auto overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
