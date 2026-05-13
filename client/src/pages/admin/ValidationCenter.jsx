import React, { useState, useEffect } from 'react';
import '../../index.css';

const ValidationCenter = () => {
  const API_BASE_URL = '/api'; // Inayos para sa fetch calls

  // ==========================================
  // 1. REACT STATE
  // ==========================================
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState({
    pendingCount: 0,
    highPriorityCount: 0,
    validatedThisMonth: 0,
    readyForApproval: 0
  });
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Popup States
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [comments, setComments] = useState('');

  // ==========================================
  // 2. useEffect
  // ==========================================
  useEffect(() => {
    loadQueue();
    loadSummary();
  }, []);

  // ==========================================
  // 3. FUNCTIONS / API CALLS
  // ==========================================
  const loadQueue = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/validation/queue`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setQueue(data);
    } catch (err) {
      console.error('Error loading validation queue:', err);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/validation/summary`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Error loading validation summary:', err);
    }
  };

  const openValidationPopup = (item) => {
    setSelectedItem(item);
    setIsPopupOpen(true);
  };

  const closeValidationPopup = () => {
    setIsPopupOpen(false);
    setComments('');
    setSelectedItem(null);
  };

  const submitDecision = async (decision) => {
    // 1. Check if comments are provided
    if (!comments.trim()) {
      alert('Please provide validation comments.');
      return;
    }

    // 2. Safety check to ensure an item is selected
    if (!selectedItem) {
      alert('Error: No item selected for validation.');
      return;
    }

    // 3. Prepare the exact payload your backend expects
    const payload = {
      itemId: selectedItem.id,
      itemType: selectedItem.type,
      decision: decision,
      comments: comments
    };

    try {
      // 4. Send the POST request to the correct endpoint
      const res = await fetch(`${API_BASE_URL}/validation/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Your VIP pass for auth.js
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      // 5. Check for backend errors (like the "Already validated" check)
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit validation decision.');
      }

      // 6. Success handling
      alert(`Item ${decision.toLowerCase()} successfully!`);
      closeValidationPopup();
      loadQueue(); // Refresh the table list
      loadSummary(); // Refresh the top cards
      
    } catch (err) {
      console.error("Validation submission error:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // ==========================================
  // 4. DYNAMIC FILTERING & COUNTS
  // ==========================================
  const filteredQueue = queue.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'High') return item.priority === 'High';
    return item.type === activeFilter;
  });

  const allCount = queue.length;
  const allocationCount = queue.filter(i => i.type === 'Allocation').length;
  const expenseCount = queue.filter(i => i.type === 'Expense').length;
  const highPrioCount = queue.filter(i => i.priority === 'High').length;

  // ==========================================
  // 5. JSX / HTML
  // ==========================================
  return (
    <main className="expense-page">
      <div className="expense-recording-page">
        <h2>Validation Center</h2>
        <p className="subtitle">Review and validate budget allocations and expenses</p>
      </div>

      <section className="summary-cards" style={{ marginBottom: '30px' }}>
        <div className="over-card">
          <h3>Pending Validations</h3>
          <p className="amount" style={{ color: '#f39c12' }}><span>{summary.pendingCount}</span></p>
          <small>Awaiting review</small>
        </div>
        <div className="over-card">
          <h3>High Priority</h3>
          <p className="amount highlight"><span>{summary.highPriorityCount}</span></p>
          <small>Urgent attention needed</small>
        </div>
        <div className="over-card">
          <h3>Validated</h3>
          <p className="amount green"><span>{summary.validatedThisMonth}</span></p>
          <small>This month</small>
        </div>
        <div className="over-card">
          <h3>Ready for Approval</h3>
          <p className="amount" style={{ color: '#3498db' }}><span>{summary.readyForApproval}</span></p>
          <small>Pending final approval</small>
        </div>
      </section>

      <div className="budgetvalidation-table-section card">
        <div className="table-header">
          <div className="table-header-group">
            <h2>Validation Queue</h2>
            <p>Items awaiting validation and approval</p>
          </div>

          <div className="validation-tabs">
            <div className="tabs-container">
              <button className={`tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
                All Pending <span className="count-badge">{allCount}</span>
              </button>
              <button className={`tab ${activeFilter === 'Allocation' ? 'active' : ''}`} onClick={() => setActiveFilter('Allocation')}>
                Budget Allocations <span className="count-badge">{allocationCount}</span>
              </button>
              <button className={`tab ${activeFilter === 'Expense' ? 'active' : ''}`} onClick={() => setActiveFilter('Expense')}>
                Expenses <span className="count-badge">{expenseCount}</span>
              </button>
              <button className={`tab ${activeFilter === 'High' ? 'active' : ''}`} onClick={() => setActiveFilter('High')}>
                High Priority <span className="count-badge">{highPrioCount}</span>
              </button>
            </div>
          </div>
        </div>
      
        <div className="tablescroll">
          <table className="budgetvalidation">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Submitted By</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Validations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.length === 0 ? (
                <tr><td colSpan="10" style={{textAlign: 'center', padding: '20px'}}>No items found for this category.</td></tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={`${item.id}-${item.type}`}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td><span className={`type-badge ${item.type.toLowerCase()}`}>{item.type}</span></td>
                    <td>{item.category}</td>
                    <td>₱{parseFloat(item.amount).toLocaleString()}</td>
                    <td>{item.submitted_by}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>
                        <span className={`priority-tag ${item.priority?.toLowerCase()}`}>
                            {item.priority}
                        </span>
                    </td>
                    <td><span className="valid-count">{item.validations} / 2</span></td>
                    <td>
                      <button className="validate-btn" onClick={() => openValidationPopup(item)}>
                        Validate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL */}
      {isPopupOpen && (
        <div className="popup" style={{ display: 'block' }}>
          <div className="popup-content">
            <span className="close" onClick={closeValidationPopup}>&times;</span>
            <h2>Validation Review: <span>{selectedItem?.id || 'N/A'}</span></h2>
            
            <div className="validation-form">
              <label htmlFor="validationComments">Validation Comments *</label>
              <textarea 
                id="validationComments" 
                placeholder="Provide validation comments and reasoning..." 
                rows="4" 
                required
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              ></textarea>
              
              <div className="validation-actions">
                <button type="button" className="btn-reject" onClick={() => submitDecision('Rejected')}>Reject</button>
                <button type="button" className="btn-approve" onClick={() => submitDecision('Approved')}>Approve</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ValidationCenter;