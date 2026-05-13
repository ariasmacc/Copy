import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import brightLogo from '../../assets/bright-logo-v3.png';
import Footer from '../../components/layout/Footer';

const AdminLayout = () => {
  const navigate = useNavigate();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState({ name: 'User', role: 'Staff' });

  const dropdownRef = useRef(null);

  // Password visibility toggles
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Controlled inputs for Change Password form
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirm: '',
  });

  // Controlled inputs for Account Settings form
  const [accountForm, setAccountForm] = useState({
    username: '',
    name: '',
    email: '',
    position: '',
    confirmPassword: '',
  });

  // ── Load user from localStorage on mount ──────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
      } catch (e) {
        console.error('Failed to parse user data');
      }
    } else {
      navigate('/auth/login');
    }
  }, []);

  // ── Close dropdown on outside click ───────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Pre-fill Account Settings form when modal opens ───────────────
  const handleOpenAccountSettings = () => {
    setAccountForm({
      username: user.username || '',
      name: user.name || '',
      email: user.email || '',
      position: user.position || '',
      confirmPassword: '',
    });
    setActiveModal('accountSettingsModal');
    setIsUserDropdownOpen(false);
  };

  const closeModal = () => {
    setActiveModal(null);
    setPasswordForm({ current: '', newPass: '', confirm: '' });
  };

  // ── Logout ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('user');
    // Clear token cookie
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setIsUserDropdownOpen(false);
    navigate('/auth/login');
  };

  // ── Account Settings Submit ────────────────────────────────────────
  const handleUpdateAccount = async () => {
    const data = {
      username: accountForm.username,
      full_name: accountForm.name,
      email: accountForm.email,
      position: accountForm.position,
      confirm_password: accountForm.confirmPassword,
    };

    try {
      const res = await fetch('/api/users/account/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Update failed');

      alert('Account updated successfully!');

      // Update localStorage and state
      const updatedUser = {
        ...user,
        name: data.full_name,
        username: data.username,
        email: data.email,
        position: data.position,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      closeModal();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // ── Change Password Submit ─────────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const { current, newPass, confirm } = passwordForm;

    if (newPass !== confirm) {
      alert('New passwords do not match.');
      return;
    }
    if (newPass.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }

    try {
      const res = await fetch('/api/users/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: current,
          new_password: newPass,
        }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Update failed');

      alert('Password changed successfully!');
      closeModal();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {/* --- HEADER --- */}
      <header className="header">
        <div className="logo" id="header-logo">
          <NavLink to="/admin/overview" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
            <img src={brightLogo} alt="BRIGHT" />
            <h1 style={{ margin: 0, fontSize: '1.5em', color: 'white' }}>BRIGHT</h1>
          </NavLink>
          <div className="staff-portal">Staff Portal</div>
        </div>

        <div className="user-section" ref={dropdownRef}>
          <div className="role">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shield-icon" style={{ width: '18px', marginRight: '5px' }}>
              <path d="M12 2l7 4v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V6l7-4z" />
            </svg>
            <span id="layout-user-role">{user.role}</span>
          </div>

          <div className="user-profile-trigger" onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} style={{ cursor: 'pointer' }}>
            <div className="username">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="profile-icon" style={{ width: '20px' }}>
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <span id="layout-user-name">{user.name}</span>
          </div>

          {/* User Dropdown */}
          {isUserDropdownOpen && (
            <div className="dropdown-menu show" id="userDropdown">
              <div className="dropdown-header" onClick={() => setIsUserDropdownOpen(false)} style={{ cursor: 'pointer' }}>
                My Account
              </div>
              <button className="dropdown-item" onClick={handleOpenAccountSettings}>
                Account Settings
              </button>
              <button className="dropdown-item" onClick={() => { setActiveModal('changePasswordModal'); setIsUserDropdownOpen(false); }}>
                Change Password
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item logout-item" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* --- DASHBOARD HEADER --- */}
      <div className="page-header">
        <h2>Staff Dashboard</h2>
        <p>Manage budget allocations, record expenses, and validate transactions</p>
      </div>

      {/* --- NAV TABS --- */}
      <nav className="nav-tabs">
        <NavLink to="/admin/overview" className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>

        {user.role === 'Admin' && (
          <>
            <NavLink to="/admin/budget-allocation" className={({ isActive }) => isActive ? 'active' : ''}>Budget Allocation</NavLink>
            <NavLink to="/admin/record-expense" className={({ isActive }) => isActive ? 'active' : ''}>Record Expenses</NavLink>
          </>
        )}

        <NavLink to="/admin/validation" className={({ isActive }) => isActive ? 'active' : ''}>Validation Center</NavLink>

        {user.role === 'Admin' && (
          <NavLink to="/admin/user-management" className={({ isActive }) => isActive ? 'active' : ''}>User Management</NavLink>
        )}

        <NavLink to="/admin/transaction-ledger" className={({ isActive }) => isActive ? 'active' : ''}>Transaction Ledger</NavLink>
        <NavLink to="/admin/documents" className={({ isActive }) => isActive ? 'active' : ''}>Documents</NavLink>
      </nav>

      {/* --- PAGE CONTENT --- */}
      <main className="admin-main-content">
        <Outlet />
      </main>

      <Footer />

      {/* ── ACCOUNT SETTINGS MODAL ──────────────────────────────────── */}
      <div
        className={`modal-overlay ${activeModal === 'accountSettingsModal' ? 'active' : ''}`}
        onClick={closeModal}
      >
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3>Account Settings</h3>
              <p className="sub-text">Update your profile information</p>
            </div>
            <button className="close-btn" onClick={closeModal}>&times;</button>
          </div>

          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0px', paddingBottom: '0' }}>
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                className="modal-input"
                value={accountForm.name}
                onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ marginTop: '1px' }}>
              <label className="input-label">Username</label>
              <input
                type="text"
                className="modal-input"
                value={accountForm.username}
                onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                placeholder="Enter username"
              />
              <p className="field-hint">This is used for logging into the BRIGHT system</p>
            </div>

            <div className="form-group" style={{ marginTop: '1px' }}>
              <label className="input-label">Role</label>
              <input
                type="text"
                className="modal-input read-only"
                value={user.role}
                readOnly
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <p className="field-hint">Your assigned administrative role cannot be changed here</p>
            </div>

            <div className="form-group" style={{ marginTop: '1px' }}>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="modal-input"
                value={accountForm.email}
                onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                placeholder="Enter email"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1px' }}>
              <label className="input-label">Position</label>
              <input
                type="text"
                className="modal-input"
                value={accountForm.position}
                onChange={(e) => setAccountForm({ ...accountForm, position: e.target.value })}
                placeholder="Enter position"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1px' }}>
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="modal-input"
                value={accountForm.confirmPassword}
                onChange={(e) => setAccountForm({ ...accountForm, confirmPassword: e.target.value })}
                placeholder="Enter current password to confirm"
              />
              <p className="field-hint">Required to save changes</p>
            </div>

          </div>
          <div className="modal-footer">
            <button className="btn-secondary" onClick={closeModal} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>
              Close
            </button>
            <button className="btn-primary" onClick={handleUpdateAccount} style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* ── CHANGE PASSWORD MODAL ────────────────────────────────────── */}
      <div
        className={`modal-overlay ${activeModal === 'changePasswordModal' ? 'active' : ''}`}
        onClick={closeModal}
      >
        <div className="modal-container" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h3>Change Password</h3>
              <p className="sub-text">Ensure your password is strong and secure</p>
            </div>
            <button className="close-btn" onClick={closeModal}>&times;</button>
          </div>

          <form id="change-password-form" onSubmit={handleUpdatePassword}>
            <div className="modal-body">

              {/* Current Password */}
              <label className="input-label">Current Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  className="modal-input"
                  placeholder="Your current password"
                  style={{ paddingRight: '40px' }}
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  required
                />
                <svg onClick={() => setShowCurrentPass(!showCurrentPass)} width="18" height="18" viewBox="0 0 24 24" fill="none"
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: showCurrentPass ? '#0f172a' : '#6B7280' }}>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>

              {/* New Password */}
              <label className="input-label" style={{ marginTop: '15px', display: 'block' }}>New Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  className="modal-input"
                  placeholder="Minimum 6 characters"
                  style={{ paddingRight: '40px' }}
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  required
                />
                <svg onClick={() => setShowNewPass(!showNewPass)} width="18" height="18" viewBox="0 0 24 24" fill="none"
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: showNewPass ? '#0f172a' : '#6B7280' }}>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
              <p className="field-hint">Must be at least 8 characters long</p>

              {/* Confirm New Password */}
              <label className="input-label" style={{ marginTop: '15px', display: 'block' }}>Confirm New Password</label>
              <div className="password-wrapper" style={{ position: 'relative' }}>
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  className="modal-input"
                  placeholder="Repeat new password"
                  style={{ paddingRight: '40px' }}
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  required
                />
                <svg onClick={() => setShowConfirmPass(!showConfirmPass)} width="18" height="18" viewBox="0 0 24 24" fill="none"
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: showConfirmPass ? '#0f172a' : '#6B7280' }}>
                  <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-cancel" onClick={closeModal} style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-save" style={{ background: '#0f172a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;