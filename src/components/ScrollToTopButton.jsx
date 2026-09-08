import React, { useState, useEffect } from 'react';

const SHOW_AFTER_PX = 400;

// Small floating button, bottom-right, that only appears once you've
// scrolled down far enough to actually need it - handy on long contact
// lists (Daily Services alone runs 21+ cards) and long search-result pages.
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="btn btn-primary rounded-circle shadow d-flex align-items-center justify-content-center position-fixed"
      style={{
        width: '44px',
        height: '44px',
        right: '16px',
        // env(safe-area-inset-bottom) keeps it clear of a phone's home-indicator
        // gesture area when installed as a PWA (viewport-fit=cover is set).
        bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        zIndex: 1030,
      }}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <i className="bi bi-arrow-up fs-5"></i>
    </button>
  );
}
