import { useContext, useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Calendar,
  ChevronDown,
  MoreVertical,
  Briefcase,
  Utensils,
  Car,
  Zap,
  Laptop,
  Sparkles,
  ArrowRight,
  Download,
  Plus,
  Trophy,
  Award,
  Loader2
} from "lucide-react";
import AppContext from "../context/AppContext";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import axiosConfig from "../utils/axiosConfig";
import { API_ENDPOINTS } from "../utils/apiEndpoints";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const Home = () => {
  const { user, setUser, totalIncome, totalExpense, totalBalance, incomeList, expenseList } = useContext(AppContext);
  const navigate = useNavigate();

  const [dateFilter, setDateFilter] = useState("This Week");
  const [subStatus, setSubStatus] = useState(null);
  const [loadingSub, setLoadingSub] = useState(true);

  useEffect(() => {
    const syncStatus = async () => {
      try {
        // Sync profile to get latest role
        const profileRes = await axiosConfig.get(API_ENDPOINTS.USER_PROFILE);
        if (profileRes.data) {
          setUser(profileRes.data);
          localStorage.setItem("user", JSON.stringify(profileRes.data));
        }

        // Get subscription status
        const subRes = await axiosConfig.get(API_ENDPOINTS.MY_SUBSCRIPTION);
        if (subRes.data) {
          setSubStatus(subRes.data);
        }
      } catch (err) {
        console.error("Failed to sync user subscription status", err);
      } finally {
        setLoadingSub(false);
      }
    };
    
    if (user) {
      syncStatus();
    }
  }, []);

  // Determine fallback data or dynamic data
  const hasData = incomeList.length > 0 || expenseList.length > 0;

  // 1. Core Metrics
  const displayBalance = hasData ? totalBalance : 0;
  const displayIncome = hasData ? totalIncome : 0;
  const displayExpense = hasData ? totalExpense : 0;
  const displaySavingsRate = hasData 
    ? (totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 1000) / 10 : 0) 
    : 0;

  // 2. Spending Overview Chart Data (Daily breakdown)
  const spendingChartData = hasData 
    ? (() => {
        // Compute daily spending for current week dynamically
        const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const dayMap = days.reduce((acc, d) => ({ ...acc, [d]: 0 }), {});
        expenseList.forEach(e => {
          if (!e.date) return;
          const dayName = new Date(e.date).toLocaleDateString("en-US", { weekday: "short" });
          if (dayMap[dayName] !== undefined) {
            dayMap[dayName] += e.amount || 0;
          }
        });
        return days.map(d => ({ day: d, amount: dayMap[d] }));
      })()
    : [];

  // 3. Category Breakdowns
  const categoriesData = hasData 
    ? (() => {
        const catMap = {};
        expenseList.forEach(e => {
          catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0);
        });
        const total = Object.values(catMap).reduce((a, b) => a + b, 0) || 1;
        return Object.entries(catMap).map(([name, val]) => ({
          name,
          value: val,
          percent: Math.round((val / total) * 1000) / 10
        })).sort((a, b) => b.value - a.value);
      })()
    : [];

  // Map category fills for charts
  const categoryFills = {
    "Food & Dining": "#8b5cf6",
    "Transport": "#3b82f6",
    "Shopping": "#10b981",
    "Bills & Utilities": "#f97316",
    "Entertainment": "#ef4444",
    "Others": "#94a3b8"
  };

  const donutData = categoriesData.map(c => ({
    ...c,
    fill: categoryFills[c.name] || "#6366f1"
  }));

  // 4. Recent Transactions
  const displayTransactions = hasData
    ? [
        ...incomeList.map((i) => ({ ...i, type: "Income" })),
        ...expenseList.map((e) => ({ ...e, type: "Expense" })),
      ]
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
        .slice(0, 5)
        .map(t => {
          let colorClass = "bg-emerald-500/10 text-emerald-600";
          let LucideIcon = Briefcase;
          if (t.type === "Expense") {
            colorClass = "bg-rose-500/10 text-rose-600";
            if (t.category === "Food & Dining") { colorClass = "bg-purple-500/10 text-purple-600"; LucideIcon = Utensils; }
            else if (t.category === "Transport") { colorClass = "bg-blue-500/10 text-blue-600"; LucideIcon = Car; }
            else if (t.category === "Bills & Utilities") { colorClass = "bg-orange-500/10 text-orange-600"; LucideIcon = Zap; }
            else { colorClass = "bg-slate-500/10 text-slate-600"; LucideIcon = Laptop; }
          }
          return {
            name: t.source || t.category || "Transaction",
            date: t.date ? new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "May 24, 2026",
            subtitle: t.type === "Income" ? "Income" : t.category,
            amount: t.amount,
            type: t.type,
            colorClass,
            icon: LucideIcon
          };
        })
    : [];

  // 5. Budgets
  const displayBudgets = hasData
    ? categoriesData.slice(0, 4).map(c => {
        const caps = { "Food & Dining": 10000, "Transport": 8000, "Shopping": 7000, "Bills & Utilities": 6000 };
        const cap = caps[c.name] || Math.round(c.value * 1.3);
        const percent = Math.min(Math.round((c.value / cap) * 100), 100);
        return {
          name: c.name,
          spent: c.value,
          total: cap,
          percent,
          color: categoryFills[c.name] || "#6366f1",
          bgColor: `${categoryFills[c.name] || "#6366f1"}10`
        };
      })
    : [];

  const downloadAll = () => {
    if (user?.role !== "PRO" && user?.role !== "ADMIN") {
      toast.error("Export features are locked for Free accounts. Please upgrade to Pro!");
      navigate("/pro-plan");
      return;
    }
    if (incomeList.length === 0 && expenseList.length === 0) {
      toast.error("No data to download yet.");
      return;
    }
    const wb = XLSX.utils.book_new();

    const incomeRows = incomeList.map((item, i) => ({
      "S.No": i + 1,
      "Source": item.source,
      "Category": item.category || "-",
      "Amount": item.amount,
      "Date": item.date || "-",
    }));
    const wsIncome = XLSX.utils.json_to_sheet(
      incomeRows.length ? incomeRows : [{ "S.No": "-", "Source": "No data", "Category": "-", "Amount": 0, "Date": "-" }]
    );
    wsIncome["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsIncome, "Income");

    const expenseRows = expenseList.map((item, i) => ({
      "S.No": i + 1,
      "Note": item.note || item.category,
      "Category": item.category,
      "Amount": item.amount,
      "Date": item.date || "-",
    }));
    const wsExpense = XLSX.utils.json_to_sheet(
      expenseRows.length ? expenseRows : [{ "S.No": "-", "Note": "No data", "Category": "-", "Amount": 0, "Date": "-" }]
    );
    wsExpense["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsExpense, "Expenses");

    XLSX.writeFile(wb, "money_manager_fintech_report.xlsx");
    toast.success("Detailed report compiled & downloaded!");
  };

  return (
    <div className="space-y-4 lg:space-y-0 lg:h-full lg:flex lg:flex-col lg:min-h-0 lg:gap-4 lg:overflow-hidden w-full animate-fade-in">

      {/* Date Filter & Export Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">Aesthetic Dashboard</span>
          <button 
            onClick={() => navigate("/pro-plan")}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-all select-none"
          >
            <Trophy size={8} className="fill-indigo-600 dark:fill-indigo-400 animate-pulse" />
            <span>PRO</span>
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-end">
          {/* Calendar Picker Mockup */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] shadow-sm cursor-pointer hover:bg-[var(--surface-3)] transition-colors">
            <Calendar size={13} className="text-[var(--text-muted)]" />
            <span className="font-medium">May 18 - May 24, 2026</span>
            <ChevronDown size={11} className="text-[var(--text-muted)]" />
          </div>

          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-styled py-1.5 w-28 appearance-none text-xs pr-8"
              style={{ 
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 0.75rem center', 
                backgroundSize: '1.25rem', 
                backgroundRepeat: 'no-repeat' 
              }}
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <button
            onClick={downloadAll}
            className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              user?.role === "PRO" || user?.role === "ADMIN"
                ? "btn-secondary"
                : "bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20"
            }`}
            title="Download CSV Reports"
          >
            {user?.role === "PRO" || user?.role === "ADMIN" ? <Download size={13} /> : <Zap size={13} className="text-indigo-500 animate-pulse animate-duration-1000" />}
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Subscription Banners */}
      {user?.role === "PRO" && subStatus?.remainingDays !== undefined && (
        <div className="card p-3.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/5 border-indigo-500/20 shadow-sm flex items-center justify-between shrink-0 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Award size={14} className="fill-indigo-600 dark:fill-indigo-400 animate-pulse" />
            <span className="text-[11px] font-bold">Professional Member Active • Remaining days: {subStatus.remainingDays}</span>
          </div>
          <button onClick={() => navigate("/pro-plan")} className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            Manage Subscription
          </button>
        </div>
      )}
      {user?.role !== "PRO" && user?.role !== "ADMIN" && subStatus?.status === "PENDING" && (
        <div className="card p-3.5 bg-amber-500/5 border-amber-500/20 border-dashed shadow-sm flex items-center justify-between shrink-0 mb-4 animate-fade-in">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <Loader2 size={13} className="animate-spin" />
            <span className="text-[11px] font-semibold">Payment verification pending. Pro features will unlock within 30 minutes.</span>
          </div>
          <button onClick={() => navigate("/pro-plan")} className="text-[9px] font-bold text-amber-600 dark:text-amber-500 hover:underline cursor-pointer">
            View Details
          </button>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {/* Balance Card */}
        <div className="card p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Balance</p>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{formatCurrency(displayBalance)}</h3>
              {hasData ? (
                <p className="text-[9px] font-semibold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <span>↑ 12.5%</span>
                  <span className="text-[var(--text-muted)] font-normal">vs last week</span>
                </p>
              ) : (
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">No recent activity</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-500 border border-indigo-500/10 flex items-center justify-center shrink-0">
              <Wallet size={14} />
            </div>
          </div>
        </div>

        {/* Income Card */}
        <div className="card p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Income</p>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{formatCurrency(displayIncome)}</h3>
              {hasData ? (
                <p className="text-[9px] font-semibold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <span>↑ 18.2%</span>
                  <span className="text-[var(--text-muted)] font-normal">vs last week</span>
                </p>
              ) : (
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">No recent activity</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-500 border border-emerald-500/10 flex items-center justify-center shrink-0">
              <TrendingUp size={14} />
            </div>
          </div>
        </div>

        {/* Expense Card */}
        <div className="card p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Expense</p>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{formatCurrency(displayExpense)}</h3>
              {hasData ? (
                <p className="text-[9px] font-semibold text-rose-500 flex items-center gap-1 mt-0.5">
                  <span>↓ 8.4%</span>
                  <span className="text-[var(--text-muted)] font-normal">vs last week</span>
                </p>
              ) : (
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">No recent activity</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-orange-500/5 dark:bg-orange-500/10 text-orange-500 border border-orange-500/10 flex items-center justify-center shrink-0">
              <TrendingDown size={14} />
            </div>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="card p-4 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Savings Rate</p>
              <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{displaySavingsRate}%</h3>
              {hasData ? (
                <p className="text-[9px] font-semibold text-emerald-500 flex items-center gap-1 mt-0.5">
                  <span>↑ 6.3%</span>
                  <span className="text-[var(--text-muted)] font-normal">vs last week</span>
                </p>
              ) : (
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">No recent activity</p>
              )}
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 text-blue-500 border border-blue-500/10 flex items-center justify-center shrink-0">
              <Percent size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Spending Overview & Expense by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:flex-1 lg:min-h-0">

        {/* Spending Overview Area Chart - 3 cols */}
        <div className="lg:col-span-3 card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2 shrink-0">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Spending Overview</h3>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-black text-[var(--text-primary)]">{formatCurrency(displayExpense)}</span>
                {hasData && (
                  <span className="text-[9px] font-semibold text-rose-500 flex items-center gap-0.5">
                    <span>↓ 8.4%</span>
                    <span className="text-[var(--text-muted)] font-normal">vs last week</span>
                  </span>
                )}
              </div>
            </div>
            
            <select className="input-styled py-1 w-24 text-[10px] cursor-pointer appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 0.5rem center', 
                backgroundSize: '1rem', 
                backgroundRepeat: 'no-repeat' 
              }}
            >
              <option>This Week</option>
            </select>
          </div>

          <div className="flex-1 min-h-0 w-full flex items-center justify-center">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={40} />
                  <RechartsTooltip 
                    formatter={(v) => formatCurrency(v)} 
                    contentStyle={{ 
                      background: "var(--surface)", 
                      border: "1px solid var(--border)", 
                      borderRadius: "8px", 
                      fontSize: 10,
                      boxShadow: "var(--shadow-sm)"
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#6366f1" 
                    strokeWidth={1.5}
                    fillOpacity={1} 
                    fill="url(#spendingGradient)" 
                    activeDot={{ r: 3, stroke: "#6366f1", strokeWidth: 1 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">No spending activity</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Transactions added will show up in the chart</p>
              </div>
            )}
          </div>
        </div>

        {/* Expense by Category Donut Chart - 2 cols */}
        <div className="lg:col-span-2 card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2 shrink-0">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Expense by Category</h3>
            </div>
            <select className="input-styled py-1 w-24 text-[10px] cursor-pointer appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
                backgroundPosition: 'right 0.5rem center', 
                backgroundSize: '1rem', 
                backgroundRepeat: 'no-repeat' 
              }}
            >
              <option>This Week</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between flex-1 min-h-0 gap-4">
            {hasData ? (
              <>
                {/* Donut graphic */}
                <div className="w-[110px] h-[110px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius="65%"
                        outerRadius="90%"
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[9px] text-[var(--text-muted)] font-medium leading-none">Total</span>
                    <span className="text-xs font-black text-[var(--text-primary)] mt-0.5">{formatCurrency(displayExpense)}</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 min-w-0 w-full space-y-1 overflow-y-auto h-full pr-1 scrollbar-thin">
                  {donutData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] py-1 border-b border-[var(--border)]/30 last:border-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="font-medium text-[var(--text-secondary)] truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-[var(--text-primary)]">{formatCurrency(item.value)}</span>
                        <span className="text-[var(--text-muted)] text-[8px] w-8 text-right">{item.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 w-full h-full">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">No categories recorded</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Create transactions to view category share</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom row: Recent Transactions, Budget Overview, AI Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:flex-1 lg:min-h-0">

        {/* Column 1: Recent Transactions */}
        <div className="card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2 shrink-0">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Recent Transactions</h3>
            <button 
              onClick={() => navigate("/filter")}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 cursor-pointer hover:opacity-85"
            >
              <span>View All</span>
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin min-h-0">
            {hasData ? (
              displayTransactions.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 ${t.colorClass}`}>
                      <t.icon size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate leading-none mb-1">{t.name}</p>
                      <p className="text-[9px] text-[var(--text-muted)] leading-none">{t.date} • {t.subtitle}</p>
                    </div>
                  </div>
                  <div className={`text-xs font-bold shrink-0 ${t.type === "Income" ? "text-emerald-500" : "text-rose-500"}`}>
                    {t.type === "Income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">No transactions yet</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Start by adding incomes or expenses</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Budget Overview */}
        <div className="card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2 shrink-0">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Budget Overview</h3>
            <button 
              onClick={() => navigate("/budget")}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5 cursor-pointer hover:opacity-85"
            >
              <span>View All</span>
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 scrollbar-thin min-h-0">
            {hasData ? (
              displayBudgets.map((b, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[9px] leading-none">
                    <span className="font-semibold text-[var(--text-secondary)]">{b.name}</span>
                    <span className="text-[var(--text-muted)]">
                      <strong className="text-[var(--text-primary)]">{formatCurrency(b.spent)}</strong> / {formatCurrency(b.total)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${b.percent}%`,
                          backgroundColor: b.color
                        }} 
                      />
                    </div>
                    <span className="text-[8px] font-bold text-[var(--text-secondary)] w-6 text-right shrink-0">{b.percent}%</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">No active budgets</p>
                <p className="text-[9px] text-[var(--text-muted)] mt-0.5">Your spending categories will show up here</p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: AI Insight Card */}
        <div className="card p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 border-b border-[var(--border)] pb-2 shrink-0">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">AI Insight</h3>
            <span className="px-1.5 py-0.5 text-[8px] font-bold text-indigo-600 bg-indigo-500/10 border border-indigo-500/15 rounded-full leading-none shrink-0">
              New
            </span>
          </div>

          <div className="flex flex-col items-center justify-center text-center p-2 flex-1 min-h-0">
            <div className="w-10 h-10 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full border border-indigo-500/10 flex items-center justify-center mb-3 text-indigo-600 dark:text-indigo-400">
              <Sparkles size={18} className="animate-pulse" />
            </div>
            <p className="text-xs font-bold leading-normal max-w-[200px]" style={{ color: "var(--text-primary)" }}>
              {hasData 
                ? "You spent ₹2,150 less on Food & Dining this week compared to last week."
                : "AI Insights will automatically analyze spending patterns once you start logging transactions."}
            </p>
          </div>

          <button 
            onClick={() => navigate("/ai-insights")}
            className="btn-secondary w-full py-1.5 text-xs font-bold cursor-pointer mt-2"
          >
            View Details
          </button>
        </div>

      </div>
    </div>
  );
};

export default Home;
