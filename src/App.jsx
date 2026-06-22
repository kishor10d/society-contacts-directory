import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import SheetDataViewer from './components/SheetDataViewer';
import Dashboard from './components/Dashboard';

// Parse the comma-separated string from .env into an array
const SHEET_NAMES_STRING = import.meta.env.VITE_SHEET_NAMES || 'Dashboard';
const SHEET_NAMES = SHEET_NAMES_STRING.split(',').map(name => name.trim());

function App() {
  // Graceful fallback check
  if (!import.meta.env.VITE_SPREADSHEET_ID) {
    return (
      <div className="container mt-5 text-center">
        <div className="alert alert-danger shadow">
          <i className="bi bi-exclamation-octagon-fill fs-3 d-block mb-2"></i>
          <h4>Configuration Error</h4>
          <p className="mb-0">Missing VITE_SPREADSHEET_ID environment variable in your root .env file.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout sheetNames={SHEET_NAMES} />}>
          <Route path="sheet/:sheetName" element={<SheetDataViewer />} />
          <Route index element={<Dashboard />} />
          <Route path="*" element={<div className="text-center text-muted mt-5"><h3>404: Sheet Not Found</h3></div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;