import { useState, useEffect } from "react";
import { toast } from "sonner";

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // 1. Listen for PWA installation capability
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 2. Monitor online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Connection Restored", {
        description: "You are back online. Platform syncer resumed."
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Offline Fallback Mode", {
        description: "Your network connection is offline. Some features may be restricted."
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("Mindrift App Installed", {
        description: "Mindrift has been successfully added to your device launcher."
      });
    }
  };

  return {
    isInstallable,
    isOffline,
    triggerInstall
  };
}
export default usePWA;
