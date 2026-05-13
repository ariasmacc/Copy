import React, { useState, useEffect } from 'react';

const BudgetAllocation = () => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState({ totalBudget: 0, pendingCount: 0, approvedToday: 0, totalAllocations: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FIXED: Added the full backend URL ---
  const API_BASE_URL = '/api';

  const loadAllocations = async () => {
    try {
      // FIX: Added credentials: 'include'
      const res = await fetch(`${API_BASE_URL}/budget/allocations`, {
        credentials: 'include'
      });
      const data = await res.json();
      setAllocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      // FIX: Added credentials: 'include'
      const res = await fetch(`${API_BASE_URL}/budget/summary`, {
        credentials: 'include'
      });
      const data = await res.json();
      setSummary({
        totalBudget: data.totalBudget || 0,
        pendingCount: data.pendingCount || 0,
        approvedToday: data.approvedToday || 0,
        totalAllocations: data.totalAllocations || 0,
      });
    } catch (err) {
      console.error('Error loading summary:', err);
    }
  };

  useEffect(() => {
    loadAllocations();
    loadSummary();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    
    // NOTE: Based on your userController, the ID might be stored as 'id'
    const activeUserId = storedUser?.id || storedUser?.user_id || 1;

    const data = {
      name: formData.get('budgetname'),
      category: formData.get('category'),
      amount: parseFloat(formData.get('amount')),
      priority: formData.get('priority'),
      description: formData.get('description'),
      businessJustification: formData.get('businessjustification'),
      submitted_by_user_id: activeUserId
    };

    console.log("Submitting to backend with User ID:", activeUserId); 

    try {
      // FIX: Added the correct URL and credentials: 'include'
      const res = await fetch(`${API_BASE_URL}/budget/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // <--- IMPORTANT
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit');
      }

      alert('Budget allocation submitted successfully!');
      e.target.reset();
      loadAllocations();
      loadSummary();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleViewDetails = async (id) => {
    setIsModalOpen(true);
    setSelectedBudget(null); 
    try {
      // FIX: Added credentials: 'include'
      const res = await fetch(`${API_BASE_URL}/budget/allocations/${id}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setSelectedBudget(data);
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  // ... (Rest of your JSX code remains the same)
  return (
    <main className="expense-page">
      <div className="expense-recording-page">
        <h2>Budget Allocation Management</h2>
        <p className="subtitle">Create and manage budget allocations for different categories</p>
      </div>

      {/* SUMMARY CARDS SA TAAS + MAY KULAY */}
      <section className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="over-card">
          <h3>Total Budget</h3>
          <p className="amount">₱<span>{summary.totalBudget.toLocaleString()}</span></p>
        </div>
        <div className="over-card">
          <h3>Pending Review</h3>
          <p className="amount" style={{ color: '#f39c12' }}><span>{summary.pendingCount}</span></p>
        </div>
        <div className="over-card">
          <h3>Approved Today</h3>
          <p className="amount green"><span>{summary.approvedToday}</span></p>
        </div>
        <div className="over-card">
          <h3>Total Allocations</h3>
          <p className="amount" style={{ color: '#3498db' }}><span>{summary.totalAllocations}</span></p>
        </div>
      </section>

      <div className="expense-recording-page">
        <section className="expense-recording card" style={{ marginBottom: '30px' }}>
          <div className="form-card">
            <h3>
              <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="none" viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: '5px' }}>
                <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Create New Budget Allocation
            </h3>
            <p className="form-sub">Submit a new budget allocation request for validation.</p>

            <form id="budget-allocation-form" onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="budgetname">Budget Name</label>
                  <input type="text" id="budgetname" name="budgetname" placeholder="Enter Budget Name" required />
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" defaultValue="" required>
                    <option value="" disabled>Select a category</option>
                    <option value="eventsandactivities">Events & Activities</option>
                    <option value="travelandconferences">Travel & Conferences</option>
                    <option value="suppliesandmaterials">Supplies & Materials</option>
                    <option value="marketingandoutreach">Marketing & Outreach</option>
                    <option value="equipmentandtechnology">Equipment & Technology</option>
                    <option value="emergencyfund">Emergency Fund</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="amount">Amount (₱)</label>
                  <input type="number" id="amount" name="amount" placeholder="Enter Amount" step="0.01" min="0" required />
                </div>
                <div className="form-group">
                  <label htmlFor="priority">Priority</label>
                  <select id="priority" name="priority" defaultValue="Normal" required>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="description">Description</label>
                  <textarea id="description" name="description" placeholder="Enter Description" required></textarea>
                </div>
                <div className="form-group full-width">
                  <label htmlFor="businessjustification">Business Justification</label>
                  <textarea id="businessjustification" name="businessjustification" placeholder="Enter Business Justification" required></textarea>
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ marginTop: '15px' }}>Create Budget Allocation</button>
            </form>
          </div>
        </section>
      </div>

      <section className="expense-records card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '5px' }}>Budget Allocations Record</h2>
        <p className="subtitle" style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '15px' }}>All budget allocations and their validation status</p>
        
        <div className="table-container">
          <div className="tablescroll">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px' }}>ID</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Category</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Submitted By</th>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Date</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Priority</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Validations</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>Loading allocations...</td></tr>
                ) : allocations.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>No allocations found.</td></tr>
                ) : (
                  allocations.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>{b.id}</td>
                      <td style={{ padding: '12px' }}><strong>{b.name}</strong></td>
                      <td style={{ padding: '12px' }}>{b.category}</td>
                      <td style={{ padding: '12px' }}>₱{parseFloat(b.amount).toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>{b.created_by || '—'}</td>
                      <td style={{ padding: '12px' }}>{new Date(b.date).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span className={`priority ${b.priority?.toLowerCase()}`}>{b.priority || 'Normal'}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{b.validations} / 2</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}><span className={`status ${b.status?.toLowerCase()}`}>{b.status}</span></td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button className="view-btn" onClick={() => handleViewDetails(b.id)}>View</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      {isModalOpen && (
        <div className="popup" style={{ display: 'block' }}>
          <div className="popup-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>&times;</span>
            {!selectedBudget ? (
              <h2>Loading Details...</h2>
            ) : (
              <>
                <h2>Budget Allocation Details: {selectedBudget.id}</h2>
                <div className="detail-section">
                  <h4>Basic Information</h4>
                  <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="detail-item"><label>Name</label><p>{selectedBudget.name}</p></div>
                    <div className="detail-item"><label>Status</label><p>{selectedBudget.status}</p></div>
                    <div className="detail-item"><label>Category</label><p>{selectedBudget.category_name}</p></div>
                    <div className="detail-item"><label>Amount</label><p>₱{selectedBudget.amount?.toLocaleString()}</p></div>
                    <div className="detail-item"><label>Priority</label><p>{selectedBudget.priority}</p></div>
                    <div className="detail-item"><label>Submitted By</label><p>{selectedBudget.submitted_by}</p></div>
                  </div>
                  <div className="detail-item" style={{ marginTop: '10px' }}><label>Description</label><p>{selectedBudget.description}</p></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default BudgetAllocation;