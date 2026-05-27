import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, TrendingUp, ShieldCheck, ArrowRight, Sun, Moon } from "lucide-react";
import AppContext from "../../context/AppContext";
import { toast } from "sonner";
import { login } from "../../services/authService";
import Input from "../../components/common/Input";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { setUser, theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const response = await login({ emailOrPhone, password });
      if (response.status === 200) {
        const { token, profile } = response.data;
        
        // Save auth data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(profile));
        
        setUser(profile);
        toast.success("Successfully logged in!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden transition-colors duration-200 bg-[var(--surface-2)]">
      
      {/* Theme toggle on auth page */}
      <button 
        onClick={toggleTheme}
        className="absolute top-5 right-5 p-1.5 rounded-md border bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-3)] border-[var(--border)] transition-all z-50 cursor-pointer"
      >
        {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
      </button>

      {/* Left Panel - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="hidden lg:flex flex-col justify-between w-[440px] p-12 relative overflow-hidden shrink-0 border-r border-[var(--border)] bg-[var(--surface)]"
      >
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[100px] bg-indigo-500/5 dark:bg-indigo-500/2 pointer-events-none" />
        <div className="absolute bottom-20 -right-20 w-64 h-64 rounded-full blur-[100px] bg-emerald-500/5 dark:bg-emerald-500/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
              <Wallet size={15} className="text-[var(--surface)]" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-bold text-sm leading-none tracking-tight">MoneyManager</p>
              <p className="text-[var(--text-muted)] text-[9px] font-semibold tracking-wider uppercase mt-0.5">Fintech Intelligence</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-[1.2] tracking-tight mb-5 text-[var(--text-primary)]">
            Take control of<br />
            your finances
          </h1>
          
          <p className="text-xs leading-relaxed mb-12 text-[var(--text-secondary)]">
            A premium, elegant space to track your income, monitor expenses, structure budgets, and leverage AI insights to guide your wealth journey.
          </p>

          <div className="space-y-5">
            {[
              { icon: TrendingUp, label: "Real-time analytics", desc: "Monitor your balances, cash flows, and category metrics instantaneously." },
              { icon: ShieldCheck, label: "Security & privacy first", desc: "Bank-grade data isolation ensuring your financial details are securely held." },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-[var(--border)] bg-[var(--surface-3)]">
                    <IconComponent size={14} className="text-[var(--text-secondary)]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{item.label}</p>
                    <p className="text-[11px] mt-0.5 text-[var(--text-secondary)]">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-[10px] relative z-10 text-[var(--text-muted)]">© 2026 Money Manager. Designed for high performance.</p>
      </motion.div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] -top-10 -right-10 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile branding */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center mb-8">
            <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
              <Wallet size={15} className="text-[var(--surface)]" />
            </div>
            <span className="font-bold tracking-tight text-sm text-[var(--text-primary)]">MoneyManager</span>
          </div>

          <div className="rounded-md p-6 bg-[var(--surface)] border border-[var(--border)] shadow-sm relative">
            <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Welcome back
            </h2>
            <p className="text-xs mb-6 mt-0.5 text-[var(--text-secondary)]">
              Access your personal wealth management console
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email or Phone Input */}
              <Input
                label="Email or Phone Number"
                type="text"
                placeholder="you@gmail.com or +919876543210"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value.trim())}
                pattern="([a-zA-Z0-9._%+\-]+@(gmail\.com|zohomail\.in))|(\+?[0-9]{10,15})"
                title="Please enter a valid @gmail.com/@zohomail.in email, or a phone number with country code"
                required
                disabled={loading}
              />

              {/* Password Input */}
              <Input
                label={
                  <div className="flex justify-between items-center w-full">
                    <span>Password</span>
                    <button
                      type="button"
                      onClick={() => !loading && navigate("/forgot-password")}
                      className="text-[10px] font-semibold normal-case hover:text-[var(--text-primary)] hover:underline transition-all cursor-pointer text-[var(--text-muted)]"
                      disabled={loading}
                    >
                      Forgot Password?
                    </button>
                  </div>
                }
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />

              {/* Login Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-2 text-xs font-semibold"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
              Don't have an account?{" "}
              <button
                onClick={() => !loading && navigate("/signup")}
                className="font-semibold hover:text-[var(--text-primary)] transition-colors underline cursor-pointer text-[var(--text-primary)]"
              >
                Sign up
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;