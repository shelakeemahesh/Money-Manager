import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

const PWAUpdateNotifier = () => {
  const {
    needRefresh: [needRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every 60 minutes
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error("SW registration error:", error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      toast.success("CredoWallet is ready for offline use", {
        duration: 3000,
      });
    }
  }, [offlineReady]);

  useEffect(() => {
    if (needRefresh) {
      toast.info("A new version of CredoWallet is available", {
        duration: Infinity,
        action: {
          label: "Update Now",
          onClick: () => updateServiceWorker(true),
        },
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null; // Purely side-effect component
};

export default PWAUpdateNotifier;
