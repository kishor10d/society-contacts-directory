import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FilterBar from './FilterBar';

const SPREADSHEET_ID = import.meta.env.VITE_V_SPREADSHEET_ID || import.meta.env.VITE_SPREADSHEET_ID;
const MAX_NAME_LENGTH = 20;

export default function SheetDataViewer() {
  const { sheetName } = useParams();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('all');

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
      setSelectedColumn('all');
      
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

  useEffect(() => {
    if (data.length === 0) return;
    const lowerSearch = searchTerm.toLowerCase();
    const results = data.filter((row) => {
      if (!searchTerm) return true;
      if (selectedColumn === 'all') {
        return Object.values(row).some(val => val?.toString().toLowerCase().includes(lowerSearch));
      } else {
        return row[selectedColumn]?.toString().toLowerCase().includes(lowerSearch);
      }
    });
    setFilteredData(results);
  }, [searchTerm, selectedColumn, data]);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

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
          selectedColumn={selectedColumn}
          setSelectedColumn={setSelectedColumn}
          headers={headers}
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
      
      {!loading && !error && filteredData.length > 0 && (
        <div className="row row-cols-1 row-cols-md-2 g-3">
          {filteredData.map((contact, index) => {
            const rawName = contact.Name || contact.name || Object.values(contact)[0] || "No Name";
            const contactPhone = contact.Phone || contact.phone || contact.Mobile || contact.mobile || "";
            const subTitle = contact.Designation || contact.Role || contact.City || Object.values(contact)[1] || "";

            const displayedName = truncateName(rawName);

            return (
              <div key={index} className="col">
                <div className="card h-100 border border-light shadow-xs rounded-3 d-flex flex-column justify-content-between bg-white overflow-hidden transition-all hover-shadow">
                  
                  {/* TOP PANEL: AVATAR & METADATA INFOBAR */}
                  <div className="p-3 d-flex align-items-start gap-3 flex-grow-1">
                    
                    {/* Clean Avatar Circle (No icon badge overlay) */}
                    <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0" 
                         style={{ width: '50px', height: '50px', fontSize: '18px' }}>
                      {rawName.toString().charAt(0).toUpperCase()}
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
                            <span key={key} className="badge bg-light text-secondary border px-2 py-1 rounded font-monospace" style={{ fontSize: '10px' }}>
                              <strong className="text-dark">{key}:</strong> {val.toString()}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM PANEL: FULL-WIDTH ACTION ACTION TABS */}
                  {contactPhone ? (
                    <div className="d-flex border-top bg-light">
                      {/* CALL ACTION BUTTON */}
                      <a 
                        href={`tel:${contactPhone}`}
                        className="btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 border-end d-flex align-items-center justify-content-center gap-2 fw-semibold text-success hover-bg-light"
                        style={{ fontSize: '13px' }}
                      >
                        <i className="bi bi-telephone-fill"></i> Call
                      </a>
                      
                      {/* SAVE ACTION BUTTON */}
                      <button 
                        onClick={() => handleSaveContact(contact, rawName, contactPhone, subTitle)}
                        className="btn btn-light btn-sm flex-grow-1 rounded-0 py-2.5 d-flex align-items-center justify-content-center gap-2 fw-semibold text-primary hover-bg-light"
                        style={{ fontSize: '13px' }}
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