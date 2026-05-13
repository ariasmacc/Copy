import React, { useState, useEffect } from 'react';

const UserMngmnt = () => {
    const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const BACKEND_URL = 'http://localhost:3000';
    const API_BASE_URL = '/api/users';

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
        document.head.appendChild(link);

        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([loadSummaryData(), loadUserRequests()]);
        setIsLoading(false);
    };

    const loadSummaryData = async () => {
        try {
            // FIX: Added BACKEND_URL and credentials
            const response = await fetch(`${BACKEND_URL}${API_BASE_URL}/summary`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch summary');
            const data = await response.json();
            setSummary({
                pending: data.pending || 0,
                approved: data.approved || 0,
                rejected: data.rejected || 0
            });
        } catch (error) {
            console.error('Error loading summary data:', error);
        }
    };

    const loadUserRequests = async () => {
        try {
            // FIX: Added BACKEND_URL and credentials
            const response = await fetch(`${BACKEND_URL}${API_BASE_URL}/requests`, {
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch requests');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error loading user requests:', error);
        }
    };

    const handleStatusUpdate = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${newStatus} this user?`)) return;

        try {
            // FIX: Added BACKEND_URL and credentials
            const response = await fetch(`${BACKEND_URL}${API_BASE_URL}/status/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // <-- THIS IS CRITICAL
                body: JSON.stringify({ newStatus })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Update failed');
            }

            alert(`User has been ${newStatus}.`);
            fetchData();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };
    
    // Helper: Formatting
    const formatDate = (d) => new Date(d).toLocaleDateString('en-US');
    const formatTime = (d) => new Date(d).toLocaleTimeString('en-US', { 
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
    });

    const getStatusPill = (status) => {
        const sl = status.toLowerCase();
        let icon = sl === 'pending' ? 'fa-clock' : (sl === 'approved' ? 'fa-circle-check' : 'fa-circle-xmark');
        return (
            <span className={`status-pill status-${sl}`}>
                <i className={`fa-regular ${icon}`}></i> {status}
            </span>
        );
    };

    return (
        <main className="expense-page">
            <div className="expense-recording-page">
                <h2>User Management</h2>
                <p className="subtitle">Review and manage portal access permissions</p>
            </div>

            {/* SUMMARY CARDS SA TAAS + MAY KULAY */}
            <section className="summary-cards" style={{ marginBottom: '30px' }}>
                <div className="over-card">
                    <h3>Pending Requests</h3>
                    <p className="amount" style={{ color: '#f39c12' }}><span>{summary.pending}</span></p>
                </div>
                <div className="over-card">
                    <h3>Approved Users</h3>
                    <p className="amount green"><span>{summary.approved}</span></p>
                </div>
                <div className="over-card">
                    <h3>Rejected Requests</h3>
                    <p className="amount highlight"><span>{summary.rejected}</span></p>
                </div>
            </section>

            <section className="expense-records card" style={{ padding: '20px', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '5px' }}>User Access Requests</h2>
                <p className="subtitle" style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '15px' }}>Approve or reject pending signups</p>
                
                <div className="table-container">
                    <div className="tablescroll">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>User Info</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Requested Role</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Email</th>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Request Date</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="user-requests-tbody">
                                {isLoading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No user requests found.</td></tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.user_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div className="user-name"><strong>{user.full_name}</strong></div>
                                                <div className="user-position"><small>{user.position || ''}</small></div>
                                            </td>
                                            <td style={{ padding: '12px' }}><span className="role-pill">{user.role}</span></td>
                                            <td style={{ padding: '12px' }}>
                                                <div><i className="fa-regular fa-envelope"></i> {user.email}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div>{formatDate(user.requested_date)}</div>
                                                <div className="date-cell-time" style={{ color: '#7f8c8d', fontSize: '12px' }}>{formatTime(user.requested_date)}</div>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{getStatusPill(user.status)}</td>
                                            <td className="actions-cell" style={{ padding: '12px', textAlign: 'center' }}>
                                                {user.status.toLowerCase() === 'pending' ? (
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button 
                                                            className="btn-action btn-approve" 
                                                            style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => handleStatusUpdate(user.user_id, 'approved')}
                                                        >
                                                            <i className="fa-solid fa-user-plus"></i> Approve
                                                        </button>
                                                        <button 
                                                            className="btn-action btn-reject" 
                                                            style={{ backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                                            onClick={() => handleStatusUpdate(user.user_id, 'rejected')}
                                                        >
                                                            <i className="fa-solid fa-user-xmark"></i> Reject
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: '#bdc3c7' }}>- Action Taken -</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default UserMngmnt;