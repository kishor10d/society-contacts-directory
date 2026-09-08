// Pure(-ish) helpers for fetching, caching, and interpreting Google Sheet
// data - extracted out of SheetDataViewer.jsx so this logic can be unit
// tested without rendering the component.

export const CATEGORY_EXCLUDED_KEYS = ['name', 'phone', 'mobile', 'email', 'remarks', 'note', 'notes', 'address'];
export const CACHE_TTL_MS = 20 * 60 * 1000;
export const CACHE_KEY_PREFIX = 'skyve_sheet_cache_';

export function readCache(sheetName) {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + sheetName);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.rows;
  } catch {
    return null;
  }
}

export function writeCache(sheetName, rows) {
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + sheetName, JSON.stringify({ timestamp: Date.now(), rows }));
  } catch {
    // Storage unavailable (private browsing, quota) - caching is just an optimization, skip silently.
  }
}

export async function fetchSheetRows(spreadsheetId, sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const response = await fetch(url);
  const text = await response.text();
  const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
  const json = JSON.parse(jsonString);

  const cols = json.table.cols.map(col => col.label || '');
  return json.table.rows.map(row => {
    const rowData = {};
    row.c.forEach((cell, index) => {
      const key = cols[index] || `Column_${index + 1}`;
      rowData[key] = cell ? cell.v : '';
    });
    return rowData;
  });
}

// Picks the column that reads best as a set of quick-filter chips: not a
// name/phone/free-text field, has more than one value, and its values repeat
// across rows often enough to be a useful category (rather than near-unique
// per row, like a "Remarks" column would be).
export function detectCategoryColumn(data, headers) {
  if (data.length < 2) return null;
  let best = null;
  for (const header of headers) {
    const key = header.toLowerCase();
    if (CATEGORY_EXCLUDED_KEYS.some(k => key.includes(k))) continue;

    const values = data
      .map(row => row[header])
      .filter(v => v !== undefined && v !== null && v.toString().trim() !== '');
    if (values.length === 0) continue;

    const uniqueCount = new Set(values.map(v => v.toString().trim())).size;
    // Needs at least one repeated value to be worth grouping into chips
    // (uniqueCount === values.length means every row is distinct), and few
    // enough distinct values that the chip row stays usable. A plain ratio
    // cutoff was too strict on small sheets (e.g. 2 unique values across 3
    // rows), rejecting real categories just because the sample was small.
    if (uniqueCount < 2 || uniqueCount >= values.length || uniqueCount > 15) continue;

    const ratio = uniqueCount / values.length;
    if (!best || ratio < best.ratio) {
      best = { header, ratio };
    }
  }
  return best ? best.header : null;
}

export function getCategoryOptions(data, categoryColumn) {
  if (!categoryColumn) return [];
  const counts = new Map();
  data.forEach(row => {
    const val = row[categoryColumn];
    if (val === undefined || val === null || val.toString().trim() === '') return;
    const key = val.toString().trim();
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

// Same name-resolution fallback used when rendering a card, factored out so
// sorting and rendering can never disagree on what a contact's name is.
export function getContactName(contact) {
  return contact.Name || contact.name || Object.values(contact)[0] || 'No Name';
}
