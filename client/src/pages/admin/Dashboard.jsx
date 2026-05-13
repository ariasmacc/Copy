import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  
  // State for UI Toggles
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); 
  const [user, setUser] = useState({ name: 'User', role: 'Staff' });

  // Password Visibility States
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Sync with LocalStorage for User Info
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    navigate('/login');
  };

  const closeModal = () => setActiveModal(null);
  return (
    <>
      {/* HEADER SECTION */}
      <header className="header">
        <div className="logo" id="header-logo">
          <a href="#" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
            <img src="/src/assets/bright-logo-v3.png" alt="BRIGHT Logo" />
          </a>
          <div className="staff-portal">Staff Portal</div>
        </div>

        <div className="user-section">
          <div className="role">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shield-icon">
              <path d="M12 2l7 4v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V6l7-4z" />
            </svg>
            <span id="layout-user-role">Role</span>
          </div>
          <div className="user-profile-trigger">
            <div className="username">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="profile-icon">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span id="layout-user-name">User</span>
          </div>

          <div className="dropdown-menu" id="userDropdown">
            <div className="dropdown-header">My Account</div>
            <a href="#" className="dropdown-item" data-modal-open="accountSettingsModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Account Settings
            </a>
            <a href="#" className="dropdown-item" data-modal-open="changePasswordModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Change Password
            </a>
            <div className="dropdown-divider"></div>
            <a href="#" className="dropdown-item logout-item" id="logout-button">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </a>
          </div>
        </div>
      </header>

      {/* PAGE HEADER */}
      <div className="page-header">
        <h2>Staff Dashboard</h2>
        <p>Manage budget allocations, record expenses, and validate transactions</p>
      </div>

      {/* NAVIGATION TABS */}
      <nav className="nav-tabs">
        <NavLink to="/admin/overview" className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>
                <NavLink to="/admin/budget-allocation" className={({ isActive }) => isActive ? 'active' : ''}>Budget Allocation</NavLink>
                <NavLink to="/admin/record-expense" className={({ isActive }) => isActive ? 'active' : ''}>Record Expenses</NavLink>
                <NavLink to="/admin/validation" className={({ isActive }) => isActive ? 'active' : ''}>Validation Center</NavLink>
                <NavLink to="/admin/user-management" className={({ isActive }) => isActive ? 'active' : ''}>User Management</NavLink>
                <NavLink to="/admin/transaction-ledger" className={({ isActive }) => isActive ? 'active' : ''}>Transaction Ledger</NavLink>
                <NavLink to="/admin/documents" className={({ isActive }) => isActive ? 'active' : ''}>Documents</NavLink>
      </nav>

      {/* ACCOUNT SETTINGS MODAL */}
      <div id="accountSettingsModal" className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <div>
              <h3>Account Settings</h3>
              <p className="sub-text">Update your account information and contact details</p>
            </div>
            <button className="close-btn" data-modal-close="accountSettingsModal">&times;</button>
          </div>
          <form id="account-settings-form">
            <div className="modal-body">
              <label className="input-label">Full Name</label>
              <input type="text" id="setting-fullname" className="modal-input" />

              <label className="input-label">Username</label>
              <input type="text" id="setting-username" className="modal-input" />

              <label className="input-label">Email Address</label>
              <input type="email" id="setting-email" className="modal-input" />

              <label className="input-label">Position</label>
              <input type="text" id="setting-position" className="modal-input" />

              <label className="input-label" style={{ color: '#e74c3c', marginTop: '15px' }}>Confirm Password to Save Changes</label>
              <input type="password" id="setting-confirm-pass" className="modal-input" required placeholder="Enter your current password" />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" data-modal-close="accountSettingsModal">Cancel</button>
              <button type="submit" className="btn-save">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      <div id="changePasswordModal" className="modal-overlay">
        <div className="modal-container">
          <div className="modal-header">
            <div>
              <h3>Change Password</h3>
              <p className="sub-text">Ensure your password is strong and secure</p>
            </div>
            <button className="close-btn" data-modal-close="changePasswordModal">&times;</button>
          </div>
          <form id="change-password-form">
            <div className="modal-body">
              <label className="input-label">Current Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input type="password" id="current-password" className="modal-input" placeholder="Your current password" style={{ paddingRight: '40px' }} required />
                <svg id="toggle-current" className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6B7280' }}>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>

              <label className="input-label">New Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input type="password" id="new-password" className="modal-input" placeholder="Minimum 8 characters" style={{ paddingRight: '40px' }} required />
                <svg id="toggle-new" className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6B7280' }}>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
              <p className="field-hint">Must be at least 8 characters long</p>

              <label className="input-label">Confirm New Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input type="password" id="confirm-new-password" className="modal-input" placeholder="Repeat new password" style={{ paddingRight: '40px' }} required />
                <svg id="toggle-confirm" className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#6B7280' }}>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-cancel" data-modal-close="changePasswordModal">Cancel</button>
              <button type="submit" className="btn-save">Update Password</button>
            </div>
          </form>
        </div>
      </div>

      {/* ABOUT BRIGHT MODAL */}
      <div id="aboutBrightModal" className="modal">
        <div className="modal-content">
          <span className="close" data-modal-close="aboutBrightModal">&times;</span>
          <h2>About BRIGHT</h2>
          <p>
            BRIGHT (Budget Record Integrity using Generalized Hash-based Transparency) is a 
            web-based financial management system designed to promote transparency, accountability, 
            and data integrity in organizational budgeting. It addresses the long-standing problems 
            of manual and error-prone record-keeping by using cryptographic hashing to secure financial 
            documents and ensure that every transaction is verifiable and tamper-proof.
          </p>
        </div>
      </div>

      {/* TERMS MODAL */}
      <div id="termsModal" className="modal">
        <div className="modal-content">
          <span className="close" data-modal-close="termsModal">&times;</span>
          <h2>Terms & Conditions</h2>
          <ul style={{ marginLeft: '1rem', lineHeight: '1.6' }}>
            <li>By using BRIGHT, users agree to follow all system rules on financial recording, verification, and data handling.</li>
            <li>BRIGHT developers promote transparency and integrity, but they are not responsible for improper, unethical, or negligent system use.</li>
            <li>Administrators must approve only legitimate organization members. Approving unauthorized individuals violates system policy.</li>
            <li>Administrators are strictly prohibited from sharing their login credentials or granting system access to anyone outside the organization.</li>
            <li>Users must ensure that all uploaded documents and records are truthful, accurate, and compliant with organizational policies.</li>
            <li>Any attempt to manipulate data, bypass verification, or falsify records may result in account removal or reporting to the appropriate authority.</li>
          </ul>
        </div>
      </div>

      {/* PRIVACY MODAL */}
      <div id="privacyModal" className="modal">
        <div className="modal-content">
          <span className="close" data-modal-close="privacyModal">&times;</span>
          <h2>Privacy Policy</h2>
          <p>
            BRIGHT stores only essential information required for financial record integrity. All 
            data is protected using cryptographic hashing and is never disclosed to external entities.
          </p>
        </div>
      </div>

      {/* TEAM MODAL */}
      <div id="aboutModal" className="modal">
        <div className="modal-content">
          <span className="close" data-modal-close="aboutModal">&times;</span>
          <h2>Team</h2>
          <p>
            BRIGHT Development Team – BSCS 3A (2026)<br />
            <span><br /> Developer: <br /></span>
            Aira Camille Banusing<br />
            Jhon Nicholson Manalang<br />
            Ianna Erin Marquez<br />
            Cyrel Yvette Morales <br />
            <br />For support: <a href="mailto:bright.system.dev@gmail.com">bright.system.dev@gmail.com</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;