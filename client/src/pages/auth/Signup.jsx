import React, { useState } from 'react';
import '../../index.css';
import { Link, useNavigate } from 'react-router-dom'; 

const Signup = () => {
  const navigate = useNavigate(); // Added to route the user correctly after signup
  
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Send the actual request to the backend
      const response = await fetch('http://localhost:3000/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullname, // Mapped correctly for the backend
          username: username,
          email: email,
          position: position,
          role: role,
          password: password
        })
      });

      const data = await response.json();

      // 2. Check if backend said OK
      if (response.ok) {
        alert('Registration successful! Please wait for account approval.');
        navigate('/login'); 
      } else {
        // Show any validation errors from the backend
        setErrorMessage(data.error || data.msg || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setErrorMessage('Cannot connect to the server. Is it running?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-body" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="signup-container">
        <div className="signup-info-panel">
          <div className="signup-logo">
            <a href="/" style={{ display: 'block', lineHeight: 0 }}>   
              <img src="/src/assets/bright-logo-v3.png" alt="BRIGHT Logo" style={{ height: '80px', width: 'auto', display: 'block' }} /> 
            </a> 
            <h1 style={{ marginTop: 0, marginBottom: 0, lineHeight: 1, fontSize: '1.5em', color: 'white' }}>BRIGHT</h1>
          </div>
          <div className="login-info">
            <h2>Staff Access Portal</h2>
            <p className="signup-subtitle">Register to manage and validate budget allocations with transparency.</p>
          </div>
        </div>

        <div className="signup-form-panel">
          <h2>Create an Account</h2>
          <p>Fill out the fields below to register your staff account.</p>

          <form onSubmit={handleSignupSubmit}>
            <label>Full Name</label>
            <input type="text" placeholder="Juan Dela Cruz" required value={fullname} onChange={(e) => setFullname(e.target.value)} />

            <label>Username</label>
            <input type="text" placeholder="juandelacruz" required value={username} onChange={(e) => setUsername(e.target.value)} />

            <label>Email Address</label>
            <input type="email" placeholder="juan.delacruz@organization.edu.ph" required value={email} onChange={(e) => setEmail(e.target.value)} />

            <label>Position</label>
            <input type="text" placeholder="Auditor" required value={position} onChange={(e) => setPosition(e.target.value)} />

            <label>Role</label>
            <select required value={role} onChange={(e) => setRole(e.target.value)} style={{ padding: '10px 12px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '6px', width: '100%' }}>
              <option value="">-- Select a Role --</option>
              <option value="Admin">Admin</option>
              <option value="Validator">Validator</option>
            </select>

            <label>Password</label>
            <div className="signup-password-wrapper">
              <input type={showPassword ? "text" : "password"} placeholder="Must be at least 8 characters, can be any combination of letters, numbers, and special characters" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <svg onClick={() => setShowPassword(!showPassword)} width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer', opacity: showPassword ? 1 : 0.6 }}>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#6B7280" strokeWidth="1.2"/>
              </svg>
            </div>

            <label>Confirm Password</label>
            <div className="signup-password-wrapper">
              <input type={showConfirmPassword ? "text" : "password"} placeholder="Re-enter password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <svg onClick={() => setShowConfirmPassword(!showConfirmPassword)} width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ cursor: 'pointer', opacity: showConfirmPassword ? 1 : 0.6 }}>
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="#6B7280" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="#6B7280" strokeWidth="1.2"/>
              </svg>
            </div>

            {errorMessage && <div className="alert error" style={{marginTop: '15px', color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid #f87171'}}>{errorMessage}</div>}

            <button type="submit" className="signup-btn" style={{ marginTop: '15px' }} disabled={isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>

            <p className="signup-footer" style={{ textAlign: 'center', marginTop: '15px' }}>
              Already have an account? <Link to="/auth/login">Sign in here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;