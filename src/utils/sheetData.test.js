import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CACHE_TTL_MS,
  CACHE_KEY_PREFIX,
  readCache,
  writeCache,
  fetchSheetRows,
  detectCategoryColumn,
  getCategoryOptions,
  getContactName,
  getContactPhone,
  getContactSubtitle,
  truncateName,
  makeContactKey,
} from './sheetData';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('detectCategoryColumn', () => {
  it('returns null with fewer than 2 rows', () => {
    expect(detectCategoryColumn([{ Name: 'A', Area: 'X' }], ['Name', 'Area'])).toBeNull();
  });

  it('excludes name/phone/mobile-like columns even if they repeat', () => {
    const data = [
      { Name: 'A', Mobile: '111' },
      { Name: 'B', Mobile: '111' },
      { Name: 'C', Mobile: '222' },
    ];
    expect(detectCategoryColumn(data, ['Name', 'Mobile'])).toBeNull();
  });

  it('picks a repeating column even on a tiny sheet (regression: Builder CRM, 2 unique / 3 rows)', () => {
    const data = [
      { Name: 'Balu', Area: 'Facility Manager' },
      { Name: 'Sachin', Area: 'CRM' },
      { Name: 'Deepak', Area: 'CRM' },
    ];
    expect(detectCategoryColumn(data, ['Name', 'Area'])).toBe('Area');
  });

  it('picks a repeating column with a ratio above the old 0.6 cutoff (regression: Essential Services, 5 unique / 8 rows)', () => {
    const values = ['Hospital', 'Hospital', 'Hospital', 'Grocery', 'Grocery', 'Hardware', 'Pooja', 'Bharat Gas'];
    const data = values.map((v, i) => ({ Name: `N${i}`, Area: v }));
    expect(detectCategoryColumn(data, ['Name', 'Area'])).toBe('Area');
  });

  it('rejects a column where every value is unique (no grouping value)', () => {
    const data = [
      { Name: 'A', Notes: 'alpha' },
      { Name: 'B', Notes: 'beta' },
      { Name: 'C', Notes: 'gamma' },
    ];
    expect(detectCategoryColumn(data, ['Name', 'Notes'])).toBeNull();
  });

  it('rejects a column with more than 15 distinct values', () => {
    const data = Array.from({ length: 20 }, (_, i) => ({ Name: `N${i}`, Tag: `T${i % 16}` }));
    expect(detectCategoryColumn(data, ['Name', 'Tag'])).toBeNull();
  });

  it('prefers the column with the lowest unique/total ratio when several qualify', () => {
    // Loose: 3 unique / 4 rows = 0.75. Tight: 2 unique / 4 rows = 0.5 - more
    // "categorical", so it should win even though Loose is declared first.
    const data = [
      { Name: 'A', Loose: 'x', Tight: 'p' },
      { Name: 'B', Loose: 'y', Tight: 'p' },
      { Name: 'C', Loose: 'z', Tight: 'p' },
      { Name: 'D', Loose: 'z', Tight: 'q' },
    ];
    expect(detectCategoryColumn(data, ['Name', 'Loose', 'Tight'])).toBe('Tight');
  });
});

describe('getCategoryOptions', () => {
  it('returns an empty array when there is no category column', () => {
    expect(getCategoryOptions([{ Area: 'X' }], null)).toEqual([]);
  });

  it('counts occurrences and sorts descending by count', () => {
    const data = [
      { Area: 'Pooja' }, { Area: 'Pooja' }, { Area: 'Pooja' },
      { Area: 'Cook' }, { Area: 'Cook' },
      { Area: 'Maid' },
    ];
    expect(getCategoryOptions(data, 'Area')).toEqual([
      { value: 'Pooja', count: 3 },
      { value: 'Cook', count: 2 },
      { value: 'Maid', count: 1 },
    ]);
  });

  it('skips blank/null values', () => {
    const data = [{ Area: 'Pooja' }, { Area: '' }, { Area: null }, { Area: 'Pooja' }];
    expect(getCategoryOptions(data, 'Area')).toEqual([{ value: 'Pooja', count: 2 }]);
  });
});

describe('getContactName', () => {
  it('prefers the Name field', () => {
    expect(getContactName({ Name: 'Ramita', Mobile: '123' })).toBe('Ramita');
  });

  it('falls back to lowercase name', () => {
    expect(getContactName({ name: 'Ramita' })).toBe('Ramita');
  });

  it('falls back to the first value positionally when there is no name field', () => {
    expect(getContactName({ Provider: 'Airtel', Mobile: '123' })).toBe('Airtel');
  });

  it('falls back to "No Name" for a contact with no usable values', () => {
    expect(getContactName({})).toBe('No Name');
  });
});

