import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Wallet, ArrowRight, Sun, Moon, Mail, Smartphone, ArrowLeft } from "lucide-react";
import AppContext from "../../context/AppContext";
import { toast } from "sonner";
import { verifyOtp, resendOtp, sendOtp } from "../../services/authService";
import Input from "../../components/common/Input";
import { motion, AnimatePresence } from "framer-motion";

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("identifier") || "";
  const phone = searchParams.get("phone") || "";
  const userId = searchParams.get("userId") || "";

  // "choose" | "otp"
  const [step, setStep] = useState("choose");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  const { theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();

  // Cooldown Timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Mask email: sh***@gmail.com
  const maskEmail = (em) => {
    if (!em) return "";
    const [local, domain] = em.split("@");
    if (!domain) return em;
    const visible = local.slice(0, 2);
    return `${visible}${"•".repeat(Math.max(local.length - 2, 3))}@${domain}`;
  };

  // Mask phone: +91••••••8457
  const maskPhone = (ph) => {
    if (!ph || ph.length < 6) return ph;
    const visible = ph.slice(0, 3);
    const last4 = ph.slice(-4);
    return `${visible}${"•".repeat(Math.max(ph.length - 7, 3))}${last4}`;
  };

  // Send OTP to selected channel
  const handleChannelSelect = async (channel) => {
    setSelectedChannel(channel);
    setError("");
    setSending(true);

    try {
      let response;
      if (userId) {
        response = await sendOtp({
          userId: parseInt(userId, 10),
          deliveryType: channel === "email" ? "EMAIL" : "SMS",
        });
      } else {
        const identifier = channel === "email" ? email : phone;
        response = await resendOtp({
          emailOrPhone: identifier,
          channel,
        });
      }

      if (response.status === 200) {
        const dest = channel === "email" ? maskEmail(email) : maskPhone(phone);
        toast.success(`OTP sent to ${dest}`);
        setStep("otp");
        setCooldown(60);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  // Verify OTP
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      setError("OTP must be a 6-digit number");
      return;
    }

    const identifier = selectedChannel === "email" ? email : phone;
    setLoading(true);

    try {
      const response = await verifyOtp({
        emailOrPhone: identifier,
        otpCode,
      });

      if (response.status === 200) {
        toast.success("Account verified successfully! You can now log in.");
        navigate("/login");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP code");
      toast.error(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP to same channel
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError("");
    setResending(true);

    try {
      let response;
      if (userId) {
        response = await sendOtp({
          userId: parseInt(userId, 10),
          deliveryType: selectedChannel === "email" ? "EMAIL" : "SMS",
        });
      } else {
        const identifier = selectedChannel === "email" ? email : phone;
        response = await resendOtp({
          emailOrPhone: identifier,
          channel: selectedChannel,
      });
      }

      if (response.status === 200) {
        toast.success("OTP resent successfully!");
        setCooldown(60);
        setOtpCode("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
      toast.error(err.response?.data?.message || "Failed to resend");
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
      >
        {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
      </button>

      {/* Main card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-[var(--surface)] border border-[var(--border)] rounded-md p-6 shadow-sm relative"
      >
        {/* Branding header */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
            <Wallet size={15} className="text-[var(--surface)]" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--text-primary)]">MoneyManager</span>
        </div>

        <AnimatePresence mode="wait">
          {/* ──── STEP 1: Choose Channel ──── */}
          {step === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold text-center tracking-tight text-[var(--text-primary)]">
                Verify Your Identity
              </h1>
              <p className="text-xs text-center mt-1 mb-6 text-[var(--text-secondary)]">
                Choose how you'd like to receive your verification code
              </p>

              <div className="space-y-3">
                {/* Email Option */}
                {email && (
                  <button
                    onClick={() => handleChannelSelect("email")}
                    disabled={sending}
                    className="w-full group flex items-center gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/20 transition-colors">
                      <Mail size={18} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        Verify via Email
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Send OTP to {maskEmail(email)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-indigo-500 transition-colors" />
                  </button>
                )}

                {/* Phone Option */}
                {phone && (
                  <button
                    onClick={() => handleChannelSelect("phone")}
                    disabled={sending}
                    className="w-full group flex items-center gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                      <Smartphone size={18} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">
                        Verify via Phone
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        Send OTP to {maskPhone(phone)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-[var(--text-muted)] group-hover:text-emerald-500 transition-colors" />
                  </button>
                )}
              </div>

              {/* Sending spinner */}
              {sending && (
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[var(--text-secondary)]">
                  <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Sending OTP...</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="text-red-500 text-xs font-semibold text-center bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2 mt-4 animate-fade-in">
                  {error}
                </div>
              )}

              <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
                <button
                  onClick={() => navigate("/login")}
                  className="font-semibold hover:text-[var(--text-primary)] transition-colors underline cursor-pointer text-[var(--text-primary)]"
                >
                  Back to Login
                </button>
              </p>
            </motion.div>
          )}

          {/* ──── STEP 2: Enter OTP ──── */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-lg font-bold text-center tracking-tight text-[var(--text-primary)]">
                Enter Verification Code
              </h1>
              <p className="text-xs text-center mt-1 mb-1 text-[var(--text-secondary)]">
                We sent a 6-digit OTP to
              </p>
              <p className="text-xs text-center mb-6 font-bold text-[var(--text-primary)]">
                {selectedChannel === "email" ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Mail size={12} className="text-indigo-500" />
                    {maskEmail(email)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Smartphone size={12} className="text-emerald-500" />
                    {maskPhone(phone)}
                  </span>
                )}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* OTP Input */}
                <Input
                  label="Verification Code"
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

                {/* Error */}
                {error && (
                  <div className="text-red-500 text-xs font-semibold text-center bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2 animate-fade-in">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify OTP</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </form>

              {/* Resend + change channel */}
              <div className="mt-6 text-xs text-[var(--text-secondary)] text-center">
                Didn't receive the code?{" "}
                {cooldown > 0 ? (
                  <span className="font-semibold text-[var(--text-muted)]">
                    Resend in {cooldown}s
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors underline cursor-pointer disabled:opacity-40"
                  >
                    {resending ? "Resending..." : "Resend OTP"}
                  </button>
                )}
              </div>

              {/* Change method link */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => {
                    setStep("choose");
                    setOtpCode("");
                    setError("");
                    setCooldown(0);
                  }}
                  disabled={loading}
                  className="text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={10} />
                  Try a different method
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VerifyOtp;
