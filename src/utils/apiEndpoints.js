export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duqbrkybc";

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/login`,
  REGISTER: `${BASE_URL}/register`,
  FORGOT_PASSWORD: `${BASE_URL}/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/reset-password`,
  VERIFY_OTP: `${BASE_URL}/verify-otp`,
  RESEND_OTP: `${BASE_URL}/resend-otp`,
  SEND_OTP: `${BASE_URL}/send-otp`,
  REFRESH_TOKEN: `${BASE_URL}/refresh-token`,
  UPLOAD_IMAGE: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  PROFILE_UPLOAD_SIGNATURE: `${BASE_URL}/profile/upload-signature`,
  UPDATE_PROFILE: `${BASE_URL}/profile`,
  USER_PROFILE: `${BASE_URL}/profile`,
  SUBMIT_UPGRADE: `${BASE_URL}/subscriptions/upgrade`,
  MY_SUBSCRIPTION: `${BASE_URL}/subscriptions/my-status`,
  // Income
  GET_INCOME: `${BASE_URL}/income`,
  ADD_INCOME: `${BASE_URL}/income`,
  DELETE_INCOME: (id) => `${BASE_URL}/income/${id}`,
  // Expense
  GET_EXPENSE: `${BASE_URL}/expense`,
  ADD_EXPENSE: `${BASE_URL}/expense`,
  DELETE_EXPENSE: (id) => `${BASE_URL}/expense/${id}`,
  // Category
  GET_CATEGORY: `${BASE_URL}/categories`,
  ADD_CATEGORY: `${BASE_URL}/categories`,
  DELETE_CATEGORY: (id) => `${BASE_URL}/categories/${id}`,
  // Filter
  FILTER_TRANSACTIONS: `${BASE_URL}/filter`,
  // Admin
  ADMIN_USERS: `${BASE_URL}/admin/users`,
  ADMIN_STATS: `${BASE_URL}/admin/stats`,
  ADMIN_AUDIT_LOGS: `${BASE_URL}/admin/audit-logs`,
  ADMIN_ANALYTICS: `${BASE_URL}/admin/analytics`,
  ADMIN_TRANSACTIONS: `${BASE_URL}/admin/transactions`,
  ADMIN_CATEGORIES: `${BASE_URL}/admin/categories`,
  ADMIN_CATEGORIES_ANALYTICS: `${BASE_URL}/admin/categories/analytics`,
  // Admin Budget
  ADMIN_BUDGETS: `${BASE_URL}/admin/budgets`,
  ADMIN_BUDGETS_HEATMAP: `${BASE_URL}/admin/budgets/heatmap`,
  ADMIN_AI_RECOMMENDATION: (userId) => `${BASE_URL}/admin/budgets/ai-recommendation/${userId}`,
  // Admin AI Control
  ADMIN_AI_DASHBOARD: `${BASE_URL}/admin/ai/dashboard`,
  ADMIN_AI_SETTINGS: `${BASE_URL}/admin/ai/settings`,
  ADMIN_AI_REANALYZE: `${BASE_URL}/admin/ai/reanalyze`,
  ADMIN_AI_LOGS: `${BASE_URL}/admin/ai/logs`,
  // Admin Subscriptions
  ADMIN_SUBSCRIPTIONS_DASHBOARD: `${BASE_URL}/admin/subscriptions/dashboard`,
  ADMIN_SUBSCRIPTIONS: `${BASE_URL}/admin/subscriptions`,
  ADMIN_SUBSCRIPTIONS_PLANS: `${BASE_URL}/admin/subscriptions/plans`,
  ADMIN_SUBSCRIPTIONS_CHANGE_PLAN: `${BASE_URL}/admin/subscriptions/change-plan`,
  ADMIN_SUBSCRIPTIONS_PAYMENTS: (userId) => `${BASE_URL}/admin/subscriptions/payments/${userId}`,
  // Admin Notifications
  ADMIN_NOTIFICATIONS_SEND: `${BASE_URL}/admin/notifications/send`,
  ADMIN_NOTIFICATIONS_LOGS: `${BASE_URL}/admin/notifications/logs`,
  ADMIN_NOTIFICATIONS_TEMPLATES: `${BASE_URL}/admin/notifications/templates`,
  // Admin Reports
  ADMIN_REPORTS_GENERATE: `${BASE_URL}/admin/reports/generate`,
  ADMIN_REPORTS_HISTORY: `${BASE_URL}/admin/reports/history`,
  ADMIN_REPORTS_DOWNLOAD: (id) => `${BASE_URL}/admin/reports/download/${id}`,
  // Admin Support
  ADMIN_SUPPORT_TICKETS: `${BASE_URL}/admin/support/tickets`,
  ADMIN_SUPPORT_TICKET_DETAILS: (id) => `${BASE_URL}/admin/support/tickets/${id}`,
  ADMIN_SUPPORT_TICKET_REPLIES: (id) => `${BASE_URL}/admin/support/tickets/${id}/replies`,
  ADMIN_SUPPORT_TICKET_REPLY: (id) => `${BASE_URL}/admin/support/tickets/${id}/reply`,
  ADMIN_SUPPORT_TICKET_STATUS: (id) => `${BASE_URL}/admin/support/tickets/${id}/status`,
  ADMIN_SUPPORT_FEEDBACK: `${BASE_URL}/admin/support/feedback`,
  ADMIN_SUPPORT_ANALYTICS: `${BASE_URL}/admin/support/analytics`,
  // Admin Fraud
  ADMIN_FRAUD_EVENTS: `${BASE_URL}/admin/fraud/events`,
  ADMIN_FRAUD_ACTION: (id) => `${BASE_URL}/admin/fraud/events/${id}/action`,
  // Admin Manual Subscriptions
  ADMIN_SUBSCRIPTION_REQUESTS: `${BASE_URL}/admin/subscriptions/requests`,
  ADMIN_APPROVE_SUBSCRIPTION: (id) => `${BASE_URL}/admin/subscriptions/requests/${id}/approve`,
  ADMIN_REJECT_SUBSCRIPTION: (id) => `${BASE_URL}/admin/subscriptions/requests/${id}/reject`,
};
