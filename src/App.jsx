import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import Layout from "./layout/Layout";

import Home from "./pages/Home";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Category from "./pages/Category";
import Filter from "./pages/Filter";
import Budget from "./pages/Budget";
import AIInsights from "./pages/AIInsights";
import Settings from "./pages/Settings";
import ProPlan from "./pages/ProPlan";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ActivateAccount from "./pages/auth/ActivateAccount";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyOtp from "./pages/auth/VerifyOtp";

// Admin Imports
import AdminLayout from "./layout/AdminLayout";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AdminExpenseManagement from "./pages/admin/AdminExpenseManagement";
import AdminCategoryManagement from "./pages/admin/AdminCategoryManagement";
import AdminBudgetMonitoring from "./pages/admin/AdminBudgetMonitoring";
import AdminAIControl from "./pages/admin/AdminAIControl";
import AdminSubscriptionManagement from "./pages/admin/AdminSubscriptionManagement";
import AdminNotificationManagement from "./pages/admin/AdminNotificationManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import Unauthorized from "./pages/admin/Unauthorized";
import AdminReports from "./pages/admin/AdminReports";
import AdminFraud from "./pages/admin/AdminFraud";
import AdminMonitoring from "./pages/admin/AdminMonitoring";
import AdminBackup from "./pages/admin/AdminBackup";

import ProtectedRoute from "./components/common/ProtectedRoute";
import ErrorBoundary from "./components/common/ErrorBoundary";

const App = () => {
  return (
    <>
      <Toaster richColors position="top-center" />

      <BrowserRouter>
        <Routes>

          {/* Auth routes */}
          <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
          <Route path="/signup" element={<ErrorBoundary><Signup /></ErrorBoundary>} />
          <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
          <Route path="/verify-otp" element={<ErrorBoundary><VerifyOtp /></ErrorBoundary>} />
          <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />

          {/* Layout routes shielded by ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/income" element={<ErrorBoundary><Income /></ErrorBoundary>} />
              <Route path="/expense" element={<ErrorBoundary><Expense /></ErrorBoundary>} />
              <Route path="/category" element={<ErrorBoundary><Category /></ErrorBoundary>} />
              <Route path="/filter" element={<ErrorBoundary><Filter /></ErrorBoundary>} />
              <Route path="/budget" element={<ErrorBoundary><Budget /></ErrorBoundary>} />
              <Route path="/ai-insights" element={<ErrorBoundary><AIInsights /></ErrorBoundary>} />
              <Route path="/pro-plan" element={<ErrorBoundary><ProPlan /></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin/login" element={<ErrorBoundary><AdminLogin /></ErrorBoundary>} />
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
              <Route path="/admin/users" element={<ErrorBoundary><UserManagement /></ErrorBoundary>} />
              <Route path="/admin/transactions" element={<ErrorBoundary><AdminExpenseManagement /></ErrorBoundary>} />
              <Route path="/admin/categories" element={<ErrorBoundary><AdminCategoryManagement /></ErrorBoundary>} />
              <Route path="/admin/budgets" element={<ErrorBoundary><AdminBudgetMonitoring /></ErrorBoundary>} />
              <Route path="/admin/ai" element={<ErrorBoundary><AdminAIControl /></ErrorBoundary>} />
              <Route path="/admin/subscriptions" element={<ErrorBoundary><AdminSubscriptionManagement /></ErrorBoundary>} />
              <Route path="/admin/notifications" element={<ErrorBoundary><AdminNotificationManagement /></ErrorBoundary>} />
              <Route path="/admin/reports" element={<ErrorBoundary><AdminReports /></ErrorBoundary>} />
              <Route path="/admin/fraud" element={<ErrorBoundary><AdminFraud /></ErrorBoundary>} />
              <Route path="/admin/monitoring" element={<ErrorBoundary><AdminMonitoring /></ErrorBoundary>} />
              <Route path="/admin/backup" element={<ErrorBoundary><AdminBackup /></ErrorBoundary>} />
              <Route path="/admin/audit" element={<ErrorBoundary><AuditLogs /></ErrorBoundary>} />
            </Route>
          </Route>
          
          <Route path="/unauthorized" element={<ErrorBoundary><Unauthorized /></ErrorBoundary>} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </>
  );
};

export default App;