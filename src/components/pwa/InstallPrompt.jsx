import { useState, useEffect, useRef } from "react";
import { X, Download, Smartphone } from "lucide-react";

const DISMISS_KEY = "cw-install-dismissed";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

const InstallPrompt = () => {
  const [showBanner, setShowBanner] = useState(false);
  const deferredPromptRef = useRef(null);

  useEffect(() => {
    // Don't show if already installed as standalone/TWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (window.navigator.standalone === true) return; // iOS

    // Check if previously dismissed and not expired
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < DISMISS_DURATION_MS) return;
      localStorage.removeItem(DISMISS_KEY);
    }

    const handler = (e) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;

    prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }
    deferredPromptRef.current = null;
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9999] sm:left-auto sm:right-4 sm:max-w-sm animate-slide-up"
      role="alert"
    >
      <div
        className="card p-4 border-[var(--border-2)] shadow-lg"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Smartphone size={18} className="text-indigo-500" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[var(--text-primary)] tracking-tight">
                Install CredoWallet
              </h3>
              <button
                onClick={handleDismiss}
                className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-0.5 -mr-1 cursor-pointer"
                aria-label="Dismiss install prompt"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mt-0.5 font-medium">
              Add CredoWallet to your home screen for instant access and a native app experience.
            </p>
            <button
              onClick={handleInstall}
              className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-md cursor-pointer transition-all"
              style={{
                background: "#6366f1",
                color: "#ffffff",
                border: "1px solid #6366f1",
              }}
            >
              <Download size={12} />
              <span>Install App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
