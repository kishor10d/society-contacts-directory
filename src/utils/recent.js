// Tracks the last few contacts someone actually called/messaged/saved/
// shared, most-recent-first, so the homepage can offer a quick-access strip
// for repeat lookups without re-searching.

const RECENT_KEY = 'skyve_recent_v1';
const MAX_RECENT = 6;

export function getRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecent({ key, sheetName, contact }) {
  const current = getRecent().filter(r => r.key !== key);
  const next = [{ key, sheetName, contact, touchedAt: Date.now() }, ...current].slice(0, MAX_RECENT);

  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private browsing, quota) - recents just won't persist.
  }
  return next;
}
