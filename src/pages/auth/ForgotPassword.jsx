import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowRight, Sun, Moon, ArrowLeft } from "lucide-react";
import AppContext from "../../context/AppContext";
import { toast } from "sonner";
import { forgotPassword, resetPassword, resendOtp } from "../../services/authService";
import Input from "../../components/common/Input";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1 = Request, 2 = Verify OTP & Reset
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const [error, setError] = useState("");
  
  const { theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();

  // Cooldown Timer for OTP resending in Step 2
  useEffect(() => {
    if (step !== 2 || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Request Reset OTP Code
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (!emailOrPhone.trim()) {
      setError("Please enter your email or phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPassword({ emailOrPhone });
      if (response.status === 200) {
        toast.success("Verification OTP code sent successfully!");
        setStep(2);
        setCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset code. Verify your input.");
      toast.error(err.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP & Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      setError("OTP must be a 6-digit number");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        emailOrPhone,
        otpCode,
        newPassword,
      });

      if (response.status === 200) {
        toast.success("Password reset successful! Please log in with your new password.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Check details.");
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setError("");
    setResending(true);

    try {
      const response = await resendOtp({ emailOrPhone });
      if (response.status === 200) {
        toast.success("OTP verification code resent successfully!");
        setCooldown(60); // Reset timer
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-200 bg-[var(--surface-2)]">
      
      {/* Theme toggle */}
      <button 
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-1.5 rounded-md border bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border-[var(--border)] transition-all z-50 cursor-pointer"
        disabled={loading}
      >
        {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
      </button>

      {/* Main glass card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[390px] bg-[var(--surface)] border border-[var(--border)] rounded-md p-6 shadow-sm relative"
      >
        {/* Branding header */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
            <Wallet size={15} className="text-[var(--surface)]" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--text-primary)]">MoneyManager</span>
        </div>

        <h1 className="text-lg font-bold text-center tracking-tight text-[var(--text-primary)]">
          {step === 1 ? "Forgot Password" : "Reset Password"}
        </h1>
        
        <p className="text-xs text-center mt-0.5 mb-6 text-[var(--text-secondary)]">
          {step === 1 
            ? "Enter your registered email or phone number below to receive a secure verification OTP code" 
            : `We sent a 6-digit OTP code to verify your details: ${emailOrPhone}`}
        </p>

        {step === 1 ? (
          /* STEP 1: Request OTP Code */
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              label="Email or Phone Number"
              type="text"
              placeholder="you@gmail.com or +919876543210"
              value={emailOrPhone}
              onChange={(e) => {
                setEmailOrPhone(e.target.value);
                setError("");
              }}
              pattern="([a-zA-Z0-9._%+\-]+@(gmail\.com|zohomail\.in))|(\+?[0-9]{10,15})"
              title="Please enter a valid @gmail.com/@zohomail.in email, or a phone number with country code"
              required
              disabled={loading}
            />

            {error && (
              <div className="text-red-500 text-xs font-semibold text-center bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset OTP</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Verify OTP & Enter New Password */
          <form onSubmit={handleResetPassword} className="space-y-4">
            
            {/* OTP Code */}
            <Input
              label="6-Digit OTP Verification Code"
              type="text"
              placeholder="e.g. 123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6));
                setError("");
              }}
              required
              disabled={loading}
              className="text-center font-mono text-base tracking-[0.5em] focus:tracking-[0.5em]"
            />

            {/* New Password */}
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
              }}
              required
              disabled={loading}
            />

            {error && (
              <div className="text-red-500 text-xs font-semibold text-center bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                  <span>Resetting password...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>

            {/* Resend Cooldown Action */}
            <div className="text-center mt-2 text-xs text-[var(--text-secondary)]">
              Didn't receive the code?{" "}
              {cooldown > 0 ? (
                <span className="font-semibold text-[var(--text-muted)]">
                  Resend in {cooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors underline cursor-pointer disabled:opacity-40"
                >
                  {resending ? "Resending..." : "Resend OTP"}
                </button>
              )}
            </div>

            {/* Back to Step 1 Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStep(1);
                setOtpCode("");
                setNewPassword("");
                setConfirmPassword("");
                setError("");
              }}
              className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer border border-[var(--border)] rounded bg-transparent hover:bg-[var(--surface-3)]"
            >
              <ArrowLeft size={13} />
              <span>Back to Step 1</span>
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Remember your password?{" "}
          <button
            onClick={() => !loading && navigate("/login")}
            className="font-semibold hover:text-[var(--text-primary)] transition-colors underline cursor-pointer text-[var(--text-primary)]"
            disabled={loading}
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;