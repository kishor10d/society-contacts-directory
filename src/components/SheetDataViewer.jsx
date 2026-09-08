import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Tooltip } from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import FilterBar from './FilterBar';
import {
  readCache,
  writeCache,
  fetchSheetRows,
  detectCategoryColumn,
  getCategoryOptions,
  getContactName,
} from '../utils/sheetData';

const SPREADSHEET_ID = import.meta.env.VITE_V_SPREADSHEET_ID || import.meta.env.VITE_SPREADSHEET_ID;
const MAX_NAME_LENGTH = 20;

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

  const truncateName = (str) => {
    if (!str) return "No Name";
    const nameStr = str.toString();
    return nameStr.length > MAX_NAME_LENGTH 
      ? nameStr.substring(0, MAX_NAME_LENGTH).trim() + '...' 
      : nameStr;
  };

  const handleSaveContact = (contact, rawName, contactPhone, subTitle) => {
    if (!contactPhone) return;

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${rawName}`,
      `TEL;TYPE=CELL:${contactPhone}`,
      `TITLE:${subTitle}`,
      `NOTE:Saved from CityOne Skyve Contacts (${sheetName})`,
      'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const safeFileName = `${rawName.toString().replace(/[^a-zA-Z0-9]/g, '_')}_Contact.vcf`;
    
    link.href = url;
    link.setAttribute('download', safeFileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
          {filteredData.map((contact, index) => {
            const rawName = getContactName(contact);
            const contactPhone = contact.Phone || contact.phone || contact.Mobile || contact.mobile || "";
            const subTitle = contact.Designation || contact.Role || contact.City || Object.values(contact)[1] || "";

            const displayedName = truncateName(rawName);

            return (
              <div key={index} className="col">
                <div className="card hover-card h-100 shadow-sm rounded-3 d-flex flex-column justify-content-between bg-white overflow-hidden">
                  
                  {/* TOP PANEL: AVATAR & METADATA INFOBAR */}
                  <div className="p-3 d-flex align-items-start gap-3 flex-grow-1">
                    
                    {/* AVATAR WRAPPER CONTAINER FRAME */}
                    <div className="position-relative flex-shrink-0" style={{ width: '50px', height: '50px' }}>
                      
                      {/* Monogram Initials Circle Base */}
                      <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm h-100 w-100" 
                           style={{ fontSize: '1.125rem' }}>
                        {rawName.toString().charAt(0).toUpperCase()}
                      </div>

                      {/* ABSOLUTE OVERLAID WHATSAPP ACTION BUTTON BADGE */}
                      {contactPhone && (
                        <a
                          href={`https://wa.me/${contactPhone.toString().replace(/[^0-9]/g, '')}`}
                          className="tap-target-expand position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow"
                          style={{
                            width: '26px',
                            height: '26px',
                            fontSize: '0.8125rem',
                            zIndex: '2'
                          }}
                          title={`Chat with ${rawName} on WhatsApp`}
                          onClick={(e) => e.stopPropagation()} // Bypasses accidental container execution captures
                        >
                          <i className="bi bi-whatsapp"></i>
                        </a>
                      )}
                    </div>

                    {/* Meta Fields Content Stack */}
                    <div className="min-w-0 flex-grow-1">
                      <h3 className="h6 contact-name text-truncate text-dark mb-0 fw-bold" title={rawName.toString()}>
                        {displayedName}
                      </h3>
                      {subTitle && (
                        <small className="contact-subtitle text-muted text-truncate d-block mb-2">
                          {subTitle.toString()}
                        </small>
                      )}
                      
                      <div className="d-flex flex-wrap gap-1 align-items-center">
                        {Object.entries(contact).map(([key, val]) => {
                          if (['name', 'phone', 'mobile', 'designation', 'role'].includes(key.toLowerCase()) || !val) return null;
                          return (
                            <span key={key} className="badge bg-light text-secondary border px-2 py-1 rounded font-monospace" style={{ fontSize: '0.625rem' }}>
                              <strong className="text-dark">{key}:</strong> {val.toString()}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM PANEL: FULL-WIDTH ACTION TABS */}
                  {contactPhone ? (
                    <div className="d-flex border-top bg-light">
                      {/* CALL ACTION BUTTON */}
                      <a
                        href={`tel:${contactPhone}`}
                        className="contact-action-btn btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 border-end d-flex align-items-center justify-content-center gap-2 fw-semibold text-success"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <i className="bi bi-telephone-fill"></i> Call
                      </a>
                      
                      {/* SAVE ACTION BUTTON */}
                      <button
                        onClick={() => handleSaveContact(contact, rawName, contactPhone, subTitle)}
                        className="contact-action-btn btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold text-primary"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <i className="bi bi-person-plus-fill"></i> Save Contact
                      </button>
                    </div>
                  ) : (
                    <div className="border-top bg-light p-2 text-center small text-muted font-monospace">
                      No contact details provided
                    </div>
                  )}

                </div>
              </div>
            );
          })}
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