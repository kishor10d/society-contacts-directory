import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

export default function MainLayout({ sheetNames }) {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light text-dark w-100 overflow-x-hidden">
      
      {/* RESPONSIVE TOP NAVIGATION BAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm px-3 py-2 w-100">
        <div className="container-fluid px-0">
          
          {/* Brand Identity Branding */}
          <div className="d-flex align-items-center text-white me-3">
            <span className="fs-3 me-2 text-info">
              <i className="bi bi-person-lines-fill"></i>
            </span>
            <div>
              <h1 className="h5 mb-0 fw-bold tracking-tight text-info">CityOne Skyve</h1>
              <small className="text-muted d-block" style={{ fontSize: '11px', marginTop: '-2px' }}>
                Contacts Directory
              </small>
            </div>
          </div>

          {/* Mobile Sync Badge (Hidden on extra small screens to save header space) */}
          <span className="badge bg-info text-dark px-2 py-1.5 rounded-pill fw-semibold shadow-sm d-none d-sm-inline-block me-auto">
            <i className="bi bi-shield-check me-1"></i> Live Sync
          </span>

          {/* Hamburger Toggle Button for Mobile Screens */}
          <button 
            className="navbar-toggler border-0 shadow-none text-info fs-3 p-1" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#skyveDirectoryNavbar" 
            aria-controls="skyveDirectoryNavbar" 
            aria-expanded="false" 
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list"></i>
          </button>

          {/* Collapsible Menu Container */}
          <div className="collapse navbar-collapse" id="skyveDirectoryNavbar">
            
            <ul className="navbar-nav ms-lg-4 mt-3 mt-lg-0 gap-1 flex-grow-1 justify-content-lg-start">
							<li className="nav-item">
								<NavLink
									to="/"
									end // Prevents home link matching sub-directories path segments active states
									className={({ isActive }) => 
										`nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-2 transition-all ${
											isActive ? 'bg-primary text-white shadow-sm fw-semibold active' : 'text-secondary bg-light-hover'
										}`
									}
								>
									<i className="bi bi-house-door-fill text-muted d-lg-none"></i> Home
								</NavLink>
							</li>
              {sheetNames.map((sheet) => (
                <li className="nav-item" key={sheet}>
                  <NavLink
                    to={`/sheet/${encodeURIComponent(sheet)}`}
                    className={({ isActive }) => 
                      `nav-link d-flex align-items-center gap-2 py-2 px-3 rounded-2 transition-all ${
                        isActive ? 'bg-primary text-white shadow-sm fw-semibold active' : 'text-secondary bg-light-hover'
                      }`
                    }
                  >
                    <i className="bi bi-folder-symlink text-muted d-lg-none"></i> {sheet}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </nav>

      {/* FULL WIDTH DYNAMIC CONTENT CONTAINER */}
      <div className="container-fluid flex-grow-1 my-4 px-3">
        <div className="row m-0 w-100">
          <main className="col-12 px-0">
            {/* The structural dynamic page viewport hook */}
            <Outlet />
          </main>
        </div>
      </div>

      {/* FOOTER FRAME */}
      <footer className="bg-white text-center text-muted py-3 border-top mt-auto small w-100">
        <div className="container-fluid px-3">
          &copy; {new Date().getFullYear()} CityOne Skyve Contacts. All rights reserved.
        </div>
      </footer>
    </div>
  );
}