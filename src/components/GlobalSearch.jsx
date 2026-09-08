import React, { useState, useEffect, useRef } from 'react';
import ContactCard from './ContactCard';
import { readCache, writeCache, fetchSheetRows } from '../utils/sheetData';

const SPREADSHEET_ID = import.meta.env.VITE_V_SPREADSHEET_ID || import.meta.env.VITE_SPREADSHEET_ID;

// Homepage search box that looks across every configured sheet at once,
// instead of requiring you to already know which category a contact lives
// under. Sheets already cached (see sheetData.js) resolve instantly;
// anything not yet cached is fetched on demand, only once a search is
// actually typed - never eagerly on page load.
export default function GlobalSearch({ sheetNames, searchTerm, setSearchTerm }) {
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [results, setResults] = useState(null); // null = no search run yet
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 250);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (!debouncedTerm) {
      setResults(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const run = async () => {
      const allRows = [];
      await Promise.all(sheetNames.map(async (sheetName) => {
        let rows = readCache(sheetName);
        if (!rows) {
          try {
            rows = await fetchSheetRows(SPREADSHEET_ID, sheetName);
            writeCache(sheetName, rows);
          } catch {
            rows = [];
          }
        }
        rows.forEach(contact => allRows.push({ sheetName, contact }));
      }));

      if (requestIdRef.current !== requestId) return; // a newer search superseded this one

      const lower = debouncedTerm.toLowerCase();
      const matched = allRows.filter(({ contact }) =>
        Object.values(contact).some(val => val?.toString().toLowerCase().includes(lower))
      );

      setResults(matched);
      setLoading(false);
    };

    run();
  }, [debouncedTerm, sheetNames]);

  const isSearching = searchTerm.trim().length > 0;

  return (
    <div className="mb-4">
      <div className="position-relative">
        <i
          className="bi bi-search position-absolute text-secondary"
          style={{ top: '50%', left: '1rem', transform: 'translateY(-50%)' }}
        ></i>
        <input
          type="text"
          className="form-control form-control-lg shadow-sm"
          style={{ paddingLeft: '2.75rem', paddingRight: searchTerm ? '2.75rem' : undefined }}
          placeholder="Search every directory at once..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            type="button"
            className="search-clear-btn tap-target-expand d-flex align-items-center justify-content-center"
            onClick={() => setSearchTerm('')}
            aria-label="Clear search"
            title="Clear search"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        )}
      </div>

      {isSearching && (
        <div className="mt-3">
          {loading && (
            <div className="d-flex align-items-center gap-2 text-muted py-2 small">
              <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
              <span>Searching all directories...</span>
            </div>
          )}

          {results !== null && (
            <p className="small text-muted mb-2">
              {results.length} result{results.length === 1 ? '' : 's'} across all directories
            </p>
          )}

          {results !== null && results.length > 0 && (
            <div className="row row-cols-1 row-cols-md-4 row-cols-xl-4 g-3">
              {results.map(({ sheetName, contact }, index) => (
                <div key={`${sheetName}-${index}`} className="col">
                  <ContactCard contact={contact} sheetName={sheetName} sourceLabel={sheetName} />
                </div>
              ))}
            </div>
          )}

          {!loading && results !== null && results.length === 0 && (
            <div className="text-center text-muted py-4">
              <i className="bi bi-search fs-2 mb-2 d-block text-black-50"></i>
              <p className="mb-0">No contacts found across any directory.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