describe('getContactPhone', () => {
  it('checks Phone/phone/Mobile/mobile in that order', () => {
    expect(getContactPhone({ Phone: '1' })).toBe('1');
    expect(getContactPhone({ phone: '2' })).toBe('2');
    expect(getContactPhone({ Mobile: '3' })).toBe('3');
    expect(getContactPhone({ mobile: '4' })).toBe('4');
  });

  it('returns an empty string when there is no phone-like field', () => {
    expect(getContactPhone({ Name: 'A' })).toBe('');
  });
});

describe('getContactSubtitle', () => {
  it('prefers Designation/Role/City over positional fallback', () => {
    expect(getContactSubtitle({ Name: 'A', Role: 'Electrician', Mobile: '1' })).toBe('Electrician');
  });

  it('falls back to the second value positionally', () => {
    expect(getContactSubtitle({ Provider: 'Airtel', Alternate: '123456' })).toBe('123456');
  });
});

describe('truncateName', () => {
  it('leaves short names untouched', () => {
    expect(truncateName('Ramita Maid')).toBe('Ramita Maid');
  });

  it('truncates long names with an ellipsis', () => {
    expect(truncateName('Hanumant Pawar - Car Cleaning')).toBe('Hanumant Pawar - Car...');
  });

  it('returns "No Name" for an empty/falsy name', () => {
    expect(truncateName('')).toBe('No Name');
    expect(truncateName(null)).toBe('No Name');
  });
});

describe('makeContactKey', () => {
  it('prefers phone over name, case/whitespace-insensitively', () => {
    expect(makeContactKey('Daily Services', { Name: 'Ramita', Mobile: ' 9960206961 ' }))
      .toBe('Daily Services::9960206961');
  });

  it('falls back to name when there is no phone', () => {
    expect(makeContactKey('Builder CRM', { Name: 'Deepak' })).toBe('Builder CRM::deepak');
  });

  it('keeps the same contact distinct across different sheets', () => {
    const contact = { Name: 'Ramita', Mobile: '123' };
    expect(makeContactKey('Sheet A', contact)).not.toBe(makeContactKey('Sheet B', contact));
  });
});

describe('readCache / writeCache', () => {
  it('returns null when nothing is cached', () => {
    expect(readCache('Daily Services')).toBeNull();
  });

  it('round-trips rows written moments ago', () => {
    const rows = [{ Name: 'A' }, { Name: 'B' }];
    writeCache('Daily Services', rows);
    expect(readCache('Daily Services')).toEqual(rows);
  });

  it('keeps different sheets independent', () => {
    writeCache('Sheet A', [{ Name: 'A' }]);
    writeCache('Sheet B', [{ Name: 'B' }]);
    expect(readCache('Sheet A')).toEqual([{ Name: 'A' }]);
    expect(readCache('Sheet B')).toEqual([{ Name: 'B' }]);
  });

  it('returns null once the entry is past the TTL', () => {
    const staleTimestamp = Date.now() - CACHE_TTL_MS - 1000;
    localStorage.setItem(
      CACHE_KEY_PREFIX + 'Daily Services',
      JSON.stringify({ timestamp: staleTimestamp, rows: [{ Name: 'A' }] })
    );
    expect(readCache('Daily Services')).toBeNull();
  });

  it('returns null (not a throw) on corrupted JSON', () => {
    localStorage.setItem(CACHE_KEY_PREFIX + 'Daily Services', '{not valid json');
    expect(readCache('Daily Services')).toBeNull();
  });

  it('does not throw when localStorage.setItem fails (e.g. private browsing, quota)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => writeCache('Daily Services', [{ Name: 'A' }])).not.toThrow();
  });
});

describe('fetchSheetRows', () => {
  it('strips the JSONP wrapper and maps rows to column-labeled objects', async () => {
    const body = `/*O_o*/\ngoogle.visualization.Query.setResponse(${JSON.stringify({
      status: 'ok',
      table: {
        cols: [{ label: 'Name' }, { label: 'Mobile' }],
        rows: [
          { c: [{ v: 'Ramita Maid' }, { v: 9960206961 }] },
          { c: [{ v: 'Suchita Cook' }, null] },
        ],
      },
    })});`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: () => Promise.resolve(body) }));

    const rows = await fetchSheetRows('SPREADSHEET_ID', 'Daily Services');

    expect(rows).toEqual([
      { Name: 'Ramita Maid', Mobile: 9960206961 },
      { Name: 'Suchita Cook', Mobile: '' },
    ]);
  });

  it('falls back to Column_N for a sheet with no header label', async () => {
    const body = `/*O_o*/\ngoogle.visualization.Query.setResponse(${JSON.stringify({
      status: 'ok',
      table: {
        cols: [{ label: '' }],
        rows: [{ c: [{ v: 'Unlabeled value' }] }],
      },
    })});`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ text: () => Promise.resolve(body) }));

    const rows = await fetchSheetRows('SPREADSHEET_ID', 'Sheet1');

    expect(rows).toEqual([{ Column_1: 'Unlabeled value' }]);
  });
});
