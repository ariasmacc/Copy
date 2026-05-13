import React, { useState } from 'react';

const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalName) => setActiveModal(modalName);
  const closeModal = () => setActiveModal(null);

  // STYLE PARA SA BUTTONS LANG - PARA MAGMUKHANG LINKS AT BUMAGAY ANG FONT
  const linkStyle = {
    background: 'transparent',
    border: 'none',
    color: '#bdc3c7', 
    cursor: 'pointer',
    fontFamily: 'inherit', 
    fontSize: '14px',
    padding: '0 10px',
    transition: 'color 0.2s ease'
  };

  return (
    <footer className="footer">
      <div className="footer-links">
        {/* HINDI KO NA NI-TOUCH YUNG LOGO PARA HINDI MASIRA */}
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo(0, 0); }} className="footer-logo">
          <img src="/src/assets/bright-logo-v3.png" alt="BRIGHT" />
          <span>BRIGHT</span>
        </a>

        {/* Navigation Buttons - Eto lang yung binago natin ang style */}
        <button 
          onClick={() => openModal('aboutBright')} 
          style={linkStyle} 
          onMouseOver={(e) => e.target.style.color = 'white'} 
          onMouseOut={(e) => e.target.style.color = '#bdc3c7'}
        >
          About
        </button>
        <button 
          onClick={() => openModal('terms')} 
          style={linkStyle} 
          onMouseOver={(e) => e.target.style.color = 'white'} 
          onMouseOut={(e) => e.target.style.color = '#bdc3c7'}
        >
          Terms & Conditions
        </button>
        <button 
          onClick={() => openModal('privacy')} 
          style={linkStyle} 
          onMouseOver={(e) => e.target.style.color = 'white'} 
          onMouseOut={(e) => e.target.style.color = '#bdc3c7'}
        >
          Privacy Policy
        </button>
        <button 
          onClick={() => openModal('team')} 
          style={linkStyle} 
          onMouseOver={(e) => e.target.style.color = 'white'} 
          onMouseOut={(e) => e.target.style.color = '#bdc3c7'}
        >
          Team
        </button>
      </div>

      <hr className="footer-line" />
      <div className="footer-bottom">
        © 2026 BRIGHT System. All rights reserved.
      </div>

      {/* --- MODALS SECTION --- */}
      {activeModal && (
        <div className="modal" style={{ display: 'block', position: 'fixed', zIndex: 1000, left: 0, top: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-content" style={{ backgroundColor: '#fff', margin: '10% auto', padding: '30px', width: '50%', borderRadius: '8px', position: 'relative', color: '#2c3e50' }}>
            <span className="close" onClick={closeModal} style={{ position: 'absolute', right: '20px', top: '10px', fontSize: '28px', cursor: 'pointer' }}>&times;</span>

            {activeModal === 'aboutBright' && (
              <>
                <h2 style={{ marginBottom: '15px' }}>About BRIGHT</h2>
                <p style={{ lineHeight: '1.6' }}>
                  BRIGHT (Budget Record Integrity using Generalized Hash-based Transparency) is a 
                  web-based financial management system designed to promote transparency, accountability, 
                  and data integrity in organizational budgeting. It addresses the long-standing problems 
                  of manual and error-prone record-keeping by using cryptographic hashing to secure financial 
                  documents and ensure that every transaction is verifiable and tamper-proof.
                </p>             
              </>
            )}

            {activeModal === 'terms' && (
              <>
                <h2 style={{ marginBottom: '15px' }}>Terms & Conditions</h2>
                <ul style={{ marginLeft: '1rem', lineHeight: '1.6' }}>
                  <li style={{ marginBottom: '8px' }}>By using BRIGHT, users agree to follow all system rules on financial recording, verification, and data handling.</li>
                  <li style={{ marginBottom: '8px' }}>BRIGHT developers promote transparency and integrity, but they are not responsible for improper, unethical, or negligent system use.</li>
                  <li style={{ marginBottom: '8px' }}>Administrators must approve only legitimate organization members.</li>
                  <li style={{ marginBottom: '8px' }}>Administrators are strictly prohibited from sharing their login credentials.</li>
                  <li style={{ marginBottom: '8px' }}>Users must ensure that all uploaded documents and records are truthful and accurate.</li>
                  <li style={{ marginBottom: '8px' }}>Any attempt to manipulate data or falsify records may result in account removal.</li>
                </ul>
              </>
            )}

            {activeModal === 'privacy' && (
              <>
                <h2 style={{ marginBottom: '15px' }}>Privacy Policy</h2>
                <p style={{ lineHeight: '1.6' }}>
                  BRIGHT stores only essential information required for financial record integrity. All 
                  data is protected using cryptographic hashing and is never disclosed to external entities.
                </p>              
              </>
            )}

            {activeModal === 'team' && (
              <>
                <h2 style={{ marginBottom: '15px' }}>Team</h2>
                <p>
                  BRIGHT Development Team – BSCS 3A (2026)<br />
                  <span><br /> Lead Developers: <br /></span>
                  Ianna Erin Marquez <br />
                  Cyrel Yvette Morales <br />
                  <span><br /> Developers: <br /></span>
                  Aira Camille Banusing<br />
                  Jhon Nicholson Manalang<br />
                  <span><br />Founders: <br /></span>
                  Erik James Medallada<br />
                  Jackielyn Lariestan <br />
                  Carla Mae Cardano <br />
                  Ianna Erin Marquez <br />
                  Cyrel Yvette Morales <br />
                  <br />For support: <a href="mailto:bright.system.dev@gmail.com">bright.system.dev@gmail.com</a>
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;