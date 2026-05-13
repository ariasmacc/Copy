import React, { useState, useEffect, useMemo } from 'react';

const TransactionLedger = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // UI State for dropdowns
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const BACKEND_URL = 'http://localhost:3000';
  const API_BASE_URL = '/api/transactions';

    useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        // FIX: Added credentials: 'include' to pass the JWT cookie
        const res = await fetch(`${BACKEND_URL}${API_BASE_URL}`, {
          credentials: 'include' 
        });
        
        if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
        const data = await res.json();
        setAllTransactions(data);
      } catch (err) {
        console.error('Error loading transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const summary = useMemo(() => {
    const validBlocks = allTransactions.filter(t => t.block_number != null);
    const totalBlocks = new Set(validBlocks.map(t => t.block_number)).size;
    const confirmedTxns = allTransactions.filter(t => 
      ['confirmed', 'approved'].includes(t.status?.toLowerCase())
    );
    const totalValue = confirmedTxns.reduce((acc, t) => acc + (t.amount || 0), 0);
    const formattedValue = totalValue >= 1000000 
      ? `₱${(totalValue / 1000000).toFixed(1)}M` 
      : `₱${totalValue.toLocaleString()}`;

    return { blocks: totalBlocks, txns: allTransactions.length, confirmed: confirmedTxns.length, value: formattedValue };
  }, [allTransactions]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const text = ((tx.transaction_id || '') + (tx.name_or_vendor || '') + (tx.hash || '')).toLowerCase();
      const matchesSearch = text.includes(searchTerm.toLowerCase());
      const matchesType = (typeFilter === 'all') || (tx.type === typeFilter);
      const matchesCategory = (categoryFilter === 'all') || (tx.category === categoryFilter);
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [allTransactions, searchTerm, typeFilter, categoryFilter]);

  const categories = useMemo(() => {
    return [...new Set(allTransactions.map(t => t.category).filter(Boolean))].sort();
  }, [allTransactions]);

  const renderValidationIcons = (count) => {
    const num = Number(count) || 0;
    const checkIcon = <svg width="12" height="12" viewBox="0 0 24 24" style={{display:'inline'}}><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10.011 10.011 0 0 0 12 2Zm-2 15L6 13l1.41-1.41L10 14.17l6.59-6.59L18 9Z"/></svg>;
    const circleIcon = <svg width="12" height="12" viewBox="0 0 24 24" style={{display:'inline'}}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;
    if (num >= 2) return <>{checkIcon}{checkIcon}</>;
    if (num === 1) return <>{checkIcon}{circleIcon}</>;
    return <>{circleIcon}{circleIcon}</>;
  };

  return (
    <main className="expense-page">
      <div className="expense-recording-page" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="ledger-title-container">
          <h2>Transaction Ledger</h2>
          <p className="subtitle">Blockchain-inspired record of all financial transactions</p>
        </div>
        <p className="crypto-secured" style={{ color: '#2ecc71', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="crypto-icon" style={{ width: '18px', marginRight: '5px' }}>
            <path d="M12 2l7 4v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V6l7-4z" />
          </svg>
          Cryptographically Secured
        </p>
      </div>

      <section className="summary-cards" style={{ marginBottom: '30px', marginTop: '20px' }}>
        <div className="over-card">
          <h3>Total Blocks</h3>
          <p className="amount"><span>{summary.blocks}</span></p>
        </div>
        <div className="over-card">
          <h3>Total Transactions</h3>
          <p className="amount" style={{ color: '#3498db' }}><span>{summary.txns}</span></p>
        </div>
        <div className="over-card">
          <h3>Confirmed</h3>
          <p className="amount green"><span>{summary.confirmed}</span></p>
        </div>
        <div className="over-card">
          <h3>Total Value</h3>
          <p className="amount highlight"><span>{summary.value}</span></p>
        </div>
      </section>

      <div className="budgetvalidation-table-section card">
        <div className="table-header">
          <h3>Transaction Ledger</h3>
          <p>Showing <span>{filteredTransactions.length}</span> out of <span>{allTransactions.length}</span> transactions</p>
        </div>

        <div className="search-filters">
          <div className="filter-controls">
            <div className="search-group">
              <input 
                type="text" 
                placeholder="Search by ID, description, or hash..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="dropdown-group">
              <div className="dropdown">
                <button className="dropdown-button" onClick={() => setIsTypeOpen(!isTypeOpen)}>
                  {typeFilter === 'all' ? 'All Types' : typeFilter}
                </button>
                {isTypeOpen && (
                  <div className="dropdown-content" style={{ display: 'block' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setTypeFilter('all'); setIsTypeOpen(false); }}>All Types</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); setTypeFilter('Allocation'); setIsTypeOpen(false); }}>Budget Allocations</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); setTypeFilter('Expense'); setIsTypeOpen(false); }}>Expenses</a>
                  </div>
                )}
              </div>
              <button type="button" className="btn-secondary" onClick={() => window.location.href = `${BACKEND_URL}${API_BASE_URL}/export`}>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="tablescroll">
          <table className="budgetvalidation transaction-table">
            <thead>
              <tr><th>Block</th><th>Transaction ID</th><th>Type</th><th>Category</th><th>Amount</th><th>Timestamp</th><th>Validators</th><th>Status</th></tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8">Loading transactions...</td></tr>
              ) : filteredTransactions.map((tx, idx) => (
                <tr key={tx.transaction_id || idx}>
                  <td>{tx.block_number ? `#${tx.block_number}` : 'N/A'}</td>
                  <td>{tx.transaction_id}</td>
                  <td><span className={`type ${tx.type?.toLowerCase()}`}>{tx.type}</span></td>
                  <td>{tx.category}</td>
                  <td>₱{(tx.amount || 0).toLocaleString()}</td>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td>{tx.validations} / 2 {renderValidationIcons(tx.validations)}</td>
                  <td><span className={`status ${tx.status?.toLowerCase()}`}>{tx.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default TransactionLedger;