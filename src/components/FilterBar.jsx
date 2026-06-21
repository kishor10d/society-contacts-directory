import React from 'react';

export default function FilterBar({ searchTerm, setSearchTerm, selectedColumn, setSelectedColumn, headers }) {
  return (
    <div className="row g-3 p-3 bg-light rounded-3 border mb-4 mx-0 shadow-sm align-items-end">
      
      {/* Search Input */}
      <div className="col-12 col-sm-6 col-md-8">
        <label className="form-label small fw-bold text-secondary mb-1">
          <i className="bi bi-search me-1"></i> Search Contacts:
        </label>
        <input
          type="text"
          className="form-control bg-white shadow-none"
          placeholder="Type name, designation, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Field Selector Dropdown */}
      <div className="col-12 col-sm-6 col-md-4">
        <label className="form-label small fw-bold text-secondary mb-1">
          <i className="bi bi-filter-square me-1"></i> Search Field:
        </label>
        <select 
          className="form-select bg-white cursor-pointer shadow-none"
          value={selectedColumn} 
          onChange={(e) => setSelectedColumn(e.target.value)}
        >
          <option value="all">All Fields</option>
          {headers.map(header => (
            <option key={header} value={header}>{header}</option>
          ))}
        </select>
      </div>

    </div>
  );
}