import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import useInstallPrompt from '../hooks/useInstallPrompt';
import useOnlineStatus from '../hooks/useOnlineStatus';

export default function MainLayout({ sheetNames }) {
  const { canInstall, promptInstall } = useInstallPrompt();
  const isOnline = useOnlineStatus();

  return (
    <div className="d-flex flex-column min-vh-100 bg-light text-dark w-100 overflow-x-hidden">
      
      {/* RESPONSIVE TOP NAVIGATION BAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-light shadow-sm px-3 py-2 w-100">
        <div className="container-fluid px-0">
          
          {/* BRAND LOGO IDENTITY (Clickable Link to Home Dashboard) */}
          <Link 
            to="/" 
            className="d-flex align-items-center text-white text-decoration-none me-3 hover-opacity transition-all"
            title="Go to Home Dashboard"
          >
            <span className="fs-3 me-2 text-info">
              <i className="bi bi-person-lines-fill"></i>
            </span>
            <div>
              <h1 className="h5 mb-0 fw-bold tracking-tight text-info">CityOne Skyve</h1>
              <small className="text-muted d-block" style={{ fontSize: '11px', marginTop: '-2px' }}>
                Contacts Directory
              </small>
            </div>
          </Link>

          {/* Mobile Sync Badge (Hidden on extra small screens to save header space) */}
          <span className="badge bg-info text-dark px-2 py-1.5 rounded-pill fw-semibold shadow-sm d-none d-sm-inline-block me-auto">
            <i className="bi bi-shield-check me-1"></i> Live Sync
          </span>

          {/* Install App Button (Chrome/Edge/Android only - only rendered once the browser signals it's installable) */}
          {canInstall && (
            <button
              type="button"
              onClick={promptInstall}
              className="btn btn-sm btn-primary rounded-pill d-flex align-items-center gap-1 px-3 me-2 flex-shrink-0"
              title="Install this app on your device"
            >
              <i className="bi bi-download"></i>
              <span className="d-none d-sm-inline">Install App</span>
            </button>
          )}

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

      {/* Offline Indicator - contact data still shows from its own local cache while offline */}
      {!isOnline && (
        <div className="alert alert-warning text-center mb-0 py-2 small rounded-0 border-0 border-bottom" role="status">
          <i className="bi bi-wifi-off me-1"></i>
          You're offline — showing your last saved data.
        </div>
      )}

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
      <footer className="bg-white text-muted py-3 border-top mt-auto small w-100">
        <div className="container-fluid px-3 text-center">
          &copy; {new Date().getFullYear()} CityOne Skyve Contacts. All rights reserved.
        </div>
      </footer>
    </div>
  );
}