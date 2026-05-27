import axios from "axios";
import { BASE_URL } from "./apiEndpoints";

const axiosConfig = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// list of endpoints that do not require authorization token
const excludeEndpoints = [
  "/login",
  "/register",
  "/status",
  "/activate",
  "/health",
];

// Track active non-GET requests to prevent concurrent duplicates
const activeRequests = new Map();

// Helper to restore button state
const cleanupButton = (config) => {
  if (config && config.triggerButton) {
    const btn = config.triggerButton;
    if (btn) {
      // Tiny delay to ensure visual transitions are smooth
      setTimeout(() => {
        btn.disabled = false;
        delete btn.dataset.loading;
        if (btn.dataset.originalHtml !== undefined) {
          btn.innerHTML = btn.dataset.originalHtml;
          delete btn.dataset.originalHtml;
        }
      }, 300);
    }
  }
};

// request interceptor
axiosConfig.interceptors.request.use(
  (config) => {
    // 1. Prevent concurrent identical non-GET API requests
    if (config.method && config.method !== "get") {
      let dataStr = "";
      if (config.data) {
        if (config.data instanceof FormData) {
          dataStr = "form-data";
        } else {
          try {
            dataStr = JSON.stringify(config.data);
          } catch {
            dataStr = "non-serializable";
          }
        }
      }
      const requestKey = `${config.method}:${config.url}:${JSON.stringify(config.params || {})}:${dataStr}`;

      if (activeRequests.has(requestKey)) {
        const controller = new AbortController();
        config.signal = controller.signal;
        controller.abort("DUPLICATE_REQUEST");
      } else {
        activeRequests.set(requestKey, true);
        config.requestKey = requestKey;
      }
    }

    // 2. Add spinner and disable active button if triggered by click
    if (window.lastClickedButton) {
      const btn = window.lastClickedButton;
      config.triggerButton = btn;

      if (btn && !btn.disabled && btn.dataset.loading !== "true") {
        btn.disabled = true;
        btn.dataset.loading = "true";
        btn.dataset.originalHtml = btn.innerHTML;

        if (!btn.querySelector(".animate-spin")) {
          const spinner = document.createElement("span");
          spinner.className = "w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block shrink-0";
          btn.insertBefore(spinner, btn.firstChild);
          if (btn.childNodes.length > 1) {
            spinner.classList.add("mr-1.5");
          }
        }
      }
    }

    const shouldSkipToken = excludeEndpoints.some((endpoint) => {
      return config.url?.includes(endpoint);
    });

    if (!shouldSkipToken) {
      const accessToken = localStorage.getItem("token");

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor
axiosConfig.interceptors.response.use(
  (response) => {
    if (response.config) {
      if (response.config.requestKey) {
        activeRequests.delete(response.config.requestKey);
      }
      cleanupButton(response.config);
    }

    if (response.data && response.data.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.config) {
      if (error.config.requestKey) {
        activeRequests.delete(error.config.requestKey);
      }
      cleanupButton(error.config);
    }

    // Silence aborted/canceled duplicate requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.response) {
      const isAuthRequest = error.config?.url?.includes("/login") || error.config?.url?.includes("/register");
      if ((error.response.status === 401 || error.response.status === 403) && !isAuthRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }
      } else if (error.response.status === 500) {
        console.log("Server Error. Please try again later");
      }
    } else if (error.code === "ECONNABORTED") {
      console.log("Request timeout . Please try again. ");
    }
    return Promise.reject(error);
  }
);

export default axiosConfig;