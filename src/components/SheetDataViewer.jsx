import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import FilterBar from './FilterBar';

const SPREADSHEET_ID = import.meta.env.VITE_V_SPREADSHEET_ID || import.meta.env.VITE_SPREADSHEET_ID;
const MAX_NAME_LENGTH = 20;
const CATEGORY_EXCLUDED_KEYS = ['name', 'phone', 'mobile', 'email', 'remarks', 'note', 'notes', 'address'];

// Picks the column that reads best as a set of quick-filter chips: not a
// name/phone/free-text field, has more than one value, and its values repeat
// across rows often enough to be a useful category (rather than near-unique
// per row, like a "Remarks" column would be).
function detectCategoryColumn(data, headers) {
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
    if (uniqueCount < 2 || uniqueCount > 15) continue;

    const ratio = uniqueCount / values.length;
    if (ratio > 0.6) continue;

    if (!best || ratio < best.ratio) {
      best = { header, ratio };
    }
  }
  return best ? best.header : null;
}

function getCategoryOptions(data, categoryColumn) {
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

export default function SheetDataViewer() {
  const { sheetName } = useParams();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

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
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      setFilteredData([]);
      setSearchTerm('');
      setDebouncedSearchTerm('');
      setSelectedCategory('all');
      
      try {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);
        const text = await response.text();
        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const json = JSON.parse(jsonString);
        
        const cols = json.table.cols.map(col => col.label || '');
        const rows = json.table.rows.map(row => {
          const rowData = {};
          row.c.forEach((cell, index) => {
            const key = cols[index] || `Column_${index + 1}`;
            rowData[key] = cell ? cell.v : '';
          });
          return rowData;
        });

        setData(rows);
        setFilteredData(rows);
      } catch (err) {
        setError(`Failed to retrieve records for sheet "${sheetName}". Ensure the sheet permissions are public.`);
      } finally {
        setLoading(false);
      }
    };

    if (sheetName) fetchData();
  }, [sheetName]);

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
    const results = data.filter((row) => {
      if (selectedCategory !== 'all' && row[categoryColumn]?.toString().trim() !== selectedCategory) {
        return false;
      }
      if (!debouncedSearchTerm) return true;
      return Object.values(row).some(val => val?.toString().toLowerCase().includes(lowerSearch));
    });
    setFilteredData(results);
  }, [debouncedSearchTerm, selectedCategory, data, categoryColumn]);

  return (
    <div className="card border-0 shadow-sm bg-white p-4 rounded-3">
      
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2">
        <h2 className="h4 mb-0 fw-bold text-dark">{sheetName} Directory</h2>
        <span className="badge bg-primary text-white px-3 py-2 rounded-2 fs-7 fw-medium shadow-sm">
          {filteredData.length} Contacts Found
        </span>
      </div>

      {!loading && !error && data.length > 0 && (
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          categoryColumn={categoryColumn}
          categoryOptions={categoryOptions}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      )}

      {loading && (
        <div className="d-flex align-items-center text-muted py-5 px-3 gap-2 justify-content-center">
          <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
          <span>Loading contact entities...</span>
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
            const rawName = contact.Name || contact.name || Object.values(contact)[0] || "No Name";
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
                      <h3 className="h6 text-truncate text-dark mb-0 fw-bold" title={rawName.toString()}>
                        {displayedName}
                      </h3>
                      {subTitle && <small className="text-muted text-truncate d-block mb-2">{subTitle.toString()}</small>}
                      
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
                        className="btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 border-end d-flex align-items-center justify-content-center gap-2 fw-semibold text-success"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <i className="bi bi-telephone-fill"></i> Call
                      </a>
                      
                      {/* SAVE ACTION BUTTON */}
                      <button 
                        onClick={() => handleSaveContact(contact, rawName, contactPhone, subTitle)}
                        className="btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold text-primary"
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
    </div>
  );
}