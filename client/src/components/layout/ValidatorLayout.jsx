import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import brightLogo from '../../assets/bright-logo-v3.png';
import Footer from '../../components/layout/Footer';

const ValidatorLayout = () => {
 const navigate = useNavigate();
 const dropdownRef = useRef(null);

 // --- STATE MANAGEMENT ---
 const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
 const [activeModal, setActiveModal] = useState(null);
 const [user, setUser] = useState({ name: 'User', role: 'Validator' });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
 const [showNewPass, setShowNewPass] = useState(false);
 const [showConfirmPass, setShowConfirmPass] = useState(false);

 // Added missing form states
 const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
 const [accountForm, setAccountForm] = useState({ name: '', username: '', email: '', position: '', confirmPassword: '' });

 // --- SIDE EFFECTS ---
 useEffect(() => {
   const savedUser = localStorage.getItem('user');
   if (savedUser) {
     try {
       const parsedUser = JSON.parse(savedUser);
       setUser(parsedUser);
       // Pre-fill account form
       setAccountForm(prev => ({
         ...prev,
         name: parsedUser.name || '',
         username: parsedUser.username || '',
         email: parsedUser.email || '',
       }));
     } catch (e) {
       console.error("Failed to parse user data");
     }
   }
 }, []); // Fixed: Closed useEffect correctly

 // --- HANDLERS ---
 const closeModal = () => {
   setActiveModal(null);
   setPasswordForm({ current: '', newPass: '', confirm: '' });
 };

 const handleLogout = () => {
   localStorage.removeItem('user');
   navigate('/auth/login');
 };

 const handleOpenAccountSettings = () => {
   setActiveModal('accountSettingsModal');
   setIsUserDropdownOpen(false);
 };

 const handleUpdateAccount = async () => {
   // Add your update logic here
   alert('Account update logic called!');
   closeModal();
 };

 const handleUpdatePassword = async (e) => {
   e.preventDefault();
   const { current, newPass, confirm } = passwordForm;

   if (newPass !== confirm) {
     alert('New passwords do not match.');
     return;
   }
   if (newPass.length < 6) {
     alert('Password must be at least 6 characters.');
     return;
   }

   try {
     // 🟢 PINALITAN NA NATIN NG LIVE RAILWAY URL
     //const res = await fetch('https://amusing-comfort-production.up.railway.app/api/users/account/password', {
     const res = await fetch('http://localhost:3000/api/users/account/password', {
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
         <NavLink to="/validator/overview" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
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

         {isUserDropdownOpen && (
           <div className="dropdown-menu show" id="userDropdown">
             <div className="dropdown-header" onClick={() => setIsUserDropdownOpen(false)}>My Account</div>
             <button className="dropdown-item" onClick={handleOpenAccountSettings}>Account Settings</button>
             <button className="dropdown-item" onClick={() => { setActiveModal('changePasswordModal'); setIsUserDropdownOpen(false); }}>Change Password</button>
             <div className="dropdown-divider"></div>
             <button className="dropdown-item logout-item" onClick={handleLogout}>Logout</button>
           </div>
         )}
       </div>
     </header>

     <div className="page-header">
       <h2>Validator Dashboard</h2>
       <p>Review budget allocations, verify expenses, and manage transaction validations</p>
     </div>

     <nav className="nav-tabs">
       <NavLink to="/validator/overview" className={({ isActive }) => isActive ? 'active' : ''}>Overview</NavLink>
       <NavLink to="/validator/validation" className={({ isActive }) => isActive ? 'active' : ''}>Validation Center</NavLink>
       <NavLink to="/validator/transaction-ledger" className={({ isActive }) => isActive ? 'active' : ''}>Transaction Ledger</NavLink>
       <NavLink to="/validator/documents" className={({ isActive }) => isActive ? 'active' : ''}>Documents</NavLink>
     </nav>

     <main className="admin-main-content">
       <Outlet />
     </main>

     <Footer />

     {/* --- ACCOUNT SETTINGS MODAL --- */}
     <div className={`modal-overlay ${activeModal === 'accountSettingsModal' ? 'active' : ''}`} onClick={closeModal}>
       <div className="modal-container" onClick={(e) => e.stopPropagation()}>
         <div className="modal-header">
           <h3>Account Settings</h3>
           <button className="close-btn" onClick={closeModal}>&times;</button>
         </div>
         <div className="modal-body">
            <div className="form-group">
               <label className="input-label">Full Name</label>
               <input type="text" className="modal-input" value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} />
            </div>
            {/* ... Other fields mapping to accountForm ... */}
         </div>
         <div className="modal-footer">
           <button className="btn-secondary" onClick={closeModal}>Close</button>
           <button className="btn-primary" onClick={handleUpdateAccount}>Save Changes</button>
         </div>
       </div>
     </div>

     {/* --- CHANGE PASSWORD MODAL --- */}
     <div className={`modal-overlay ${activeModal === 'changePasswordModal' ? 'active' : ''}`} onClick={closeModal}>
       <div className="modal-container" onClick={(e) => e.stopPropagation()}>
         <div className="modal-header">
           <h3>Change Password</h3>
           <button className="close-btn" onClick={closeModal}>&times;</button>
         </div>
         <form onSubmit={handleUpdatePassword}>
           <div className="modal-body">
             <label className="input-label">Current Password</label>
             <input type={showCurrentPass ? 'text' : 'password'} className="modal-input" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} required />
            
             <label className="input-label">New Password</label>
             <input type={showNewPass ? 'text' : 'password'} className="modal-input" value={passwordForm.newPass} onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })} required />
            
             <label className="input-label">Confirm New Password</label>
             <input type={showConfirmPass ? 'text' : 'password'} className="modal-input" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required />
           </div>
           <div className="modal-footer">
             <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
             <button type="submit" className="btn-save">Update Password</button>
           </div>
         </form>
       </div>
     </div>
   </div>
 );
};

export default ValidatorLayout;