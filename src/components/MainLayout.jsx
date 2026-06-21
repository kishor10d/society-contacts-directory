import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function MainLayout({ sheetNames }) {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light text-dark w-100 overflow-x-hidden">
      
      {/* FULL-WIDTH BRAND HEADER BAR */}
      <header className="navbar navbar-expand-lg navbar-light bg-light shadow-sm px-3 py-3 w-100">
        <div className="container-fluid d-flex justify-content-between align-items-center px-0">
          <div className="d-flex align-items-center text-white">
            <span className="fs-3 me-2 text-info">
              <i className="bi bi-person-lines-fill"></i>
            </span>
            <div>
              <h1 className="h5 mb-0 fw-bold tracking-tight text-info">CityOne Skyve</h1>
              <small className="text-muted d-block" style={{ fontSize: '11px' }}>Contacts Directory</small>
            </div>
          </div>
          <span className="badge bg-info text-dark px-3 py-2 rounded-pill fw-semibold shadow-sm">
            <i className="bi bi-shield-check me-1"></i> Secure Live Sync
          </span>
        </div>
      </header>

      {/* FULL SCREEN BODY FRAME (EDGE TO EDGE) */}
      <div className="container-fluid flex-grow-1 my-3 px-3">
        <div className="row g-3 m-0"> {/* m-0 eliminates negative row margins to prevent unwanted horizontal scrolling */}
          
          {/* SIDEBAR NAVIGATION */}
          <aside className="col-12 col-lg-3 col-xl-2 px-0 pe-lg-2">
            <div className="card border-0 shadow-sm p-3 bg-white rounded-3">
              <div className="text-uppercase text-muted small fw-bold tracking-wider mb-3 px-2" style={{ fontSize: '11px' }}>
                Directories
              </div>
              <nav className="nav flex-column nav-pills gap-2">
                {sheetNames.map((sheet) => (
                  <NavLink
                    key={sheet}
                    to={`/sheet/${encodeURIComponent(sheet)}`}
                    className={({ isActive }) => 
                      `nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-2 transition-all ${
                        isActive ? 'bg-primary text-white shadow-sm fw-semibold' : 'text-secondary bg-light-hover'
                      }`
                    }
                  >
                    <i className="bi bi-people-fill text-muted"></i> {sheet}
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          {/* MAIN COMPONENT DYNAMIC VIEW PLACEHOLDER */}
          <main className="col-12 col-lg-9 col-xl-10 px-0 ps-lg-2">
            <Outlet />
          </main>

        </div>
      </div>

      {/* SYSTEM FOOTER */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto small w-100">
        <div className="container-fluid px-3">
          &copy; {new Date().getFullYear()} CityOne Skyve Contacts. All rights reserved.
        </div>
      </footer>
    </div>
  );
}