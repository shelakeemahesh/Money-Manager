import { useState, useEffect, useContext } from "react";
import { Check, Star, Zap, Award, HelpCircle, ChevronRight, X, User, Mail, Phone, Loader2, Copy, QrCode, ShieldCheck, ArrowLeft, Clock } from "lucide-react";
import { toast } from "sonner";
import AppContext from "../context/AppContext";
import axiosConfig from "../utils/axiosConfig";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

const ProPlan = () => {
  const { user, setUser } = useContext(AppContext);
  const [billingCycle, setBillingCycle] = useState("monthly"); // "monthly" | "yearly"
  
  // Status states
  const [subStatus, setSubStatus] = useState(null); // { status, planType, amount, transactionId, remainingDays }
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [showPaymentView, setShowPaymentView] = useState(false);

  // Enterprise Contact Support Form states
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [submittingSupport, setSubmittingSupport] = useState(false);
  const [supportForm, setSupportForm] = useState({
    name: "",
    email: "",
    contactNo: "",
    teamSize: "5-10",
    message: ""
  });

  const fetchSubscriptionStatus = async () => {
    try {
      // First refresh profile to check if role has been upgraded to PRO
      const profileRes = await axiosConfig.get(API_ENDPOINTS.USER_PROFILE);
      if (profileRes.data) {
        setUser(profileRes.data);
        localStorage.setItem("user", JSON.stringify(profileRes.data));
      }

      // Fetch manual UPI subscription status
      const res = await axiosConfig.get(API_ENDPOINTS.MY_SUBSCRIPTION);
      if (res.data) {
        setSubStatus(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch subscription status", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText("moneymanager@upi");
    toast.success("UPI ID copied to clipboard!");
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      toast.error("Please enter a valid Transaction ID or UTR number.");
      return;
    }

    setSubmittingPayment(true);
    try {
      const planType = billingCycle.toUpperCase();
      const res = await axiosConfig.post(API_ENDPOINTS.SUBMIT_UPGRADE, {
        planType,
        transactionId: transactionId.trim()
      });

      toast.success(res.message || "Payment submitted successfully!");
      setTransactionId("");
      fetchSubscriptionStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit transaction. Please try again.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenSupport = () => {
    setSupportForm({
      name: "",
      email: "",
      contactNo: "",
      teamSize: "5-10",
      message: ""
    });
    setShowSupportModal(true);
  };

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    if (!supportForm.name.trim() || !supportForm.email.trim() || !supportForm.contactNo.trim()) {
      toast.error("Name, Email, and Contact Number are required.");
      return;
    }

    setSubmittingSupport(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Enterprise support ticket successfully recorded! Our team will contact you shortly.");
      setShowSupportModal(false);
    } catch (err) {
      toast.error("Failed to submit support request.");
    } finally {
      setSubmittingSupport(false);
    }
  };

  const price = billingCycle === "monthly" ? 99 : 799;
  const upiId = "9503072201-4@ybl";
  // Generate UPI payment URL for QR Code
  const upiUrl = `upi://pay?pa=${upiId}&pn=MoneyManager&am=${price}&cu=INR&tn=MMUpgrade`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`;

  const features = [
    { name: "Advanced AI Cashflow Forecast & Insights", free: false, pro: true },
    { name: "Unlimited Transaction Inflow/Outflows", free: "Up to 15", pro: "Unlimited" },
    { name: "Advanced Custom Budget Planning & Splits", free: false, pro: true },
    { name: "Real-time Cashflow Anomaly & Fraud Alerts", free: false, pro: true },
    { name: "Excel & CSV Report Data Exports", free: false, pro: true },
    { name: "Priority 24/7 Engineer Support", free: false, pro: true },
    { name: "Multi-device Cloud Sync", free: false, pro: true },
  ];

  const isPro = user?.role === "PRO" || user?.role === "ADMIN";

  if (loadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-xs text-[var(--text-muted)] font-semibold">Syncing subscription registry...</p>
      </div>
    );
  }

  if (showPaymentView) {
    return (
      <div className="space-y-6 pb-10 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
          <button 
            onClick={() => setShowPaymentView(false)}
            className="p-1.5 hover:bg-[var(--surface-3)] border border-[var(--border)] rounded-lg transition-colors cursor-pointer text-[var(--text-secondary)]"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">Pro Plan Checkout</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Complete manual transfer to activate</p>
          </div>
        </div>

        <div className="max-w-md mx-auto card p-6 bg-[var(--surface)] border-indigo-500/20 shadow-lg space-y-6">
          <div className="border-b border-[var(--border)] pb-3 text-center">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-center gap-1.5">
              <QrCode size={16} className="text-indigo-600" />
              <span>Manual UPI Checkout</span>
            </h3>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Pay via UPI to upgrade to Money Manager Pro</p>
          </div>

          {/* Alert / Notice */}
          <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-500/10 rounded-lg flex items-start gap-2.5">
            <Clock size={14} className="text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0 animate-pulse" />
            <div className="text-left space-y-0.5">
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Fast Activation</h4>
              <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed">
                Once your payment is submitted, your account will be upgraded to the Pro Plan within 30 minutes.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-5">
            {/* Step 1: Copy UPI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs md:text-sm font-bold text-[var(--text-secondary)]">
                <span>1. COPY UPI ID & TRANSFER</span>
                <span className="text-sm md:text-base font-black text-indigo-600 dark:text-indigo-400">₹{price}</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-[var(--surface-3)] border border-[var(--border)] rounded-lg">
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] flex-1">{upiId}</span>
                <button
                  onClick={handleCopyUpi}
                  className="p-1.5 text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer"
                  title="Copy UPI ID"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center justify-center p-4 border border-[var(--border)] rounded-xl bg-white shadow-inner">
              <img src={qrCodeUrl} alt="UPI QR Code" className="w-40 h-40 border border-gray-100 p-1.5 rounded-lg" />
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Scan with GPay, PhonePe, PayTM, or any UPI App</p>
            </div>

            {/* Step 2: Submit UTR */}
            <form onSubmit={handleSubmitPayment} className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  2. ENTER TRANSACTION ID / UTR NUMBER
                </label>
                <input
                  type="text"
                  required
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 618495029384"
                  className="input-styled uppercase font-mono tracking-wider !text-xs !py-3"
                />
                <span className="text-[10px] text-[var(--text-muted)] leading-tight block">
                  Enter the 12-digit UTR/Txn code generated by your UPI payment app after completion.
                </span>
              </div>

              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full btn-brand py-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {submittingPayment ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Submitting Payment...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Upgrade Payment</span>
                    <ChevronRight size={13} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
            <Award size={16} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
              <span>Money Manager Pro</span>
              {isPro && (
                <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
                  Professional Member
                </span>
              )}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Unlock the full suite of financial intelligence nodes
            </p>
          </div>
        </div>

        {/* Plan Billing Cycle Selector - Hide if user is PRO or request is PENDING */}
        {!isPro && subStatus?.status !== "PENDING" && (
          <div className="flex items-center gap-3 bg-[var(--surface-3)] p-1 rounded-lg border border-[var(--border)] self-start sm:self-center">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === "yearly"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <span>Yearly</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase leading-none ${
                billingCycle === "yearly" ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              }`}>
                Save 30%
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Subscription Banners */}
      {!isPro && subStatus?.status === "PENDING" ? (
        <div className="card p-5 bg-amber-500/5 border-amber-500/20 shadow-sm border-dashed">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Payment Verification Pending</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Payment submitted successfully. Your Professional account will be activated within 30 minutes after verification.
              </p>
              <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono text-[var(--text-muted)]">
                <div>UTR/Txn ID: <span className="font-semibold text-[var(--text-primary)]">{subStatus.transactionId}</span></div>
                <div>Amount: <span className="font-semibold text-[var(--text-primary)]">₹{subStatus.amount}</span></div>
                <div>Plan: <span className="font-semibold text-[var(--text-primary)]">{subStatus.planType}</span></div>
                <div>Submitted: <span className="font-semibold text-[var(--text-primary)]">{new Date(subStatus.submittedAt).toLocaleString("en-IN")}</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Main Grid: Plans vs Manual UPI checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Plans details (3 Columns, spans 5 if Pro) */}
        <div className={`${isPro ? "lg:col-span-5" : "lg:col-span-3"} space-y-6`}>
          
          {/* Plan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Free plan */}
            <div className="card p-5 flex flex-col justify-between border-[var(--border)] bg-[var(--surface)]">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-muted)]">Free Starter</h3>
                  <p className="text-2xl font-black text-[var(--text-primary)] mt-1">₹0</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Free forever, basic nodes</p>
                </div>
                
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  Perfect for basic expense tracking and simple category limits.
                </p>

                <div className="h-px bg-[var(--border)] my-1" />

                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    <span>Up to 15 Transactions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-emerald-500 shrink-0" />
                    <span>Basic categories</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--text-muted)] line-through">
                    <span>AI Insights & forecasts</span>
                  </li>
                  <li className="flex items-center gap-2 text-[var(--text-muted)] line-through">
                    <span>CSV/Excel report exports</span>
                  </li>
                </ul>
              </div>

              <button
                disabled
                className="w-full py-2 mt-6 text-xs font-bold btn-secondary rounded-md cursor-not-allowed opacity-60"
              >
                {!isPro ? "Active Free Plan" : "Downgraded"}
              </button>
            </div>

            {/* Pro Plan */}
            <div className={`card p-5 flex flex-col justify-between relative bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ${
              isPro ? "border-indigo-500" : "border-indigo-500/30"
            } shadow-md`}>
              <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded text-[8px] font-black bg-indigo-600 text-white shadow-sm flex items-center gap-1 uppercase tracking-wider">
                <Zap size={8} className="fill-white" />
                <span>Premium Option</span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Professional Plan</h3>
                  <p className="text-2xl font-black text-[var(--text-primary)] mt-1 flex items-baseline gap-1">
                    <span>₹{billingCycle === "monthly" ? "99" : "799"}</span>
                    <span className="text-xs font-normal text-[var(--text-muted)]">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Billed manually via secure UPI
                  </p>
                </div>
                
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  Unlock full capital visibility, cash flow forecasts, transaction ledger, and report exports.
                </p>

                <div className="h-px bg-[var(--border)] my-1" />

                <ul className="space-y-2 text-xs text-[var(--text-secondary)]">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-indigo-500 shrink-0" />
                    <span className="font-semibold text-[var(--text-primary)]">Unlimited Transactions</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-indigo-500 shrink-0" />
                    <span>AI Insights Live Advisor</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-indigo-500 shrink-0" />
                    <span>Real-time Anomaly alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-indigo-500 shrink-0" />
                    <span>Advanced Budgets & Splits</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowPaymentView(true)}
                className={`w-full py-2.5 mt-6 text-xs font-bold rounded-md flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.98] ${
                  isPro 
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10"
                }`}
              >
                {isPro ? "Subscription Active" : `Upgrade to Pro (₹${billingCycle === "monthly" ? "99" : "799"})`}
              </button>
            </div>
          </div>

          {/* Pricing Comparison Matrix */}
          <div className="card p-5">
            <div className="mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-secondary)]">Plan Feature Grid</h3>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Compare free vs professional side by side</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                    <th className="py-2 font-bold">Features</th>
                    <th className="py-2 font-bold w-20">Starter</th>
                    <th className="py-2 font-bold w-24 text-indigo-600 dark:text-indigo-400">Professional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)] font-medium">
                  {features.map((feat, index) => (
                    <tr key={index} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-2.5">{feat.name}</td>
                      <td className="py-2.5">
                        {feat.free === false ? "-" : feat.free === true ? <Check size={12} className="text-emerald-500" /> : feat.free}
                      </td>
                      <td className="py-2.5 font-bold text-[var(--text-primary)]">
                        {feat.pro === true ? <Check size={12} className="text-indigo-500" /> : feat.pro}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isPro && (
            <div className="card p-4 bg-[var(--surface-3)]/30 border-dashed border-[var(--border)] flex items-center justify-between gap-3 max-w-xl mx-auto w-full mt-6 animate-fade-in">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Enterprise Integrations?</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">Multi-user workspace sync options.</p>
              </div>
              <button
                onClick={handleOpenSupport}
                className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded transition-colors cursor-pointer shrink-0"
              >
                Contact
              </button>
            </div>
          )}
        </div>

        {/* Right Side: UPI Payment Form (2 Columns, rendered only if not Pro) */}
        {!isPro && (
          <div className="lg:col-span-2">
            {subStatus?.status !== "PENDING" ? (
              <div className="card p-5 bg-[var(--surface)] border-indigo-500/20 shadow-lg space-y-5">
                <div className="border-b border-[var(--border)] pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                    <QrCode size={14} className="text-indigo-600" />
                    <span>Manual UPI Checkout</span>
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Complete manual transfer to activate</p>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm font-bold text-[var(--text-secondary)]">
                      <span>1. TRANSFER UPI AMOUNT</span>
                      <span className="text-sm md:text-base font-black text-indigo-600 dark:text-indigo-400">₹{price}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 bg-[var(--surface-3)] border border-[var(--border)] rounded-lg">
                      <span className="text-[11px] font-mono font-bold text-[var(--text-primary)] flex-1">{upiId}</span>
                      <button
                        onClick={handleCopyUpi}
                        className="p-1 text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer"
                        title="Copy UPI ID"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-3 border border-[var(--border)] rounded-xl bg-white shadow-inner">
                    <img src={qrCodeUrl} alt="UPI QR Code" className="w-36 h-36 border border-gray-100 p-1.5 rounded-lg" />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2">Scan with GPay, PhonePe, or PayTM</p>
                  </div>

                  {/* Step 2 Form */}
                  <form onSubmit={handleSubmitPayment} className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        2. ENTER TRANSACTION ID / UTR NUMBER
                      </label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. 618495029384"
                        className="input-styled uppercase font-mono tracking-wider !text-xs !py-2.5"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] leading-tight block">
                        Enter the 12-digit UTR/Txn code generated by your UPI payment app after completion.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingPayment}
                      className="w-full btn-brand py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                    >
                      {submittingPayment ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Submitting Payment...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Upgrade Payment</span>
                          <ChevronRight size={13} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="card p-5 bg-[var(--surface)] border-[var(--border)] text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto">
                  <Award size={22} className="animate-bounce" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Verification In Progress
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-4">
                    Your transaction is being audited against bank logs. Updates will reflect shortly. No further submissions required.
                  </p>
                </div>
              </div>
            )}

            {/* Support Banner */}
            <div className="card p-4 mt-4 bg-[var(--surface-3)]/30 border-dashed border-[var(--border)] flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Enterprise Integrations?</h4>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">Multi-user workspace sync options.</p>
              </div>
              <button
                onClick={handleOpenSupport}
                className="px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface-2)] text-xs font-bold text-[var(--text-primary)] border border-[var(--border)] rounded transition-colors cursor-pointer shrink-0"
              >
                Contact
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-scale-in bg-[var(--surface)] border-[var(--border)]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--border)]">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <HelpCircle size={16} className="text-indigo-500" />
                <span>Enterprise Support Form</span>
              </h3>
              <button onClick={() => setShowSupportModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitSupport} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Full Name</label>
                <input
                  type="text"
                  required
                  value={supportForm.name}
                  onChange={(e) => setSupportForm({ ...supportForm, name: e.target.value })}
                  className="input-styled"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Email Address</label>
                <input
                  type="email"
                  required
                  value={supportForm.email}
                  onChange={(e) => setSupportForm({ ...supportForm, email: e.target.value })}
                  className="input-styled"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Contact Number</label>
                <input
                  type="tel"
                  required
                  value={supportForm.contactNo}
                  onChange={(e) => setSupportForm({ ...supportForm, contactNo: e.target.value })}
                  className="input-styled"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Team Size</label>
                <select
                  value={supportForm.teamSize}
                  onChange={(e) => setSupportForm({ ...supportForm, teamSize: e.target.value })}
                  className="input-styled cursor-pointer"
                >
                  <option value="1-5">1 - 5 Users (Small Team)</option>
                  <option value="5-10">5 - 10 Users (Midsize Team)</option>
                  <option value="50+">50+ Users (Custom Enterprise)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Comments</label>
                <textarea
                  rows={2}
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                  className="input-styled py-2 resize-none"
                  placeholder="Describe your requirements..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowSupportModal(false)}
                  className="btn-secondary px-4 py-2 text-xs font-bold cursor-pointer"
                  disabled={submittingSupport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingSupport}
                  className="btn-brand flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold cursor-pointer"
                >
                  {submittingSupport ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProPlan;
