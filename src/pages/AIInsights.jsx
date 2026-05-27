import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MessageSquare, AlertTriangle, Lightbulb, TrendingUp, Cpu, ArrowRight } from "lucide-react";
import AppContext from "../context/AppContext";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const AIInsights = () => {
  const { user, expenseList, totalIncome, totalExpense, totalBalance, anomalyAlerts } = useContext(AppContext);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "AI",
      text: "Hello! I am your Fintech AI advisor. I have analyzed your transactions. Select one of the parameters below or ask me a query about your wealth trajectory.",
      time: "Now"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const savingsRate = totalIncome > 0 ? Math.round((totalBalance / totalIncome) * 100) : 0;

  // Find highest category expense
  const categoryTotals = expenseList.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});
  const highestExpenseCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  const PROMPTS = [
    { label: "Analyze my outflows", id: "outflows" },
    { label: "Predict next month savings", id: "predictions" },
    { label: "Verify anomalies in records", id: "anomalies" },
    { label: "Asset allocation efficiency", id: "efficiency" }
  ];

  const handlePromptClick = async (id, text) => {
    if (loading) return;

    // Add user message
    const userMsg = { id: Date.now(), sender: "User", text, time: "Now" };
    setMessages((prev) => [...prev, userMsg]);

    setLoading(true);

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1200));

    let responseText = "";

    if (id === "outflows") {
      responseText = `Based on your expenditure records, you have logged a cumulative outflow of ${formatCurrency(totalExpense)}. Your peak outflow channel is "${highestExpenseCategory[0]}" at ${formatCurrency(highestExpenseCategory[1])}, accounting for ${totalExpense > 0 ? Math.round((highestExpenseCategory[1] / totalExpense) * 100) : 0}% of total outflows. Auditing this channel should be your primary priority to stem leakage.`;
    } else if (id === "predictions") {
      const predictedSavings = Math.round(totalBalance * 1.05);
      responseText = `Assuming transaction volume remains stable, your projected savings for next month is estimated at ${formatCurrency(predictedSavings)} (reflecting a 5% baseline optimization buffer). Maintaining a savings rate above 20% (currently ${savingsRate}%) will secure this target.`;
    } else if (id === "anomalies") {
      if (anomalyAlerts.length > 0) {
        responseText = `I have verified ${anomalyAlerts.length} active warnings in your logs. The most recent flags high transactions that deviate from typical bounds. Address these logs to keep database audit integrity.`;
      } else {
        responseText = `Our sequential audit filters report zero anomalies in your transaction streams. Your input sizes match historical benchmarks. Good job maintaining clean books!`;
      }
    } else if (id === "efficiency") {
      responseText = `Your current balance is ${formatCurrency(totalBalance)}. We suggest allocating 50% to essential nodes (needs), 30% to optional nodes (wants), and reserving 20% (surplus) for index funds or SIP yields. Your savings rate is currently ${savingsRate}%, which is ${savingsRate >= 20 ? "optimal" : "below target"}.`;
    }

    const aiMsg = { id: Date.now() + 1, sender: "AI", text: responseText, time: "Now" };
    setMessages((prev) => [...prev, aiMsg]);
    setLoading(false);
  };

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <Sparkles size={15} />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">AI Insights Hub</h1>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Interactive intelligence nodes, anomaly audits, and advisors</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
        {!(user?.role === "PRO" || user?.role === "ADMIN") && (
          <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm z-10 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
              <Sparkles size={22} className="animate-pulse" />
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Unlock AI Insights Advisor</h3>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mt-1.5 mb-5 leading-relaxed font-medium">
              Get customized projections, automated outflow anomaly audits, and real-time capital efficiency allocations with Money Manager Pro.
            </p>
            <button
              onClick={() => navigate("/pro-plan")}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
        
        {/* Chat UI panel - 3 cols */}
        <div className="lg:col-span-3 card flex flex-col h-[460px]">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-[var(--text-secondary)] animate-pulse" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">AI Advisor Live Node</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "User" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-xs leading-relaxed ${
                  msg.sender === "User"
                    ? "bg-[var(--brand)] text-[var(--surface)] font-medium"
                    : "bg-[var(--surface-3)] text-[var(--text-primary)] border border-[var(--border)]"
                }`}
                >
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-2.5 bg-[var(--surface-3)] border border-[var(--border)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>

          {/* Prompt quick inputs bar */}
          <div className="p-3 border-t border-[var(--border)] space-y-2 bg-[var(--surface-2)]">
            <p className="text-[9px] font-semibold text-[var(--text-muted)] uppercase tracking-widest px-1">Select query parameters</p>
            <div className="flex flex-wrap gap-1.5">
              {PROMPTS.map((p) => (
                <button
                  key={p.id}
                  disabled={loading}
                  onClick={() => handlePromptClick(p.id, p.label)}
                  className="bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-2)] border border-[var(--border)] px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <span>{p.label}</span>
                  <ArrowRight size={10} className="text-[var(--text-muted)]" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info panel - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Anomaly quick check */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={14} className="text-amber-500" />
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">Anomaly Detection Logs</h3>
            </div>
            
            {anomalyAlerts.length === 0 ? (
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                Our automated audit systems report zero flag conditions. All logged values remain within typical ranges.
              </p>
            ) : (
              <div className="space-y-1.5">
                {anomalyAlerts.map(alert => (
                  <div key={alert.id} className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] leading-snug text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">{alert.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yield generation tips */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={14} className="text-emerald-500" />
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">Capital Buffering Tips</h3>
            </div>
            <div className="space-y-2.5 text-xs leading-relaxed text-[var(--text-secondary)]">
              <div className="flex gap-2">
                <span className="text-emerald-500 font-bold">1.</span>
                <p>Transfer 10% of monthly surplus into index SIP trackers on the 5th of every cycle.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500 font-bold">2.</span>
                <p>Verify category filters. Dining and entertainment segments remain the easiest areas to optimize cash flows.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-500 font-bold">3.</span>
                <p>Set Category limits within Category Hub and let AI notify you when limits cross 80% capacity.</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AIInsights;
