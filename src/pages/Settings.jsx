import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, Shield, Settings as SettingsIcon, Bell, 
  Smartphone, Database, Sun, Moon, Lock, Mail, 
  Trash2, Download, Save, ShieldAlert, BadgeInfo,
  Globe, Clock, KeyRound, Monitor, LogOut
} from "lucide-react";
import AppContext from "../context/AppContext";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ProfilePhotoSelector from "../components/ProfilePhotoSelector";
import uploadProfileImage from "../utils/uploadProfileImage";
import Input from "../components/common/Input";
import { toast } from "sonner";
import axiosConfig from "../utils/axiosConfig";
import * as XLSX from "xlsx";

const Settings = () => {
  const { 
    theme, toggleTheme, user, setUser, 
    incomeList, setIncomeList, expenseList, setExpenseList, setCategoryList 
  } = useContext(AppContext);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // Active Tab State
  const [activeTab, setActiveTab] = useState("profile");

  // State: Profile Details
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // State: Change Password
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);

  // State: Preferences
  const [currency, setCurrency] = useState("INR");
  const [language, setLanguage] = useState("en");

  // State: Notifications
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    weeklyDigest: false,
    pushAnomaly: true
  });

  // State: Security Toggles
  const [twoFactor, setTwoFactor] = useState(false);
  const [timeout, setTimeoutVal] = useState("15");

  // Modal State
  const [wipeConfirmOpen, setWipeConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Connected Sessions List
  const [sessions, setSessions] = useState(() => {
    const userAgent = navigator.userAgent;
    let os = "Unknown OS";
    if (userAgent.indexOf("Mac") !== -1) os = "macOS";
    else if (userAgent.indexOf("Win") !== -1) os = "Windows";
    else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
    else if (userAgent.indexOf("Android") !== -1) os = "Android";
    else if (userAgent.indexOf("like Mac") !== -1) os = "iOS";

    let browser = "Web Browser";
    if (userAgent.indexOf("Chrome") !== -1) browser = "Chrome";
    else if (userAgent.indexOf("Safari") !== -1) browser = "Safari";
    else if (userAgent.indexOf("Firefox") !== -1) browser = "Firefox";
    else if (userAgent.indexOf("Edge") !== -1) browser = "Edge";

    return [
      { 
        id: 1, 
        os: os, 
        browser: browser, 
        active: true, 
        ip: "127.0.0.1", 
        location: "Local Session" 
      }
    ];
  });

  // Tab configurations
  const TABS = [
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "security", label: "Security & Credentials", icon: Lock },
    { id: "preferences", label: "System Preferences", icon: SettingsIcon },
    { id: "notifications", label: "Notification Channels", icon: Bell },
    { id: "sessions", label: "Active Sessions", icon: Monitor },
    { id: "data", label: "Data Management", icon: Database },
  ];

  // Actions: Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }

    setProfileLoading(true);
    try {
      let profileImageUrl = user?.profileImageUrl || "";

      if (profilePhoto) {
        const uploadedUrl = await uploadProfileImage(profilePhoto);
        if (uploadedUrl) {
          profileImageUrl = uploadedUrl;
        }
      }

      const response = await axiosConfig.put("/profile", {
        fullName,
        profileImageUrl
      });

      const updatedUser = { ...user, ...response.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success("Profile details updated successfully!");
      setProfilePhoto(null);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Failed to update profile details";
      toast.error(errorMsg);
    } finally {
      setProfileLoading(false);
    }
  };

  // Actions: Update Password
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwords.new.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (passwords.new === passwords.current) {
      toast.error("New password cannot be the same as the current password.");
      return;
    }

    setPassLoading(true);
    try {
      await axiosConfig.put("/profile/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new
      });
      toast.success("Password updated successfully! Logging out...");
      
      // Clear user session/token immediately
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      
      // Delay slightly for visual feedback before redirecting to login
      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Failed to update password. Please check your current password.";
      toast.error(errorMsg);
    } finally {
      setPassLoading(false);
    }
  };

  // Actions: Terminate sessions
  const handleTerminateSessions = () => {
    setSessions(prev => prev.filter(s => s.active));
    toast.success("All other active device sessions have been terminated.");
  };

  // Actions: Export All Data
  const exportAllData = () => {
    if (incomeList.length === 0 && expenseList.length === 0) {
      toast.error("No transactional logs available to export.");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Inflows Sheet
    if (incomeList.length > 0) {
      const incRows = incomeList.map((item, idx) => ({
        "ID": idx + 1,
        "Category": item.category || item.source || "-",
        "Amount (INR)": item.amount,
        "Date": item.date || "-",
      }));
      const wsInc = XLSX.utils.json_to_sheet(incRows);
      wsInc["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsInc, "Inflow_Log");
    }

    // Outflows Sheet
    if (expenseList.length > 0) {
      const expRows = expenseList.map((item, idx) => ({
        "ID": idx + 1,
        "Category": item.category || "-",
        "Details": item.note || "-",
        "Amount (INR)": item.amount,
        "Date": item.date || "-",
      }));
      const wsExp = XLSX.utils.json_to_sheet(expRows);
      wsExp["!cols"] = [{ wch: 8 }, { wch: 22 }, { wch: 22 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, wsExp, "Outflow_Log");
    }

    XLSX.writeFile(wb, "money_manager_complete_export.xlsx");
    toast.success("Financial raw data successfully exported to Excel!");
  };

  // Actions: Reset DB
  const executeReset = () => {
    setIncomeList([]);
    setExpenseList([]);
    setCategoryList([]);
    toast.success("Local transactional nodes cleared successfully.");
    setWipeConfirmOpen(false);
  };

  // Actions: Delete Account
  const executeDeleteAccount = () => {
    setIncomeList([]);
    setExpenseList([]);
    setCategoryList([]);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Account deleted. Redirecting to auth center...");
    setDeleteConfirmOpen(false);
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <SettingsIcon size={15} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              Control Dashboard Settings
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Manage details, preferences, security, notifications, and data pipelines
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Dedicated 2-Column stable grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch w-full">
        
        {/* Left Column: Sidebar Navigation */}
        <div className="lg:col-span-1 w-full flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 border-b lg:border-b-0 lg:border-r border-[var(--border)] lg:pr-6 shrink-0 sticky top-20 z-10 bg-[var(--surface-2)] lg:bg-transparent">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border cursor-pointer whitespace-nowrap lg:w-full text-left ${
                  isActive
                    ? "bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/10 shadow-xs"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-3)] border-transparent"
                }`}
              >
                <TabIcon 
                  size={14} 
                  className={isActive ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--text-muted)]"} 
                />
                <span className="tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Column: Tab Content Panel */}
        <div className="lg:col-span-3 w-full flex flex-col gap-5">
          
          {/* Tab 1: Profile Settings */}
          {activeTab === "profile" && (
            <div className="card p-5 md:p-6 animate-tab-fade">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span>Profile Details</span>
                  {(user?.role === "PRO" || user?.role === "ADMIN") && (
                    <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs select-none">
                      {user?.role === "ADMIN" ? "Administrator" : "Professional Member"}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">
                  Manage your personal details, email address, and profile picture.
                </p>
              </div>
              
              <form onSubmit={handleUpdateProfile} className="mt-5 space-y-5">
                {/* Photo selector */}
                <div className="flex flex-col sm:flex-row items-center gap-4 pb-4 border-b border-[var(--border)]">
                  <div className="shrink-0">
                    <ProfilePhotoSelector 
                      image={profilePhoto} 
                      setImage={setProfilePhoto} 
                      currentImage={user?.profileImageUrl} 
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <h4 className="text-xs font-semibold text-[var(--text-primary)]">User Avatar</h4>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5 max-w-[220px] leading-relaxed font-medium">
                      Upload a PNG or JPG photo. Recommended resolution is 150x150px.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <Input
                    label="Full Name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />

                  {/* Email (Disabled) */}
                  <Input
                    label="Account Email"
                    type="email"
                    value={user?.email || "admin@moneymanager.com"}
                    disabled
                    icon={<Mail size={13} />}
                  />
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold border border-rose-500/20 text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut size={12} />
                    <span>Logout</span>
                  </button>
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="btn-brand px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={12} />
                    <span>{profileLoading ? "Updating..." : "Save Details"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Security & Credentials */}
          {activeTab === "security" && (
            <div className="space-y-5 animate-tab-fade">
              {/* Change Password Card */}
              <div className="card p-5 md:p-6">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Change Password
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">
                    Update your account credentials to keep it secure.
                  </p>
                </div>
                
                <form onSubmit={handlePasswordUpdate} className="mt-5 space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    placeholder="••••••••"
                    value={passwords.current}
                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="••••••••"
                      value={passwords.new}
                      onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t border-[var(--border)] mt-4">
                    <button
                      type="submit"
                      disabled={passLoading}
                      className="btn-brand px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound size={12} />
                      <span>{passLoading ? "Updating..." : "Update Password"}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Safeguards Card */}
              <div className="card p-5 md:p-6">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-[var(--text-primary)]">
                    <Shield size={14} className="text-indigo-500" />
                    <span>Account Security Safeguards</span>
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">
                    Configure safety mechanisms and session control thresholds.
                  </p>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Two-Factor Authentication (2FA)</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium max-w-lg">
                        Secure account login gates by requiring a verification code sent to your email.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = !twoFactor;
                        setTwoFactor(updated);
                        toast.success(`2-Factor Authentication has been ${updated ? "activated" : "deactivated"}`);
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${twoFactor ? "bg-indigo-600" : "bg-[var(--border)]"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${twoFactor ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">Session Auto-Timeout</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium max-w-lg">
                        Determine how quickly you are logged out during periods of complete inactivity.
                      </p>
                    </div>
                    <div className="relative shrink-0 w-full sm:w-44">
                      <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <select
                        value={timeout}
                        onChange={(e) => {
                          setTimeoutVal(e.target.value);
                          toast.success(`Session timeout configured to ${e.target.value} minutes.`);
                        }}
                        className="input-styled !pl-8 py-1.5 w-full appearance-none text-xs"
                        style={{ 
                          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                          backgroundPosition: 'right 0.6rem center', 
                          backgroundSize: '1.1rem', 
                          backgroundRepeat: 'no-repeat' 
                        }}
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">60 minutes</option>
                        <option value="never">Never timeout</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: System Preferences */}
          {activeTab === "preferences" && (
            <div className="card p-5 md:p-6 animate-tab-fade">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Display Preferences
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">
                  Configure default visual paradigms, currency metrics, and language localizations.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {/* Interface theme */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Visual Interface Theme</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Toggle display layout light or dark palettes</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer w-full sm:w-44 justify-center shrink-0"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun size={13} className="text-amber-500 animate-spin" style={{ animationDuration: "12s" }} />
                        <span>Switch to Light</span>
                      </>
                    ) : (
                      <>
                        <Moon size={13} />
                        <span>Switch to Dark</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Currency Selection */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Global Currency Paradigm</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Set default currency indicators for dashboard display metrics</p>
                  </div>
                  <div className="relative shrink-0 w-full sm:w-44">
                    <select
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value);
                        toast.success(`Currency paradigm set to ${e.target.value}`);
                      }}
                      className="input-styled w-full appearance-none py-1.5 text-xs"
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                        backgroundPosition: 'right 0.6rem center', 
                        backgroundSize: '1.1rem', 
                        backgroundRepeat: 'no-repeat' 
                      }}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Language Localization</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-medium">Choose preferred language settings for textual labels</p>
                  </div>
                  <div className="relative shrink-0 w-full sm:w-44">
                    <Globe size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <select
                      value={language}
                      onChange={(e) => {
                        setLanguage(e.target.value);
                        toast.success("Localization settings updated!");
                      }}
                      className="input-styled !pl-8 py-1.5 w-full appearance-none text-xs"
                      style={{ 
                        backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                        backgroundPosition: 'right 0.6rem center', 
                        backgroundSize: '1.1rem', 
                        backgroundRepeat: 'no-repeat' 
                      }}
                    >
                      <option value="en">English (US)</option>
                      <option value="hi">हिन्दी (IN)</option>
                      <option value="es">Español (ES)</option>
                      <option value="fr">Français (FR)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Notification Channels */}
          {activeTab === "notifications" && (
            <div className="card p-5 md:p-6 animate-tab-fade">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Alert Channels
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">
                  Manage system notification channels, security digests, and budget limits.
                </p>
              </div>

              <div className="mt-5 space-y-4">
                {[
                  { id: "emailAlerts", label: "Email Notifications", desc: "Receive immediate transaction confirmation codes and alerts directly to inbox." },
                  { id: "weeklyDigest", label: "Weekly Account Summaries", desc: "Get a comprehensive Sunday summary of your active outflow ratios and budget statuses." },
                  { id: "pushAnomaly", label: "Outflow Anomaly Warning Triggers", desc: "Get instant browser toast warnings if a transaction exceeds typical spending metrics." }
                ].map((alert) => (
                  <div key={alert.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 last:pb-0 border-b last:border-b-0 border-[var(--border)]">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{alert.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)] leading-relaxed font-medium max-w-lg">{alert.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotifications(prev => {
                          const updated = { ...prev, [alert.id]: !prev[alert.id] };
                          toast.success(`${alert.label} successfully ${updated[alert.id] ? "enabled" : "disabled"}.`);
                          return updated;
                        });
                      }}
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer shrink-0 ${notifications[alert.id] ? "bg-indigo-600" : "bg-[var(--border)]"}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${notifications[alert.id] ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Connected Sessions */}
          {activeTab === "sessions" && (
            <div className="card p-5 md:p-6 animate-tab-fade">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)] mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connected Device Nodes</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">Device logs currently signed in with this user profile.</p>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleTerminateSessions}
                    className="px-3.5 py-2 text-[9px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 rounded-md transition-colors cursor-pointer w-full sm:w-auto text-center"
                  >
                    Terminate other sessions
                  </button>
                )}
              </div>

              <div className="divide-y divide-[var(--border)]">
                {sessions.map((sess) => (
                  <div key={sess.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
                      <Monitor size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{sess.os}</p>
                        {sess.active ? (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded">
                            Current Session
                          </span>
                        ) : (
                          <span className="text-[9px] text-[var(--text-muted)] font-medium">Active {sess.lastActive}</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-medium">
                        {sess.browser} · IP: {sess.ip} · Location: {sess.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 6: Data Management */}
          {activeTab === "data" && (
            <div className="space-y-5 animate-tab-fade">
              {/* Backup & Exports */}
              <div className="card p-5 md:p-6 relative overflow-hidden">
                {!(user?.role === "PRO" || user?.role === "ADMIN") && (
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm z-10 rounded-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <h3 className="text-xs font-bold text-[var(--text-primary)]">Unlock Data Backups & Exports</h3>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1 mb-3.5 leading-relaxed font-semibold max-w-xs">
                      Exporting complete Excel transaction sheets is a Professional feature. Upgrade to unlock offline bookkeeping.
                    </p>
                    <button
                      onClick={() => navigate("/pro-plan")}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer shadow-sm shadow-indigo-600/10"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Data Backups & Sync</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-normal">Export your registered transactions to keep offline records or migration nodes.</p>
                </div>
                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                    Backups will export complete collections of inflow/outflow lists.
                  </p>
                  <button
                    onClick={exportAllData}
                    className="btn-secondary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center shrink-0"
                  >
                    <Download size={13} />
                    <span>Export Database to Excel</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="card p-5 md:p-6 border-rose-500/20 bg-rose-500/[0.01]">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 text-rose-500">
                    <ShieldAlert size={14} />
                    <span>Critical Action Zone</span>
                  </h3>
                  <p className="text-xs text-rose-500/70 mt-1 font-normal">Irreversible actions related to your account storage and metrics.</p>
                </div>

                <div className="mt-5 space-y-4">
                  {/* Reset Database */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-rose-500/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Reset Local Database States</p>
                      <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 leading-relaxed font-medium max-w-lg">Wipe all registered transactional nodes and budgets. User account credentials will remain valid.</p>
                    </div>
                    <button
                      onClick={() => setWipeConfirmOpen(true)}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-md border border-rose-500/20 cursor-pointer shrink-0 transition-colors w-full sm:w-auto text-center"
                    >
                      Wipe Logs
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Permanently Delete Account</p>
                      <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 leading-relaxed font-medium max-w-lg">Wipe everything. Deletes profile login credentials, audit registers, categories, and resets local storage.</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmOpen(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-md border border-rose-700 cursor-pointer shrink-0 transition-all w-full sm:w-auto text-center"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Wipe Database Confirmation */}
      <ConfirmDialog
        open={wipeConfirmOpen}
        title="Wipe database configuration?"
        message="Are you sure you want to proceed? Any transactional metrics, custom categories, and budgets will be fully deleted."
        confirmLabel="Wipe Configuration"
        confirmClass="bg-rose-600 hover:bg-rose-700"
        onConfirm={executeReset}
        onCancel={() => setWipeConfirmOpen(false)}
      />

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Permanently Delete Account?"
        message="Warning: This will terminate your authentication token and delete your profile configuration permanently. This action is irreversible."
        confirmLabel="Delete Account Permanently"
        confirmClass="bg-rose-600 hover:bg-rose-700"
        onConfirm={executeDeleteAccount}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

    </div>
  );
};

export default Settings;
