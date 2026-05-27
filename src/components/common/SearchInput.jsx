import { Search } from "lucide-react";

const SearchInput = ({
  label,
  value,
  onChange,
  placeholder = "Search...",
  wrapperClass = "",
  className = "",
  onKeyDown,
  ...props
}) => {
  return (
    <div className={`space-y-1.5 w-full ${wrapperClass}`}>
      {label && (
        <label className="block text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <div className="absolute left-3 flex items-center justify-center text-[var(--text-muted)] pointer-events-none select-none">
          <Search size={13} className="stroke-[2.2]" />
        </div>
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          className={`w-full pl-9 pr-4 py-1.5 text-xs bg-[var(--surface)] hover:bg-[var(--surface-3)] focus:bg-[var(--surface)] border border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-md transition-all duration-150 outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] ${className}`}
          {...props}
        />
      </div>
    </div>
  );
};

export default SearchInput;
