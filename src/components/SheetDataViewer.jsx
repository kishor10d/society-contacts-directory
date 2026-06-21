import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import FilterBar from "./FilterBar";

const SPREADSHEET_ID =
  import.meta.env.VITE_V_SPREADSHEET_ID || import.meta.env.VITE_SPREADSHEET_ID;
const MAX_NAME_LENGTH = 20; // Change this number to adjust character limit parameters

export default function SheetDataViewer() {
  const { sheetName } = useParams();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("all");

  // Helper function to cleanly truncate string values safely
  const truncateName = (str) => {
    if (!str) return "No Name";
    const nameStr = str.toString();
    return nameStr.length > MAX_NAME_LENGTH
      ? nameStr.substring(0, MAX_NAME_LENGTH).trim() + "..."
      : nameStr;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      setFilteredData([]);
      setSearchTerm("");
      setSelectedColumn("all");

      try {
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(url);
        const text = await response.text();
        const jsonString = text.substring(
          text.indexOf("{"),
          text.lastIndexOf("}") + 1,
        );
        const json = JSON.parse(jsonString);

        const cols = json.table.cols.map((col) => col.label || "");
        const rows = json.table.rows.map((row) => {
          const rowData = {};
          row.c.forEach((cell, index) => {
            const key = cols[index] || `Column_${index + 1}`;
            rowData[key] = cell ? cell.v : "";
          });
          return rowData;
        });

        setData(rows);
        setFilteredData(rows);
      } catch (err) {
        setError(
          `Failed to retrieve records for sheet "${sheetName}". Ensure the sheet permissions are public.`,
        );
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
      if (selectedColumn === "all") {
        return Object.values(row).some((val) =>
          val?.toString().toLowerCase().includes(lowerSearch),
        );
      } else {
        return row[selectedColumn]
          ?.toString()
          .toLowerCase()
          .includes(lowerSearch);
      }
    });
    setFilteredData(results);
  }, [searchTerm, selectedColumn, data]);

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="card border-0 shadow-sm bg-white p-4 rounded-3">
      {/* Title Header area */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-2">
        <h2 className="h4 mb-0 fw-bold text-dark">{sheetName} Directory</h2>
        <span className="badge bg-primary text-white px-3 py-2 rounded-2 fs-7 fw-medium shadow-sm">
          {filteredData.length} Contacts Found
        </span>
      </div>

      {/* Filters integration */}
      {!loading && !error && data.length > 0 && (
        <FilterBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedColumn={selectedColumn}
          setSelectedColumn={setSelectedColumn}
          headers={headers}
        />
      )}

      {/* State Indicators */}
      {loading && (
        <div className="d-flex align-items-center text-muted py-5 px-3 gap-2 justify-content-center">
          <div
            className="spinner-border spinner-border-sm text-primary"
            role="status"
          ></div>
          <span>Loading contact entities...</span>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger d-flex align-items-center gap-2 shadow-sm rounded-3 my-3"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill fs-5"></i>
          <div>{error}</div>
        </div>
      )}

      {/* RESPONSIVE CARD THUMBNAIL LAYOUT */}
      {!loading && !error && filteredData.length > 0 && (
        <div className="row row-cols-1 row-cols-md-4 g-3">
          {filteredData.map((contact, index) => {
            const rawName = contact.Name || contact.name || Object.values(contact)[0] || "No Name";
            const contactPhone = contact.Phone || contact.phone || contact.Mobile || contact.mobile || "";
            const subTitle = contact.Designation || contact.Role || contact.City || Object.values(contact)[1] || "";

            // Truncate the display name
            const displayedName = truncateName(rawName);

            return (
              <div key={index} className="col">
                <div className="card h-100 border border-light shadow-xs p-3 rounded-3 d-flex flex-row align-items-center gap-3 bg-white hover-shadow transition-all">
                  
                  {/* INTERACTIVE CALL AVATAR SECTION */}
                  {contactPhone ? (
                    // If phone exists, wrap the entire avatar profile circle inside a click-to-call link action frame
                    <a href={`tel:${contactPhone}`} 
                      className="position-relative d-inline-block text-decoration-none flex-shrink-0 group-call" 
                      title={`Call ${rawName}`}
                      style={{ width: '54px', height: '54px' }}>
                      
                      {/* Base Initial Letter Profile Circle */}
                      <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm h-100 w-100" 
                          style={{ fontSize: '19px' }}>
                        {rawName.toString().charAt(0).toUpperCase()}
                      </div>

                      {/* Overlaid Action Badge (Positioned at bottom right corner overlay) */}
                      <div className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center border border-2 border-white shadow-sm"
                          style={{ width: '22px', height: '22px', fontSize: '11px' }}>
                        <i className="bi bi-telephone-fill"></i>
                      </div>
                    </a>
                  ) : (
                    // Standard Static Avatar if no telephone field exists for the record
                    <div className="bg-info-subtle text-info rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm flex-shrink-0" 
                        style={{ width: '54px', height: '54px', fontSize: '19px' }}>
                      {rawName.toString().charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Core Details (Middle and Right Expansion Section) */}
                  <div className="flex-grow-1 min-w-0">
                    <h3 className="h6 text-truncate text-dark mb-0 fw-semibold" title={rawName.toString()}>
                      {displayedName}
                    </h3>
                    {subTitle && <small className="text-muted text-truncate d-block mb-1">{subTitle.toString()}</small>}
                    
                    {/* Tags List block */}
                    <div className="d-flex flex-wrap gap-1">
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
              </div>
            );
          })}
        </div>
      )}

      {/* Empty queries message block */}
      {!loading && !error && data.length > 0 && filteredData.length === 0 && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-search fs-2 mb-2 d-block text-black-50"></i>
          <p className="mb-0">
            No directory contacts found matching criteria inputs.
          </p>
        </div>
      )}
    </div>
  );
}
