import React from 'react';
import useInstallPrompt from '../hooks/useInstallPrompt';

const isIOSDevice = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// Mobile-only banner nudging people to install the site as an app. Hidden
// once already installed, and hidden entirely on browsers that offer no
// install path at all (e.g. a desktop-only fallback would be pointless).
export default function InstallPromo() {
  const { canInstall, promptInstall, isInstalled } = useInstallPrompt();
  const isIOS = isIOSDevice();

  if (isInstalled || (!canInstall && !isIOS)) return null;

  return (
    <div className="d-md-none bg-primary-subtle border border-primary-subtle rounded-3 p-3 mb-4 d-flex align-items-center gap-3">
      <div
        className="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
        style={{ width: '44px', height: '44px', fontSize: '20px' }}
      >
        <i className="bi bi-phone"></i>
      </div>

      <div className="flex-grow-1 min-w-0">
        <p className="mb-0 fw-bold text-dark" style={{ fontSize: '0.875rem' }}>
          Use this as an app
        </p>
        <p className="mb-0 text-secondary" style={{ fontSize: '0.75rem' }}>
          {isIOS
            ? 'Tap the Share icon, then "Add to Home Screen".'
            : 'Install it on your phone for quick, full-screen access.'}
        </p>
      </div>

      {!isIOS && (
        <button
          type="button"
          onClick={promptInstall}
          className="btn btn-primary btn-sm rounded-pill flex-shrink-0 px-3 py-2 fw-semibold"
          style={{ fontSize: '0.8125rem' }}
        >
          <i className="bi bi-download me-1"></i> Install
        </button>
      )}
    </div>
  );
}
