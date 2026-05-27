import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  PiggyBank,
  ShoppingCart,
  Heart,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppContext from "../context/AppContext";
import { classifyExpense } from "../utils/categoryClassifier";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

/* ---------------- AGGREGATE SPENDING ---------------- */
const aggregateSpending = (expenses = []) => {
  return expenses.reduce(
    (acc, e) => {
      const type = classifyExpense(e.category); // auto detect needs / wants
      const amt = Number(e.amount || 0);

      acc[type] += amt;
      acc.total += amt;

      acc.byCategory[e.category] =
        (acc.byCategory[e.category] || 0) + amt;

      return acc;
    },
    { needs: 0, wants: 0, total: 0, byCategory: {} }
  );
};

/* ---------------- BUDGET ANALYSIS ---------------- */
const computeBudgetAnalysis = ({ income, goal, expenses }) => {
  const { needs, wants, savings } = goal.splits;

  const targets = {
    needs: Math.round((needs / 100) * income),
    wants: Math.round((wants / 100) * income),
    savings: Math.round((savings / 100) * income),
  };

  const actual = aggregateSpending(expenses);
  const savingsActual = Math.max(income - actual.total, 0);

  const gaps = {
    needsOver: Math.max(actual.needs - targets.needs, 0),
    wantsOver: Math.max(actual.wants - targets.wants, 0),
    savingsShort: Math.max(targets.savings - savingsActual, 0),
  };

  const topCategories = Object.entries(actual.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  return { targets, actual, savingsActual, gaps, topCategories };
};

/* ---------------- AI TIPS ---------------- */
const buildTips = ({ income, goalId, analysis }) => {
  const { targets, savingsActual, gaps, topCategories } = analysis;

  const tips = [];

  tips.push(
    `💡 With ${formatCurrency(income)} monthly income, your savings target is set at ${formatCurrency(
      targets.savings
    )}.`
  );

  if (gaps.needsOver > 0) {
    tips.push(
      `⚠️ Essential expenses exceeded target by ${formatCurrency(
        gaps.needsOver
      )}. We advise auditing your housing, utility, or subscription plans.`
    );
  }

  if (gaps.wantsOver > 0) {
    tips.push(
      `🛍️ Lifestyle spending exceeded parameters by ${formatCurrency(
        gaps.wantsOver
      )}. Consider freezing non-essential shopping or dining nodes.`
    );
  }

  if (gaps.savingsShort > 0) {
    tips.push(
      `💰 Savings fell short by ${formatCurrency(
        gaps.savingsShort
      )}. Check out automated micro-saving options.`
    );
  } else {
    tips.push(`✅ Excellent! Savings are currently on track at ${formatCurrency(savingsActual)}.`);
  }

  if (topCategories.length) {
    tips.push(
      `📊 Primary spending channels: ${topCategories
        .map((c) => `${c.name} (₹${Number(c.amount).toLocaleString("en-IN")})`)
        .join(", ")}`
    );
  }

  if (goalId === "aggressive") {
    tips.push(`🚀 Aggressive savings strategy! Try allocating 15% of this surplus to SIPs or index funds.`);
  } else if (goalId === "balanced") {
    tips.push(`⚖️ The 50/30/20 classic layout offers the most sustainable long-term trajectory.`);
  } else {
    tips.push(`🌊 Flexible allocation is valid, but ensure a minimum buffer remains set.`);
  }

  return tips;
};

/* ---------------- GOALS ---------------- */
const GOALS = [
  {
    id: "aggressive",
    label: "🛡️ Aggressive Savings",
    desc: "Maximize long term assets generation",
    splits: { needs: 50, wants: 20, savings: 30 },
  },
  {
    id: "balanced",
    label: "⚖️ Balanced (50/30/20)",
    desc: "Classical personal budgeting framework",
    splits: { needs: 50, wants: 30, savings: 20 },
  },
  {
    id: "flexible",
    label: "🌊 Flexible lifestyle",
    desc: "Higher allocation to lifestyle experiences",
    splits: { needs: 40, wants: 40, savings: 20 },
  },
];

const NEEDS_CATEGORIES = [
  "Housing/Rent",
  "Groceries",
  "Utilities",
  "Transport",
  "Insurance",
  "Health",
];

const WANTS_CATEGORIES = [
  "Dining Out",
  "Entertainment",
  "Shopping",
  "Subscriptions",
  "Travel",
  "Hobbies",
];

/* ---------------- BUCKET BAR ---------------- */
const BucketBar = ({
  label,
  icon,
  color,
  amount,
  percent,
  categories,
}) => {
  const Icon = icon;
  const [open, setOpen] = useState(false);

  const perCat = categories.map((c) => ({
    name: c,
    amount: Math.round(amount / categories.length),
  }));

  return (
    <div className={`card p-4 flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-md ${color} flex items-center justify-center text-white shrink-0`}>
              <Icon size={14} />
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)] leading-none">{label}</p>
              <p className="text-[9px] text-[var(--text-muted)] mt-1">{percent}% of income</p>
            </div>
          </div>

          <p className="text-sm font-bold text-[var(--text-primary)]">
            {formatCurrency(amount)}
          </p>
        </div>

        {/* Progress bar background */}
        <div className="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full mb-3.5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
      </div>

      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-[9px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer"
        >
          {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          <span>{open ? "Hide" : "Expand"} breakdown</span>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 border-t border-[var(--border)] pt-3"
            >
              {perCat.map((c) => (
                <div key={c.name} className="flex justify-between text-xs font-medium">
                  <span className="text-[var(--text-secondary)] text-[11px]">{c.name}</span>
                  <span className="font-semibold text-[var(--text-primary)] text-[11px]">
                    {formatCurrency(c.amount)}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
const Budget = () => {
  const { user, expenseList } = useContext(AppContext);
  const navigate = useNavigate();

  const [income, setIncome] = useState("");
  const [error, setError] = useState("");
  const [goalId, setGoalId] = useState("balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectedGoal = GOALS.find((g) => g.id === goalId) || GOALS[1];

  const handleIncomeChange = (val) => {
    if (val === "") {
      setIncome("");
      setError("");
      return;
    }

    const num = Number(val);
    if (isNaN(num)) {
      setError("Please enter a valid numeric value.");
    } else if (num <= 0) {
      setError("Income must be a positive number greater than zero.");
    } else {
      setError("");
    }
    setIncome(val);
  };

  const handleGenerate = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const numericIncome = Number(income || 0);

    const analysis = computeBudgetAnalysis({
      income: numericIncome,
      goal: selectedGoal,
      expenses: expenseList,
    });

    const tips = buildTips({
      income: numericIncome,
      goalId,
      analysis,
    });

    setResult({
      income: numericIncome,
      needsAmt: analysis.targets.needs,
      wantsAmt: analysis.targets.wants,
      savingsAmt: analysis.targets.savings,
      nPct: selectedGoal.splits.needs,
      wPct: selectedGoal.splits.wants,
      sPct: selectedGoal.splits.savings,
      tips,
    });

    setLoading(false);
  };

  return (
    <div className="space-y-5 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[var(--surface-3)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shrink-0">
            <PiggyBank size={15} />
          </div>

          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              AI Budget Planner
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Simulate and structure financial targets powered by intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="card p-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3.5 text-[var(--text-primary)]">
          Step 1 — Input Target Monthly Income
        </h2>

        <div className="flex flex-col gap-1.5 mb-5">
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold text-xs select-none pointer-events-none">
              ₹
            </span>

            <input
              type="number"
              min="1"
              placeholder="Enter your target monthly income"
              value={income}
              onChange={(e) => handleIncomeChange(e.target.value)}
              className={`input-styled !pl-7 ${
                error ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10" : ""
              }`}
            />
          </div>
          {error ? (
            <p className="text-[10px] text-rose-500 font-semibold mt-1 animate-fade-in pl-1">
              {error}
            </p>
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] mt-1 pl-1 leading-normal">
              This amount will be used for budget allocation planning
            </p>
          )}
        </div>

        {/* Goal Select & Generator Action */}
        <div className="space-y-5 mt-5">
          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-widest mb-3 text-[var(--text-primary)]">
              Step 2 — Select Budget Target Paradigm
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-1">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setGoalId(g.id)}
                  className={`p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                    goalId === g.id
                      ? "bg-[var(--surface-3)] border-[var(--border-2)]"
                      : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-2)]"
                  }`}
                >
                  <p className="text-xs font-bold text-[var(--text-primary)]">{g.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">{g.desc}</p>

                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="text-[9px] font-medium bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-md border border-blue-500/10">
                      Needs {g.splits.needs}%
                    </span>

                    <span className="text-[9px] font-medium bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-md border border-orange-500/10">
                      Wants {g.splits.wants}%
                    </span>

                    <span className="text-[9px] font-medium bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md border border-emerald-500/10">
                      Save {g.splits.savings}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !income || !!error}
            className="w-full py-2.5 btn-brand flex items-center justify-center gap-2 text-xs font-medium"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-[var(--surface)] border-t-transparent rounded-full animate-spin" />
                <span>Compiling budget paradigms...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Generate Target Allocations</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <div className="relative">
            {!(user?.role === "PRO" || user?.role === "ADMIN") && (
              <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm z-10 rounded-xl border border-[var(--border)] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                  <Sparkles size={22} className="animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Unlock Advanced Budget Planning</h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-xs mt-1.5 mb-5 leading-relaxed font-medium">
                  Upgrade to Money Manager Professional to unlock detailed category splits, Core Essentials breakdowns, and AI Synthesis feedback.
                </p>
                <button
                  onClick={() => navigate("/pro-plan")}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="space-y-4"
            >
              <div className="card p-4.5 bg-[var(--surface-3)]">
                <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-semibold mb-0.5">Target Income Parameterized</p>
                <p className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {formatCurrency(result.income)}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] font-medium mt-1">
                  Paradigm:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {selectedGoal.label}
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <BucketBar
                  label="Core Essentials (Needs)"
                  icon={ShoppingCart}
                  color="bg-blue-500"
                  bgColor="bg-blue-500/5"
                  amount={result.needsAmt}
                  percent={result.nPct}
                  categories={NEEDS_CATEGORIES}
                />

                <BucketBar
                  label="Lifestyle Desires (Wants)"
                  icon={Heart}
                  color="bg-orange-500"
                  bgColor="bg-orange-500/5"
                  amount={result.wantsAmt}
                  percent={result.wPct}
                  categories={WANTS_CATEGORIES}
                />

                <BucketBar
                  label="Wealth Surpluses (Savings)"
                  icon={TrendingUp}
                  color="bg-emerald-500"
                  bgColor="bg-emerald-500/5"
                  amount={result.savingsAmt}
                  percent={result.sPct}
                  categories={[
                    "Emergency Reserves",
                    "Investment Funds (SIP)",
                    "Fixed Deposit Yields",
                    "Asset Accumulation",
                    "Retirement Funds",
                  ]}
                />
              </div>

              {/* AI Advisor Tips Card */}
              <div className="card p-4.5">
                <div className="flex items-center gap-2 mb-3.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-primary)]">AI Synthesis Feedback</h3>
                </div>
                <div className="space-y-2 text-xs">
                  {result.tips.map((tip, idx) => (
                    <p key={idx} className="leading-relaxed text-[var(--text-secondary)]">
                      {tip}
                    </p>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Budget;