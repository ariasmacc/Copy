import React from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import Footer from '../../components/layout/Footer'; 
import brightLogo from '../../assets/bright-logo-v3.png';

const PublicLayout = () => {
  return (
    <div className="layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* --- HEADER --- */}
      <header className="header">
        <div className="logo" id="header-logo">
          <Link 
            to="/public/overview" 
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', color: 'inherit' }}
          >
            <img src={brightLogo} alt="BRIGHT" />
            <h1 style={{ margin: 0, fontSize: '1.5em', color: 'white' }}>BRIGHT</h1>
          </Link>
          <div className="staff-portal">Public Access</div>
        </div>
        <div className="user-section">
          <Link  
            to="/welcome" 
            className="logout-btn" 
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Exit
          </Link>
        </div>
      </header>

      {/* --- PAGE TITLE --- */}
      <div className="page-header">
        <h2>Public Dashboard</h2>
        <p>Transparent view of budget allocations and expenses</p>
      </div>

      {/* --- NAV TABS --- */}
      <nav className="nav-tabs">
        <NavLink to="/public/overview" className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>
        <NavLink to="/public/ledger" className={({ isActive }) => isActive ? 'active' : ''}>Transaction Ledger</NavLink>
        <NavLink to="/public/documents" className={({ isActive }) => isActive ? 'active' : ''}>Documents</NavLink>
      </nav>

      {/* --- MAIN CONTENT (Where child pages render) --- */}
      <main className="content-container" style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* --- FOOTER (Includes Integrated Modals) --- */}
      <Footer /> 
    </div>
  );
};

export default PublicLayout;