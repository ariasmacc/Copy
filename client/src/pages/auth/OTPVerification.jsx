import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OTPVerification = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [message, setMessage] = useState({ text: 'Verification code sent to email.', type: 'info' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();

    const API_BASE_URL = '/api';

    // Extract userId from URL on mount
    const query = new URLSearchParams(location.search);
    const userId = query.get('userId');

    useEffect(() => {
        if (!userId) {
            alert("Error: User ID missing. Please log in again.");
            navigate('/auth/login');
        }
        // Focus first input on mount
        if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, [userId, navigate]);

    // Handle digit input
    const handleChange = (e, index) => {
        const value = e.target.value;
        if (!/^\d*$/.test(value)) return; 

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').trim();
        if (!/^\d{6}$/.test(data)) return;

        const digits = data.split('');
        setOtp(digits);
        inputRefs.current[5].focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length < 6) {
            setMessage({ text: 'Please enter the complete 6-digit code.', type: 'error' });
            return;
        }

        setIsSubmitting(true);
        setMessage({ text: '', type: 'info' });

        try {
            // 🟢 INAYOS YUNG BACKTICKS (`) PARA HINDI MAG-SYNTAX ERROR
            const response = await fetch(`${API_BASE_URL}/users/verify-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', 
                body: JSON.stringify({ userId, twoFACode: otpCode }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || 'Verification failed.');

            // Success logic
            sessionStorage.removeItem('tempUsername');
            sessionStorage.removeItem('tempPassword');
            sessionStorage.removeItem('tempRole');
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Route based on role
            if (data.user.role === 'Admin') {
                navigate('/admin/overview');
            } else {
                navigate('/validator/overview');
            }

        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
            setOtp(['', '', '', '', '', '']);
            if (inputRefs.current[0]) inputRefs.current[0].focus();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async (e) => {
        e.preventDefault();
        setIsResending(true);
        setMessage({ text: '', type: 'info' });

        const username = sessionStorage.getItem('tempUsername');
        const password = sessionStorage.getItem('tempPassword');
        const role = sessionStorage.getItem('tempRole');

        if (!username || !password) {
            setMessage({ text: 'Session expired. Please log in again.', type: 'error' });
            setIsResending(false);
            return;
        }

        try {
            // 🟢 INAYOS YUNG BACKTICKS (`) DITO RIN
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password, role }),
            });

            const data = await response.json();
            if (!response.ok || !data.requires2FA) throw new Error(data.error || 'Resend failed.');

            setMessage({ text: 'New verification code sent! Check your email.', type: 'success' });
        } catch (error) {
            setMessage({ text: error.message, type: 'error' });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="otp-body">
            <style>{`
                .otp-body {
                    height: 100vh;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, #dce9f8 0%, #eff6ff 100%);
                    width: 100vw;
                    position: fixed;
                    top: 0;
                    left: 0;
                    z-index: 9999;
                }
                .signup-page-container {
                    display: flex;
                    width: 900px;
                    max-width: 95%;
                    min-height: 550px;
                    background-color: #fff;
                    border-radius: 12px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                }
                .signup-info-panel {
                    flex: 1;
                    background-color: #34495E;
                    color: white;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    text-align: center;
                }
                .signup-logo img { height: 80px; margin-bottom: 15px; }
                .signup-info-panel h1 { font-size: 1.8rem; margin-bottom: 5px; font-weight: 700; }
                .signup-info-panel h2 { font-size: 1.4rem; margin-bottom: 15px; font-weight: 600; }
                .signup-subtitle { font-size: 0.95rem; opacity: 0.9; line-height: 1.5; }
                .signup-form-panel {
                    flex: 1.3;
                    background-color: white;
                    padding: 50px 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                .signup-form-panel h3 { font-size: 1.6rem; color: #1f2937; text-align: center; margin-bottom: 10px; }
                .card-desc { text-align: center; color: #6b7280; font-size: 0.95rem; margin-bottom: 30px; }
                .otp-input-group { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 25px; }
                .otp-input-group input {
                    width: 100%;
                    height: 55px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: 600;
                    background-color: #f9fafb;
                }
                .otp-btn-primary {
                    background-color: #34495e;
                    color: white;
                    border: none;
                    padding: 14px;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 100%;
                }
                .otp-btn-outline {
                    background-color: white;
                    color: #374151;
                    border: 1px solid #d1d5db;
                    padding: 14px;
                    font-size: 1rem;
                    font-weight: 600;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 100%;
                    text-align: center;
                    text-decoration: none;
                    margin-top: 10px;
                }
                .resend-link { text-align: center; font-size: 0.9rem; color: #6b7280; margin-bottom: 20px; }
                .resend-button { background: none; border: none; color: #34495e; font-weight: 600; cursor: pointer; text-decoration: underline; }
                @media (max-width: 768px) {
                    .signup-page-container { flex-direction: column; }
                }
            `}</style>
            <div className="signup-page-container">
                <div className="signup-info-panel">
                    <div className="signup-logo">
                        <img src="/src/assets/bright-logo-v3.png" alt="BRIGHT Logo" />
                        <h1>BRIGHT</h1>
                    </div>
                    <div className="login-info">
                        <h2>Staff Access Portal</h2>
                        <p className="signup-subtitle">Budget Record Integrity using Generalized Hash-based Transparency</p>
                    </div>
                </div>

                <div className="signup-form-panel">
                    <h3>Verify with OTP</h3>
                    <p className="card-desc">To ensure your security, please enter the One-Time Password (OTP) sent to your registered email.</p>

                    <form onSubmit={handleSubmit}>
                        {message.text && (
                            <div style={{ textAlign: 'center', color: message.type === 'error' ? '#e74c3c' : '#27ae60', fontWeight: 'bold', marginBottom: '20px' }}>
                                {message.text}
                            </div>
                        )}

                        <div className="otp-input-group" onPaste={handlePaste}>
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    inputMode="numeric"
                                    pattern="[0-9]"
                                    value={digit}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    onChange={(e) => handleChange(e, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    required
                                />
                            ))}
                        </div>

                        <div className="resend-link">
                            Didn't receive the OTP?{' '}
                            <button type="button" onClick={handleResend} disabled={isResending} className="resend-button">
                                {isResending ? 'Resending...' : 'Resend'}
                            </button>
                        </div>

                        <div className="btn-container">
                            <button type="submit" className="otp-btn-primary" disabled={isSubmitting}>
                                {isSubmitting ? 'Verifying...' : 'Submit'}
                            </button>
                            <button type="button" className="otp-btn-outline" onClick={() => navigate('/auth/login')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;