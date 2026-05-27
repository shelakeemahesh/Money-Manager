import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wallet, CheckCircle2, XCircle, Loader2, ArrowRight, Sun, Moon } from "lucide-react";
import AppContext from "../../context/AppContext";
import axiosConfig from "../../utils/axiosConfig";
import { motion } from "framer-motion";

const ActivateAccount = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const { theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    const performActivation = async () => {
      if (!token) {
        setStatus("error");
        setErrorMessage("Missing account activation token. Please request a new activation link.");
        return;
      }

      try {
        const response = await axiosConfig.get(`/activate?token=${token}`);
        if (response.status === 200) {
          setStatus("success");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(error.response?.data?.message || "Invalid or expired activation link. Please register again.");
      }
    };

    performActivation();
  }, [token]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200 bg-[var(--surface-2)]">
      
      {/* Theme toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-1.5 rounded-md border bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border-[var(--border)] transition-all z-50 cursor-pointer"
      >
        {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
      </button>

      {/* Main glass card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--border)] rounded-md p-6 shadow-sm relative text-center"
      >
        {/* Branding header */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
            <Wallet size={15} className="text-[var(--surface)]" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--text-primary)]">MoneyManager</span>
        </div>

        {status === "loading" && (
          <div className="space-y-4 py-6">
            <Loader2 size={36} className="animate-spin mx-auto text-indigo-500" />
            <h1 className="text-base font-bold text-[var(--text-primary)]">Verifying Token...</h1>
            <p className="text-xs text-[var(--text-secondary)]">Checking activation credentials against security registry.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
            <h1 className="text-base font-black text-[var(--text-primary)]">Account Activated!</h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Your Money Manager account has been successfully verified. You can now access your personal dashboard.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
            >
              <span>Go to Login</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <XCircle size={44} className="mx-auto text-rose-500" />
            <h1 className="text-base font-bold text-[var(--text-primary)]">Activation Failed</h1>
            <p className="text-xs text-[var(--text-rose)] bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg leading-relaxed text-left text-xs font-medium">
              {errorMessage}
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-2.5 btn-secondary flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
            >
              <span>Back to Signup</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ActivateAccount;
