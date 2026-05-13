import React, { useState, useEffect, useMemo } from 'react';

const PublicTL = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // UI State for dropdowns
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const API_BASE_URL = '/api/public'; 

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/transactions`);
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

  // 2. Computed Summary Stats
  const summary = useMemo(() => {
    const validBlocks = allTransactions.filter(t => t.block_number != null);
    const totalBlocks = new Set(validBlocks.map(t => t.block_number)).size;
    
    const confirmedTxns = allTransactions.filter(t => 
      t.status?.toLowerCase() === 'confirmed' || t.status?.toLowerCase() === 'approved'
    );
    
    const totalValue = confirmedTxns.reduce((acc, t) => acc + (t.amount || 0), 0);
    const formattedValue = totalValue >= 1000000 
      ? `₱${(totalValue / 1000000).toFixed(1)}M` 
      : `₱${totalValue.toLocaleString()}`;

    return {
      blocks: totalBlocks,
      txns: allTransactions.length,
      confirmed: confirmedTxns.length,
      value: formattedValue
    };
  }, [allTransactions]);

  // 3. Filtered Data
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      const text = ((tx.transaction_id || '') + (tx.name_or_vendor || '') + (tx.hash || '')).toLowerCase();
      const matchesSearch = text.includes(searchTerm.toLowerCase());
      const matchesType = (typeFilter === 'all') || (tx.type === typeFilter);
      const matchesCategory = (categoryFilter === 'all') || (tx.category === categoryFilter);
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [allTransactions, searchTerm, typeFilter, categoryFilter]);

  // 4. Unique Categories for Filter
  const categories = useMemo(() => {
    return [...new Set(allTransactions.map(t => t.category).filter(Boolean))].sort();
  }, [allTransactions]);

  // Helpers
  const handleExport = () => {
    window.location.href = `${API_BASE_URL}/transactions/export`;
  };

  const getValidationIcons = (count) => {
    const num = Number(count) || 0;
    const checkIcon = <svg width="12" height="12" viewBox="0 0 24 24" style={{display:'inline'}}><path fill="currentColor" d="M12 2A10 10 0 1 0 22 12A10.011 10.011 0 0 0 12 2Zm-2 15L6 13l1.41-1.41L10 14.17l6.59-6.59L18 9Z"/></svg>;
    const circleIcon = <svg width="12" height="12" viewBox="0 0 24 24" style={{display:'inline'}}><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/></svg>;

    if (num >= 2) return <>{checkIcon}{checkIcon}</>;
    if (num === 1) return <>{checkIcon}{circleIcon}</>;
    return <>{circleIcon}{circleIcon}</>;
  };

  return (
    <main className="transaction-ledger-page">
      <div className="ledger-info">
        <div className="ledger-title-container">
          <h2>Transaction Ledger</h2>
          <p className="subtitle">Blockchain-inspired record of all financial transactions</p>
        </div>

        <p className="crypto-secured">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="crypto-icon">
            <path d="M12 2l7 4v6c0 5-3.58 9.74-7 10-3.42-.26-7-5-7-10V6l7-4z" />
          </svg>
          Cryptographically Secured
        </p>
      </div>

      <div className="summary-cards">
        <div className="over-card"><h3>Total Blocks</h3><div className="value">{summary.blocks}</div></div>
        <div className="over-card"><h3>Total Transactions</h3><div className="value">{summary.txns}</div></div>
        <div className="over-card"><h3>Confirmed Transactions</h3><div className="value">{summary.confirmed}</div></div>
        <div className="over-card"><h3>Total Value</h3><div className="value">{summary.value}</div></div>
      </div>

      <div className="budgetvalidation-table-section card">
        <div className="table-header">
          <h3>Transaction Ledger</h3>
          <p>Showing <span>{filteredTransactions.length}</span> out of <span>{allTransactions.length}</span> transactions</p>
        </div>

        <div className="search-filters">
          <div className="filter-controls">
            <div className="search-group">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7f8c8d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search by ID, description, or hash..." 
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="dropdown-group">
              {/* Type Dropdown */}
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

              {/* Category Dropdown */}
              <div className="dropdown">
                <button className="dropdown-button" onClick={() => setIsCategoryOpen(!isCategoryOpen)}>
                  {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
                </button>
                {isCategoryOpen && (
                  <div className="dropdown-content" style={{ display: 'block' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setCategoryFilter('all'); setIsCategoryOpen(false); }}>All Categories</a>
                    {categories.map(cat => (
                      <a key={cat} href="#" onClick={(e) => { e.preventDefault(); setCategoryFilter(cat); setIsCategoryOpen(false); }}>{cat}</a>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="btn-secondary export-btn" onClick={handleExport}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        <div className="tablescroll">
          <table className="budgetvalidation transaction-table">
            <thead>
              <tr>
                <th>Block</th>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Initiated By</th>
                <th>Timestamp</th>
                <th>Validators</th>
                <th>Hash</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="10">Loading transactions...</td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan="10">No transactions found.</td></tr>
              ) : (
                filteredTransactions.map((tx, idx) => (
                  <tr key={tx.transaction_id || idx}>
                    <td>{tx.block_number ? `#${tx.block_number}` : 'N/A'}</td>
                    <td>{tx.transaction_id || 'N/A'}</td>
                    <td><span className={`type ${tx.type?.toLowerCase() || ''}`}>{tx.type || 'N/A'}</span></td>
                    <td>{tx.category || 'N/A'}</td>
                    <td>₱{(tx.amount || 0).toLocaleString()}</td>
                    <td>{tx.initiated_by || 'N/A'}</td>
                    <td>{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</td>
                    <td>{getValidationIcons(tx.validations)}</td>
                    <td className="hash" title={tx.hash || ''}>
                      {tx.hash ? tx.hash.substring(0, 10) + '...' : 'N/A'}
                    </td>
                    <td><span className={`status ${tx.status?.toLowerCase() || ''}`}>{tx.status || 'N/A'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="blockchain-view card">
        <h3>Blockchain Structure</h3>
        <p className="subtitle">Latest transactions in block format</p>
        <div className="transaction-blocks">
          {allTransactions.length === 0 ? (
            <p>No recent blocks to display.</p>
          ) : (
            allTransactions.slice(0, 3).map((tx, idx) => (
              <div className="transaction-block" key={`block-${idx}`}>
                <div className="block-number">{tx.block_number ? `#${tx.block_number}` : 'N/A'}</div>
                <div className="transaction-content">
                  <div className="transaction-header">
                    <span className="transaction-id">{tx.transaction_id || 'N/A'}</span>
                    <span className={`transaction-type ${tx.type?.toLowerCase() || ''}`}>{tx.type || 'N/A'}</span>
                    <span className="transaction-date">{tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="transaction-description">
                    {tx.name_or_vendor || 'N/A'} ({tx.category || 'N/A'})
                  </div>
                  <div className="transaction-hash">
                    <span className="hash" title={tx.hash || ''}>
                      Hash: {tx.hash ? tx.hash.substring(0, 20) + '...' : 'N/A'}
                    </span>
                    <span className="previous-hash" title={tx.previous_hash || ''}>
                      Previous: {tx.previous_hash ? tx.previous_hash.substring(0, 20) + '...' : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
};

export default PublicTL;