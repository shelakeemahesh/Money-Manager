import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "var(--surface-2)" }}>
      <div className="card max-w-md w-full text-center p-8">
        <div className="w-16 h-16 bg-rose-500/5 dark:bg-rose-500/10 rounded-full border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={28} className="text-rose-500" />
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-2" style={{ color: "var(--text-primary)" }}>Access Denied</h1>
        <p className="text-xs mb-8 max-w-xs mx-auto" style={{ color: "var(--text-secondary)" }}>
          You do not have permission to view this page. Administrator privileges are required.
        </p>
        <Link
          to="/dashboard"
          className="btn-brand inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
