import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = ({
  label,
  icon,
  type = "text",
  error,
  wrapperClass = "",
  className = "",
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 w-full ${wrapperClass}`}>
      {label && (
        <label className="block text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </label>
      )}

      <div className="relative w-full flex items-center">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-3 flex items-center justify-center text-[var(--text-muted)] pointer-events-none select-none">
            {icon}
          </div>
        )}

        {/* Input Field */}
        <input
          type={inputType}
          className={`input-styled w-full ${icon ? "!pl-9" : "!pl-3.5"} ${isPassword ? "!pr-10" : "!pr-3.5"} ${
            error ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10" : ""
          } ${className}`}
          {...props}
        />

        {/* Password Eye Toggle */}
        {isPassword && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 p-1 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer rounded"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-semibold text-rose-500 animate-fade-in pl-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;