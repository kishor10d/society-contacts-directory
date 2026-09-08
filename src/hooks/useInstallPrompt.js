import { useEffect, useState } from 'react';

// Wraps the browser's `beforeinstallprompt` flow (Chrome/Edge/Android) so the
// UI can offer an explicit "Install App" action instead of relying on users
// to notice the browser's own, easy-to-miss install affordance.
// Safari/iOS never fires this event - there's no programmatic install there,
// people still have to use Share > Add to Home Screen.
export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  );

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    // The prompt can only be used once; clear it either way.
    setDeferredPrompt(null);
  };

  return {
    canInstall: !isInstalled && deferredPrompt !== null,
    promptInstall,
  };
}
