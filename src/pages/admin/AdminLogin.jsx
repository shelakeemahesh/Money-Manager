import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldAlert, UserCog, Lock, Mail, ArrowRight, Sun, Moon } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import AppContext from "../../context/AppContext";
import Input from "../../components/common/Input";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const AdminLogin = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { theme, toggleTheme } = useContext(AppContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await axiosConfig.post(API_ENDPOINTS.LOGIN, { emailOrPhone, password });
      
      if (response.status === 200) {
        const { token, profile: user } = response.data;
        
        if (user.role !== "ADMIN") {
          toast.error("Access denied. Admin privileges required.");
          setLoading(false);
          return;
        }
        
        if (user.status !== "ACTIVE") {
          toast.error("Account is suspended or banned.");
          setLoading(false);
          return;
        }

        // Store auth data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        toast.success("Identity verified. Welcome to Admin Portal");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-2)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200">
      
      {/* Theme toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-1.5 rounded-md border bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border-[var(--border)] transition-all z-50 cursor-pointer"
      >
        {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
      </button>

      {/* Glow Effects */}
      <div className="absolute w-[350px] h-[350px] bg-indigo-500/5 dark:bg-indigo-500/2 rounded-full blur-[100px] top-1/4 left-1/4 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-emerald-500/5 dark:bg-emerald-500/2 rounded-full blur-[90px] bottom-1/4 right-1/4 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-sm overflow-hidden">
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4.5 text-center border-b border-[var(--border)] bg-[var(--surface-2)]">
            <div className="w-10 h-10 bg-[var(--text-primary)] rounded-lg flex items-center justify-center mx-auto mb-3">
              <UserCog size={18} className="text-[var(--surface)]" />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Administrator</h1>
            <p className="text-[9px] font-bold text-indigo-500 tracking-wider uppercase mt-1 flex items-center justify-center gap-1.5">
              <ShieldAlert size={11} className="text-amber-500" />
              <span>Restricted Access Node</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <Input
              label="Security Email or Phone"
              type="text"
              required
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value.trim())}
              placeholder="admin@example.com or +919876543210"
              pattern="([a-zA-Z0-9._%+\-]+@(gmail\.com|zohomail\.in))|(\+?[0-9]{10,15})"
              title="Please enter a valid @gmail.com/@zohomail.in email, or a phone number with country code"
              icon={<Mail size={14} />}
              disabled={loading}
            />

            <Input
              label="Verification Key"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={14} />}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn-brand text-xs font-semibold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Node...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Node</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-5 tracking-wide">
          Unauthorized attempts are monitored and recorded.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
