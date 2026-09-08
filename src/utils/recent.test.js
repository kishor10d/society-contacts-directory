import { describe, it, expect, beforeEach } from 'vitest';
import { getRecent, recordRecent } from './recent';

beforeEach(() => {
  localStorage.clear();
});

describe('recent', () => {
  it('starts empty', () => {
    expect(getRecent()).toEqual([]);
  });

  it('records a contact most-recent-first', () => {
    recordRecent({ key: 'A', sheetName: 'S', contact: { Name: 'First' } });
    recordRecent({ key: 'B', sheetName: 'S', contact: { Name: 'Second' } });

    expect(getRecent().map(r => r.key)).toEqual(['B', 'A']);
  });

  it('moves an already-recorded contact back to the front instead of duplicating it', () => {
    recordRecent({ key: 'A', sheetName: 'S', contact: { Name: 'First' } });
    recordRecent({ key: 'B', sheetName: 'S', contact: { Name: 'Second' } });
    recordRecent({ key: 'A', sheetName: 'S', contact: { Name: 'First' } });

    expect(getRecent().map(r => r.key)).toEqual(['A', 'B']);
  });

  it('caps the list at 6 entries', () => {
    for (let i = 0; i < 8; i++) {
      recordRecent({ key: `K${i}`, sheetName: 'S', contact: { Name: `N${i}` } });
    }
    expect(getRecent()).toHaveLength(6);
    // Most recent 6 survive: K7 down to K2.
    expect(getRecent().map(r => r.key)).toEqual(['K7', 'K6', 'K5', 'K4', 'K3', 'K2']);
  });
});
