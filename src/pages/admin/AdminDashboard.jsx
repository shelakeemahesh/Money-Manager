import { useState, useEffect, useContext, useCallback } from "react";
import { Users, ScrollText, IndianRupee, Activity, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from "lucide-react";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import axiosConfig from "../../utils/axiosConfig";
import AppContext from "../../context/AppContext";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

const AdminDashboard = () => {
  const { theme } = useContext(AppContext);
  const isDark = theme === "dark";

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Range Filtering
  const [rangePreset, setRangePreset] = useState("30"); // 7, 30, 90, custom
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Revenue Chart toggle
  const [revenueToggle, setRevenueToggle] = useState("weekly"); // weekly | monthly

  const fetchAnalytics = useCallback(async () => {
    let fromStr = "";
    let toStr = "";

    const today = new Date();
    if (rangePreset !== "custom") {
      const days = parseInt(rangePreset);
      const pastDate = new Date();
      pastDate.setDate(today.getDate() - days);
      fromStr = pastDate.toISOString().split("T")[0];
      toStr = today.toISOString().split("T")[0];
    } else {
      if (!customFrom || !customTo) return; // Wait for both custom dates
      fromStr = customFrom;
      toStr = customTo;
    }

    setLoading(true);
    try {
      const response = await axiosConfig.get(API_ENDPOINTS.ADMIN_ANALYTICS, {
        params: {
          from: fromStr,
          to: toStr
        }
      });
      if (response.data) {
        setAnalyticsData(response.data);
      }
    } catch {
      toast.error("Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  }, [rangePreset, customFrom, customTo]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePresetChange = (e) => {
    const val = e.target.value;
    setRangePreset(val);
    if (val === "custom") {
      setShowCustomDates(true);
    } else {
      setShowCustomDates(false);
    }
  };

  // Color tokens based on dark/light mode
  const gridColor = isDark ? "#2a2d35" : "#f1f2f4";
  const textColor = isDark ? "#9fa6b2" : "#6b7280";
  const tooltipBg = isDark ? "#1e222b" : "#ffffff";
  const tooltipBorder = isDark ? "#2a2d35" : "#e5e7eb";

  const barColor = "#6366f1";
  const lineColor = "#8b5cf6";
  const growthColor = "#10b981";

  const PIE_COLORS = ["#10b981", "#ef4444"];

  if (loading && !analyticsData) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <Loader2 size={36} className="animate-spin text-indigo-500 mb-2" />
        <span className="text-xs font-semibold text-[var(--text-secondary)]">Analyzing cluster data metrics...</span>
      </div>
    );
  }

  const kpis = [
    { 
      title: "Total Registered Users", 
      value: analyticsData?.totalRegisteredUsers || 0, 
      desc: "Accounts in database",
      icon: Users, 
      color: "text-blue-500", 
      bg: "bg-blue-500/5 border-blue-500/10 dark:bg-blue-500/10 dark:border-blue-500/20" 
    },
    { 
      title: "Transaction Volume", 
      value: `₹${(analyticsData?.totalTransactionsVolume || 0).toLocaleString("en-IN")}`, 
      desc: `${analyticsData?.totalTransactionsCount || 0} platform logs`,
      icon: ScrollText, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/5 border-emerald-500/10 dark:bg-emerald-500/10 dark:border-emerald-500/20" 
    },
    { 
      title: "Platform SaaS Revenue", 
      value: `₹${(analyticsData?.totalPlatformRevenue || 0).toLocaleString("en-IN")}`, 
      desc: "Simulated subscriptions",
      icon: IndianRupee, 
      color: "text-purple-500", 
      bg: "bg-purple-500/5 border-purple-500/10 dark:bg-purple-500/10 dark:border-purple-500/20" 
    },
    { 
      title: "Monthly Active Users", 
      value: analyticsData?.monthlyActiveUsers || 0, 
      desc: "Logged entries in last 30d",
      icon: Activity, 
      color: "text-amber-500", 
      bg: "bg-amber-500/5 border-amber-500/10 dark:bg-amber-500/10 dark:border-amber-500/20" 
    },
  ];

  const revenueChartData = analyticsData?.revenueTrends?.[revenueToggle] || [];
  const categoryChartData = analyticsData?.expenseCategories || [];
  const ratioChartData = analyticsData?.incomeVsExpense || [];
  const growthChartData = analyticsData?.platformGrowth || [];

  return (
    <div className="space-y-6">
      {/* Header & Date controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Financial Analytics Dashboard</h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time metrics, growth trends, anomaly alerts, and revenue tracking</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {showCustomDates && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="input-styled py-1.5 px-3 text-xs w-full sm:w-36"
              />
              <span className="text-xs text-[var(--text-muted)]">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="input-styled py-1.5 px-3 text-xs w-full sm:w-36"
              />
            </div>
          )}

          <select
            value={rangePreset}
            onChange={handlePresetChange}
            className="input-styled appearance-none py-2 pr-8 text-xs font-semibold w-full sm:w-40"
            style={{ 
              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, 
              backgroundPosition: 'right 0.75rem center', 
              backgroundSize: '1.25rem', 
              backgroundRepeat: 'no-repeat' 
            }}
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="custom">Custom Range</option>
          </select>

          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="btn-secondary px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((stat, i) => (
          <div key={i} className="card p-5 relative overflow-hidden bg-[var(--surface)] hover:scale-[1.01] transition-transform duration-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{stat.title}</p>
                <h3 className="text-2xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>{stat.value}</h3>
                <p className="text-[10px] mt-1 font-semibold" style={{ color: "var(--text-muted)" }}>{stat.desc}</p>
              </div>
              <div className={`p-2.5 rounded-[var(--radius-sm)] border ${stat.bg}`}>
                <stat.icon size={15} className={stat.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Block 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Revenue Trends */}
        <div className="card p-5 lg:col-span-2 flex flex-col justify-between h-[360px] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Platform Revenue Trends</h3>
              <p className="text-[10px] mt-0.5 text-[var(--text-muted)]">Subscription billing volumes over time</p>
            </div>
            
            <div className="flex items-center bg-[var(--surface-3)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--border)]">
              <button
                onClick={() => setRevenueToggle("weekly")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer ${revenueToggle === "weekly" ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}
              >
                Weekly
              </button>
              <button
                onClick={() => setRevenueToggle("monthly")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-[var(--radius-sm)] transition-all cursor-pointer ${revenueToggle === "monthly" ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-sm" : "text-[var(--text-secondary)]"}`}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={textColor} fontSize={10} tickLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: "8px" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-primary)" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={lineColor} 
                  strokeWidth={2.5} 
                  dot={{ r: 4, stroke: lineColor, strokeWidth: 1.5, fill: "#fff" }}
                  activeDot={{ r: 6 }} 
                  name="Revenue (₹)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Income vs Expense */}
        <div className="card p-5 h-[360px] flex flex-col justify-between bg-[var(--surface)]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Cash Flow Breakdown</h3>
            <p className="text-[10px] mt-0.5 text-[var(--text-muted)]">Income vs Outflows ratio</p>
          </div>

          <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ratioChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {ratioChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: "8px" }}
                  itemStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary Label */}
            <div className="absolute text-center">
              <span className="text-[9px] uppercase tracking-wider font-bold block" style={{ color: "var(--text-muted)" }}>Total Flow</span>
              <span className="text-base font-black tracking-tight block mt-0.5" style={{ color: "var(--text-primary)" }}>
                ₹{(ratioChartData.reduce((acc, curr) => acc + (curr.value || 0), 0)).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Custom Legends */}
          <div className="flex items-center justify-center gap-6 pb-2">
            {ratioChartData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] block leading-none">{item.name}</span>
                  <span className="text-xs font-black text-[var(--text-primary)] block mt-1">₹{item.value.toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Charts Block 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Bar Chart: Expense Distribution */}
        <div className="card p-5 h-[340px] flex flex-col justify-between bg-[var(--surface)]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Transactions by Category</h3>
            <p className="text-[10px] mt-0.5 text-[var(--text-muted)]">Distribution of outflow categories</p>
          </div>

          <div className="flex-1 min-h-0 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="category" stroke={textColor} fontSize={10} tickLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} />
                <Tooltip 
                  formatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: "8px" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-primary)" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Bar dataKey="amount" fill={barColor} radius={[4, 4, 0, 0]} name="Volume (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Platform Growth */}
        <div className="card p-5 h-[340px] flex flex-col justify-between bg-[var(--surface)]">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Registered Accounts Growth</h3>
            <p className="text-[10px] mt-0.5 text-[var(--text-muted)]">Cumulative registered operators over time</p>
          </div>

          <div className="flex-1 min-h-0 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" stroke={textColor} fontSize={10} tickLine={false} />
                <YAxis stroke={textColor} fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: "8px" }}
                  labelStyle={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-primary)" }}
                  itemStyle={{ fontSize: "11px" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={growthColor} 
                  strokeWidth={2.5} 
                  dot={false}
                  name="Total Profiles" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Cluster gateways status */}
      <div className="card p-6 bg-[var(--surface)] border-[var(--border)]">
        <h2 className="text-[10px] font-bold uppercase tracking-wider mb-5 text-[var(--text-muted)]">Cluster Gateway Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { name: "API Gateway Node", status: "Operational" },
            { name: "Database PostgreSQL/MySQL Cluster", status: "Operational" },
            { name: "Cloudinary Static Assets CDN", status: "Operational" }
          ].map((cluster, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-[var(--surface-2)] rounded-[var(--radius)] border border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors duration-150">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-[var(--text-primary)]">{cluster.name}</span>
              </div>
              <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">{cluster.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
