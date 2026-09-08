import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Tooltip } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import FilterBar from './FilterBar';
import ContactCard from './ContactCard';
import {
  readCache,
  writeCache,
  fetchSheetRows,
  detectCategoryColumn,
  getCategoryOptions,
  getContactName,
} from '../utils/sheetData';

const SPREADSHEET_ID = import.meta.env.VITE_V_SPREADSHEET_ID || import.meta.env.VITE_SPREADSHEET_ID;

export default function SheetDataViewer() {
  const { sheetName } = useParams();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  // Starts true: a fetch (or at least a cache check) always kicks off on
  // mount, and defaulting to false made data.length === 0 look identical to
  // a genuinely empty sheet for one render before that fetch had even
  // started - harmless before, but the auto-tooltip below turns that into a
  // real (crashing) false positive if left as false.
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOrder, setSortOrder] = useState('none'); // 'none' | 'asc' | 'desc'

  const refreshBtnRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setSelectedCategory('all');
      setSortOrder('none');

      // Sheet data rarely changes, so serve a recent cached copy instantly
      // instead of hitting Google Sheets on every visit.
      const cachedRows = readCache(sheetName);
      if (cachedRows) {
        setData(cachedRows);
        setFilteredData(cachedRows);
        setLoading(false);
        return;
      }

      setLoading(true);
      setData([]);
      setFilteredData([]);

      try {
        const rows = await fetchSheetRows(SPREADSHEET_ID, sheetName);
        setData(rows);
        setFilteredData(rows);
        writeCache(sheetName, rows);
      } catch (err) {
        setError(`Failed to retrieve records for sheet "${sheetName}". Ensure the sheet permissions are public.`);
      } finally {
        setLoading(false);
      }
    };

    if (sheetName) loadData();
  }, [sheetName]);

  const handleRefresh = async () => {
    if (!sheetName || refreshing) return;
    tooltipRef.current?.hide();
    setRefreshing(true);
    setError(null);
    try {
      const rows = await fetchSheetRows(SPREADSHEET_ID, sheetName);
      setData(rows);
      setFilteredData(rows);
      writeCache(sheetName, rows);
    } catch (err) {
      setError(`Failed to retrieve records for sheet "${sheetName}". Ensure the sheet permissions are public.`);
    } finally {
      setRefreshing(false);
    }
  };

  // Nothing loaded (not still loading, no error) - point an auto-shown
  // tooltip at the refresh button so it's obvious how to try again.
  const showEmptyRefreshHint = !loading && !error && data.length === 0;

  useEffect(() => {
    if (!showEmptyRefreshHint) return undefined;
    const btn = refreshBtnRef.current;
    if (!btn) return undefined;

    // Built fresh each time rather than reused: the refresh button itself
    // unmounts/remounts whenever `loading` toggles (it's conditionally
    // rendered), so a stale instance from a previous mount would end up
    // driving a detached DOM node and throw.
    const tooltip = new Tooltip(btn, {
      title: 'No contacts loaded — tap to refresh',
      placement: 'bottom',
      trigger: 'manual',
    });
    tooltipRef.current = tooltip;
    tooltip.show();

    const autoHide = setTimeout(() => {
      if (btn.isConnected) tooltip.hide();
    }, 6000);

    return () => {
      clearTimeout(autoHide);
      tooltip.dispose();
      if (tooltipRef.current === tooltip) tooltipRef.current = null;
    };
  }, [showEmptyRefreshHint]);

  // Debounce the raw keystrokes so filtering doesn't run on every character,
  // which can stutter on longer sheets when typing on a phone.
  useEffect(() => {
    const timeoutId = setTimeout(() => setDebouncedSearchTerm(searchTerm), 200);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const headers = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);
  const categoryColumn = useMemo(() => detectCategoryColumn(data, headers), [data, headers]);
  const categoryOptions = useMemo(() => getCategoryOptions(data, categoryColumn), [data, categoryColumn]);

  useEffect(() => {
    if (data.length === 0) return;
    const lowerSearch = debouncedSearchTerm.toLowerCase();
    let results = data.filter((row) => {
      if (selectedCategory !== 'all' && row[categoryColumn]?.toString().trim() !== selectedCategory) {
        return false;
      }
      if (!debouncedSearchTerm) return true;
      return Object.values(row).some(val => val?.toString().toLowerCase().includes(lowerSearch));
    });

    if (sortOrder !== 'none') {
      results = [...results].sort((a, b) => {
        const comparison = getContactName(a).toString().localeCompare(getContactName(b).toString());
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    setFilteredData(results);
  }, [debouncedSearchTerm, selectedCategory, sortOrder, data, categoryColumn]);

  const cycleSortOrder = () => {
    setSortOrder(prev => (prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none'));
  };

  return (
    <div className="sheet-card card">
      
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2">
        <h2 className="h4 mb-0 fw-bold text-dark">{sheetName} Directory</h2>
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-primary text-white px-3 py-2 rounded-2 fs-7 fw-medium shadow-sm">
            {filteredData.length} Contacts Found
          </span>
          {!loading && !error && (
            <button
              ref={refreshBtnRef}
              type="button"
              className="btn btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '36px', height: '36px' }}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh contacts"
            >
              <i className={`bi bi-arrow-clockwise ${refreshing ? 'spin' : ''}`}></i>
            </button>
          )}
        </div>
      </div>

      {!loading && !error && data.length > 0 && (
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryColumn={categoryColumn}
          categoryOptions={categoryOptions}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          sortOrder={sortOrder}
          onToggleSort={cycleSortOrder}
        />
      )}

      {loading && (
        <div className="row row-cols-1 row-cols-md-4 row-cols-xl-4 g-3" aria-busy="true" aria-label="Loading contacts">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="col">
              <div className="card h-100 shadow-sm rounded-3 overflow-hidden">
                <div className="p-3 d-flex align-items-start gap-3">
                  <div className="skeleton-block rounded-circle flex-shrink-0" style={{ width: '50px', height: '50px' }}></div>
                  <div className="flex-grow-1 min-w-0">
                    <div className="skeleton-block rounded mb-2" style={{ height: '14px', width: '70%' }}></div>
                    <div className="skeleton-block rounded" style={{ height: '11px', width: '45%' }}></div>
                  </div>
                </div>
                <div className="border-top bg-light p-2">
                  <div className="skeleton-block rounded" style={{ height: '26px' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 shadow-sm rounded-3 my-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{error}</div>
        </div>
      )}
      
      {/* LOCKED DATA CARD LAYOUT MAPPED: 1 ON MOBILE, 4 ON DESKTOP */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="row row-cols-1 row-cols-md-4 row-cols-xl-4 g-3">
          {filteredData.map((contact, index) => (
            <div key={index} className="col">
              <ContactCard contact={contact} sheetName={sheetName} />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && data.length > 0 && filteredData.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-search fs-2 mb-2 d-block text-black-50"></i>
          <p className="mb-0">No directory contacts found matching criteria inputs.</p>
        </div>
      )}

      {showEmptyRefreshHint && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-inbox fs-2 mb-2 d-block text-black-50"></i>
          <p className="mb-0">No contacts loaded for this section yet.</p>
          <p className="mb-0 small">Tap the refresh button above to try again.</p>
        </div>
      )}
    </div>
  );
}