import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const ResetPassword = () => {
    // State management for inputs and UI
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isTokenValid, setIsTokenValid] = useState(true);

    // React Router hook to get the token from URL
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    // Equivalent to DOMContentLoaded token check
    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
            setIsTokenValid(false);
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Client-side validation
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to reset password.');
            }

            // Success state
            setSuccess('Password has been reset successfully! You can now log in.');
        } catch (err) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="signup-body">
            <div className="signup-form-panel" style={{ width: '90%', maxWidth: '800px', margin: 'auto' }}>
                <h2>Set New Password</h2>
                <p>Enter and confirm your new password below.</p>

                {/* Show messages based on state */}
                {error && (
                    <div id="error-message" className="alert error" style={{ display: 'block' }}>
                        {error}
                    </div>
                )}
                
                {success && (
                    <div id="success-message" className="alert success" style={{ display: 'block' }}>
                        {success}
                    </div>
                )}

                {/* Hide form on success, similar to your original script */}
                {!success && (
                    <form id="reset-password-form" onSubmit={handleSubmit}>
                        <label htmlFor="new-password">New Password</label>
                        <input 
                            type="password" 
                            id="new-password" 
                            required 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        
                        <label htmlFor="confirm-password">Confirm New Password</label>
                        <input 
                            type="password" 
                            id="confirm-password" 
                            required 
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <button 
                            type="submit" 
                            className="signup-btn-primary" 
                            disabled={isSubmitting || !isTokenValid}
                        >
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;