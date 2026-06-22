import React from 'react';
import { Link } from 'react-router-dom';

// Fetch names from environment variables
const SHEET_NAMES_ENV = import.meta.env.VITE_SHEET_NAMES || '';
const SHEET_NAMES = SHEET_NAMES_ENV ? SHEET_NAMES_ENV.split(',').map(s => s.trim()) : [];

export default function Dashboard() {
  return (
    <div className="container-fluid px-0 w-100">
      {/* Hero Welcome Unit - Edge-to-Edge Full-Screen Banner */}
      <div className="bg-white p-5 rounded-3 shadow-sm border mb-4 text-center text-md-start position-relative overflow-hidden w-100">
        <div className="position-absolute top-0 end-0 p-4 opacity-10 d-none d-md-block">
          <i className="bi bi-building-gear" style={{ fontSize: '120px' }}></i>
        </div>
        <div className="position-relative z-1" style={{ maxWidth: '800px' }}>
          <span className="badge bg-primary-subtle text-primary mb-2 px-3 py-2 rounded-pill fw-semibold font-monospace">
            INTERNAL DIRECTORY RUNTIME
          </span>
          <h1 className="display-5 fw-bold text-dark tracking-tight mb-2">
            CityOne Skyve Contacts
          </h1>
          <p className="lead text-secondary mb-0">
            Central communications hub. Select a directory division category below to view, search, or filter live synchronized contact cards.
          </p>
        </div>
      </div>

      {/* Directory Segments Category Header */}
      <div className="d-flex align-items-center gap-2 mb-3 px-1">
        <i className="bi bi-grid-fill text-primary"></i>
        <h2 className="h5 mb-0 fw-bold text-dark">Available Directory Segments</h2>
      </div>

      {/* Responsive Cards Grid locked to full screen 1-column mobile, 4-column desktop layout */}
      {SHEET_NAMES.length > 0 ? (
        <div className="row m-0 row-cols-1 row-cols-md-4 row-cols-xl-4 g-3 w-100">
          {SHEET_NAMES.map((name, index) => (
            <div key={index} className="col px-0 px-sm-2">
              <Link 
                to={`/sheet/${encodeURIComponent(name)}`}
                className="card h-100 text-decoration-none bg-white shadow-sm rounded-3 p-4 d-flex flex-column justify-content-between border position-relative overflow-hidden"
                style={{ 
                  transition: 'all 0.2s ease-in-out',
                  minHeight: '140px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0d6efd';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bs-border-color-translucent)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                }}
              >
                <div>
                  <div className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center mb-3 shadow-sm" 
                       style={{ width: '42px', height: '42px', fontSize: '18px' }}>
                    <i className="bi bi-folder-symlink-fill"></i>
                  </div>
                  <h3 className="h6 fw-bold text-dark mb-1 text-truncate" title={name}>
                    {name}
                  </h3>
                  <p className="small text-muted mb-0 text-truncate">
                    View division data rows
                  </p>
                </div>
                
                <div className="d-flex align-items-center justify-content-end text-primary pt-2 fs-7 fw-semibold">
                  <span>Open Ledger</span>
                  <i className="bi bi-arrow-right-short fs-5 ms-1"></i>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-warning shadow-sm rounded-3 border-warning-subtle" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>No Sheets Configured:</strong> Check your <code>.env</code> file assignment context setup for <code>VITE_SHEET_NAMES</code>.
        </div>
      )}
    </div>
  );
}