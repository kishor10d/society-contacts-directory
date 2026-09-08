// Per-device favorites list, stored as full contact snapshots (not just a
// reference) so the homepage's Favorites strip can render instantly without
// needing to re-fetch/locate the sheet the contact came from.

const FAVORITES_KEY = 'skyve_favorites_v1';
const MAX_FAVORITES = 30;

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isFavorited(key) {
  return getFavorites().some(f => f.key === key);
}

// Adds the contact if not already favorited, removes it if it is. Returns
// the new list.
export function toggleFavorite({ key, sheetName, contact }) {
  const current = getFavorites();
  const next = current.some(f => f.key === key)
    ? current.filter(f => f.key !== key)
    : [{ key, sheetName, contact, savedAt: Date.now() }, ...current].slice(0, MAX_FAVORITES);

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private browsing, quota) - favoriting just won't persist.
  }
  return next;
}
