import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import '../../index.css'; 
import brightLogo from '../../assets/bright darker logo.png';

const Welcome = () => {
    const navigate = useNavigate(); // Hook for navigation

    const resetDashboard = (e) => {
        e.preventDefault();
        console.log("Dashboard reset logic here");
    };

    return (
        <div className="welcome-bg"> 
            <div className="content-wrapper">
                <div className="welcome-logo">
                    <a href="#" onClick={resetDashboard}>
                        <img src={brightLogo} alt="BRIGHT Logo" />
                    </a>
                </div>

                <div className="welcome">
                    <h1>Welcome to BRIGHT!</h1>
                    <h3>Budget Record Integrity using Generalized Hash-based Transparency</h3>
                    <p>Secure • Transparent • Immutable</p>
                </div>

                <div className="welcome-button">
                    <button 
                        type="button" 
                        className="public-button"
                        onClick={() => navigate('/public/overview')}
                    >
                        View Public Dashboard
                    </button>
                </div>

                <div className="separator">
                    <span>or</span>
                </div>

                <div className="login-button">
                    <button 
                        className="muted" 
                        id="welcome-login-button"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate('/auth/login')}
                    >
                        Log in as staff
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Welcome;