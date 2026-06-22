import React from 'react';
import { Link } from 'react-router-dom';

// Fetch names from environment variables
const SHEET_NAMES_ENV = import.meta.env.VITE_SHEET_NAMES || '';
const SHEET_NAMES = SHEET_NAMES_ENV ? SHEET_NAMES_ENV.split(',').map(s => s.trim()) : [];

export default function Dashboard() {
  return (
    <div className="container-fluid px-0 w-100">
      
      {/* Hero Welcome Unit - Responsive Edge-to-Edge Banner */}
      <div className="bg-white p-4 p-md-5 rounded-3 shadow-sm border mb-4 text-center text-md-start position-relative overflow-hidden w-100">
        <div className="position-absolute top-0 end-0 p-4 opacity-10 d-none d-md-block">
          <i className="bi bi-building-gear" style={{ fontSize: '100px' }}></i>
        </div>
        <div className="position-relative z-1" style={{ maxWidth: '800px' }}>
          <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 rounded-pill fw-semibold font-monospace" style={{ fontSize: '11px' }}>
            INTERNAL DIRECTORY RUNTIME
          </span>
          <h1 className="display-6 fw-bold text-dark tracking-tight mb-2">
            CityOne Skyve Contacts
          </h1>
          <p className="lead text-secondary mb-0 fs-6">
            Central communications hub. Select a directory division category below to view, search, or filter live synchronized contact cards.
          </p>
        </div>
      </div>

      {/* Directory Segments Category Header */}
      <div className="d-flex align-items-center gap-2 mb-3 px-1">
        <i className="bi bi-grid-fill text-primary"></i>
        <h2 className="h6 mb-0 fw-bold text-dark text-uppercase tracking-wider">Available Directories</h2>
      </div>

      {/* RESPONSIVE GRID LAYOUT: 2 Columns on Mobile, 4 Columns on Desktop */}
      {SHEET_NAMES.length > 0 ? (
        <div className="row mx-n2 row-cols-2 row-cols-md-4 row-cols-xl-4 g-2 w-100 m-0">
          {SHEET_NAMES.map((name, index) => (
            <div key={index} className="col px-1">
              <Link 
                to={`/sheet/${encodeURIComponent(name)}`}
                className="card h-100 text-decoration-none bg-white shadow-sm rounded-3 p-3 d-flex flex-column justify-content-between position-relative overflow-hidden"
                style={{ 
                  transition: 'all 0.2s ease-in-out',
                  minHeight: '115px',
                  border: '1.5px solid var(--bs-border-color-translucent)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0d6efd';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bs-border-color-translucent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                }}
              >
                <div className="min-w-0">
                  {/* Smaller, more compact icon wrapper */}
                  <div className="bg-primary-subtle text-primary rounded-2 d-flex align-items-center justify-content-center mb-2 shadow-xs" 
                       style={{ width: '32px', height: '32px', fontSize: '14px' }}>
                    <i className="bi bi-folder-symlink-fill"></i>
                  </div>
                  
                  {/* Truncated header to protect layouts from long words */}
                  <h3 className="h6 fw-bold text-dark mb-0 text-truncate font-sans-serif" style={{ fontSize: '14px' }} title={name}>
                    {name}
                  </h3>
                </div>
                
                {/* Clean inline navigation indicator */}
                <div className="d-flex align-items-center justify-content-end text-primary pt-1" style={{ fontSize: '11px', fontWeight: '600' }}>
                  <span>Open</span>
                  <i className="bi bi-arrow-right-short fs-6 ms-0.5"></i>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-warning shadow-sm rounded-3 border-warning-subtle mx-1" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>No Sheets Configured:</strong> Check your <code>.env</code> file assignment setup for <code>VITE_SHEET_NAMES</code>.
        </div>
      )}
    </div>
  );
}