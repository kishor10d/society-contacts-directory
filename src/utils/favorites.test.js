import { describe, it, expect, beforeEach } from 'vitest';
import { getFavorites, isFavorited, toggleFavorite } from './favorites';

beforeEach(() => {
  localStorage.clear();
});

describe('favorites', () => {
  it('starts empty', () => {
    expect(getFavorites()).toEqual([]);
    expect(isFavorited('Daily Services::123')).toBe(false);
  });

  it('adds a contact on first toggle', () => {
    const contact = { Name: 'Ramita', Mobile: '123' };
    toggleFavorite({ key: 'Daily Services::123', sheetName: 'Daily Services', contact });

    expect(isFavorited('Daily Services::123')).toBe(true);
    expect(getFavorites()).toEqual([
      expect.objectContaining({ key: 'Daily Services::123', sheetName: 'Daily Services', contact }),
    ]);
  });

  it('removes it on a second toggle', () => {
    const contact = { Name: 'Ramita', Mobile: '123' };
    toggleFavorite({ key: 'Daily Services::123', sheetName: 'Daily Services', contact });
    toggleFavorite({ key: 'Daily Services::123', sheetName: 'Daily Services', contact });

    expect(isFavorited('Daily Services::123')).toBe(false);
    expect(getFavorites()).toEqual([]);
  });

  it('keeps distinct contacts independent, most recently added first', () => {
    toggleFavorite({ key: 'A', sheetName: 'S', contact: { Name: 'First' } });
    toggleFavorite({ key: 'B', sheetName: 'S', contact: { Name: 'Second' } });

    const keys = getFavorites().map(f => f.key);
    expect(keys).toEqual(['B', 'A']);
  });
});
