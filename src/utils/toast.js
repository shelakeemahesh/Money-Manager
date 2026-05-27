import { toast as realToast, Toaster } from '../../node_modules/sonner/dist/index.mjs';

const activeToasts = new Map();

// Helper to get key for toast deduplication
const getToastKey = (message, type) => `${type}:${message}`;

const throttledToast = (type, message, options = {}) => {
  if (typeof message !== 'string') {
    // If message is a component, function, or object, pass through directly
    return realToast[type](message, options);
  }

  const key = getToastKey(message, type);

  // If there's an active toast with the same message, don't show it again
  if (activeToasts.has(key)) {
    return activeToasts.get(key);
  }

  const id = realToast[type](message, {
    ...options,
    onAutoClose: (t) => {
      activeToasts.delete(key);
      options.onAutoClose?.(t);
    },
    onDismiss: (t) => {
      activeToasts.delete(key);
      options.onDismiss?.(t);
    }
  });

  activeToasts.set(key, id);

  // Fallback cleanup in case callbacks don't fire
  setTimeout(() => {
    activeToasts.delete(key);
  }, options.duration || 3000);

  return id;
};

export const toast = {
  success: (message, options) => throttledToast('success', message, options),
  error: (message, options) => throttledToast('error', message, options),
  info: (message, options) => throttledToast('info', message, options),
  warning: (message, options) => throttledToast('warning', message, options),
  loading: (message, options) => realToast.loading(message, options), // Don't throttle loading toasts
  dismiss: (id) => realToast.dismiss(id),
  custom: (jsx, options) => realToast.custom(jsx, options),
  message: (message, options) => realToast.message(message, options),
  promise: (promise, options) => realToast.promise(promise, options),
};

export { Toaster };
