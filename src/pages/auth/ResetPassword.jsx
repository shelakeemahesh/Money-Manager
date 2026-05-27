import { useState, useContext, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wallet, ArrowRight, Sun, Moon, KeyRound } from "lucide-react";
import AppContext from "../../context/AppContext";
import { toast } from "sonner";
import { resetPassword } from "../../services/authService";
import Input from "../../components/common/Input";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const { theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setValidationError("No reset token provided. Please check your email link or request a new reset link.");
      toast.error("Password reset token is missing");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!token) {
      setValidationError("Missing token. Cannot reset password.");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({ token, newPassword: password });
      if (response.status === 200) {
        toast.success("Password reset successfully! Please sign in with your new password.");
        navigate("/login");
      }
    } catch (error) {
      setValidationError(error?.response?.data?.message || "Invalid or expired reset token. Please request a new link.");
      toast.error("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

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
        className="w-full max-w-[380px] bg-[var(--surface)] border border-[var(--border)] rounded-md p-6 shadow-sm relative"
      >
        {/* Branding header */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
            <Wallet size={15} className="text-[var(--surface)]" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--text-primary)]">MoneyManager</span>
        </div>

        <h1 className="text-lg font-bold text-center tracking-tight text-[var(--text-primary)]">
          Reset Password
        </h1>
        
        <p className="text-xs text-center mt-0.5 mb-6 text-[var(--text-secondary)]">
          Enter and confirm your new password below to securely update your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Input */}
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setValidationError("");
            }}
            required
            disabled={!token || loading}
          />

          {/* Confirm Password Input */}
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setValidationError("");
            }}
            required
            disabled={!token || loading}
          />

          {/* Validation Error Message Box */}
          {validationError && (
            <div className="text-red-500 text-xs font-semibold text-center bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2 animate-fade-in">
              {validationError}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                <span>Resetting...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Remember your password?{" "}
          <button
            onClick={() => !loading && navigate("/login")}
            className="font-semibold hover:text-[var(--text-primary)] transition-colors underline cursor-pointer text-[var(--text-primary)]"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
