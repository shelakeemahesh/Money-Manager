import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowRight, Sun, Moon } from "lucide-react";
import AppContext from "../../context/AppContext";
import { toast } from "sonner";
import { signup } from "../../services/authService";
import ProfilePhotoSelector from "../../components/ProfilePhotoSelector";
import Input from "../../components/common/Input";
import { motion } from "framer-motion";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { theme, toggleTheme } = useContext(AppContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Inline Validations
    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const fullPhoneNumber = `${countryCode}${phone}`;
      const response = await signup({
        fullName,
        email,
        phoneNumber: fullPhoneNumber,
        password,
      });

      if (response.status === 201) {
        toast.success("Account created! Please verify your identity.");
        navigate(`/verify-otp?identifier=${encodeURIComponent(email)}&phone=${encodeURIComponent(fullPhoneNumber)}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
      toast.error(err.response?.data?.message || "Signup failed");
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
        className="w-full max-w-[440px] bg-[var(--surface)] border border-[var(--border)] rounded-md p-6 shadow-sm relative animate-fade-in"
      >
        {/* Branding header */}
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-8 h-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center">
            <Wallet size={15} className="text-[var(--surface)]" />
          </div>
          <span className="font-bold tracking-tight text-sm text-[var(--text-primary)]">MoneyManager</span>
        </div>

        <h1 className="text-lg font-bold text-center tracking-tight text-[var(--text-primary)]">
          Create your account
        </h1>
        <p className="text-xs text-center mt-0.5 mb-6 text-[var(--text-secondary)]">
          Join us to start managing your personal cash flows
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar upload component */}
          <div className="flex justify-center mb-4">
            <ProfilePhotoSelector image={profilePhoto} setImage={setProfilePhoto} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); setError(""); }}
              pattern="[A-Za-z ]{2,}"
              title="Full name should contain only letters and spaces"
              required
              disabled={loading}
            />

            {/* Email Address */}
            <Input
              label="Email Address"
              type="email"
              placeholder="johndoe@gmail.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value.toLowerCase()); setError(""); }}
              pattern="[a-zA-Z0-9._%+\-]+@(gmail\.com|zohomail\.in)"
              title="Only @gmail.com or @zohomail.in email addresses are allowed"
              required
              disabled={loading}
            />
          </div>

          {/* Phone Number with country code selector */}
          <div className="space-y-1.5 w-full">
            <label className="block text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)] pl-0.5">
              Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex items-center">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="input-styled w-[95px] appearance-none text-xs font-semibold py-2 px-3 pr-7 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                    backgroundPosition: 'right 0.5rem center', 
                    backgroundSize: '1rem', 
                    backgroundRepeat: 'no-repeat' 
                  }}
                  disabled={loading}
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+81">+81 (JP)</option>
                  <option value="+971">+971 (AE)</option>
                </select>
              </div>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                pattern="[0-9]{8,11}"
                maxLength={10}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10)); setError(""); }}
                title="Enter a valid phone number"
                className="input-styled flex-1"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              required
              disabled={loading}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
              required
              disabled={loading}
            />
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="text-red-500 text-xs font-semibold text-center bg-red-500/5 border border-red-500/10 rounded-md px-3 py-2 animate-fade-in">
              {error}
            </div>
          )}

          {/* Sign Up Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 mt-4 text-xs font-semibold"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                <span>Signing up...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Already have an account?{" "}
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

export default Signup;