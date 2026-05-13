import React, { useState, useEffect } from 'react';

const DocumentMngmt = () => {
  // 1. Point this to your Backend Port
  const BACKEND_URL = 'http://localhost:3000';
  const API_BASE_URL = '/api';
  
  const [allDocuments, setAllDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      setUser(JSON.parse(userString));
    } else {
      setUser({ name: 'Admin', role: 'Admin' }); 
    }
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}${API_BASE_URL}/documents`, {
        credentials: 'include'
      });
      
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      
      const documentsArray = Array.isArray(data) ? data : [];
      setAllDocuments(documentsArray);
      setFilteredDocuments(documentsArray);
    } catch (err) {
      console.error('Error loading documents:', err);
      setAllDocuments([]);
      setFilteredDocuments([]);
    }
  };

  useEffect(() => {
    const filtered = allDocuments.filter((doc) => {
      const docText = (
        (doc.file_name || '') +
        (doc.description || '') +
        (doc.related_transaction || '')
      ).toLowerCase();

      const matchesSearch = docText.includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === 'all' || doc.type === activeFilter;

      return matchesSearch && matchesFilter;
    });
    setFilteredDocuments(filtered);
  }, [searchTerm, activeFilter, allDocuments]);

  // ==========================================
  // FIXED ACTION HANDLER
  // ==========================================
  const handleAction = (action, doc) => {
    const BACKEND_URL = 'http://localhost:3000';
    
    if (action === 'view') {
      // Keep "View" pointing to the static folder to open in a new tab
      const viewUrl = `${BACKEND_URL}${doc.file_path}`;
      window.open(viewUrl, '_blank');
    } else if (action === 'download') {
      // Point "Download" to our new API endpoint
      // We use the actual filename from the DB (e.g., file-123.png)
      const downloadUrl = `${BACKEND_URL}/api/documents/download/${doc.file_name}`;
      
      // We open this in a hidden way or just use window.location
      window.location.href = downloadUrl;
    }
  };

  const summary = {
    total: allDocuments.length,
    verified: allDocuments.filter(d => d.status === 'Approved' || d.status === 'Verified').length,
    pending: allDocuments.filter(d => d.status === 'Pending Review').length,
    storage: (allDocuments.reduce((acc, d) => acc + (d.size || 0), 0) / 1024).toFixed(2)
  };

  const filterOptions = ['All', 'Receipt', 'Invoice', 'Liquidation Report', 'Budget Proposal'];

  return (
    <main className="document-management">
      {/* ... (Your Header and Summary Cards JSX remains the same) ... */}
      <div className="document-managemant-box">
        <div className="header-row">
          <div>
            <h2>Document Management</h2>
            <p className="subtitle">Secure storage and verification of financial documents</p>
          </div>
        </div>

        <div className="docs-grid">
          <div className="docs-card">
            <h4>Total Documents</h4>
            <p className="docs-number">{summary.total}</p>
          </div>
          <div className="docs-card">
            <h4>Verified</h4>
            <p className="docs-number verified">{summary.verified}</p>
          </div>
          <div className="docs-card">
            <h4>Pending Review</h4>
            <p className="docs-number pending">{summary.pending}</p>
          </div>
          <div className="docs-card">
            <h4>Storage Used</h4>
            <p className="docs-number">{summary.storage} MB</p>
          </div>
          <div className="docs-card">
            <h4>Security</h4>
            <p className="docs-status">Cryptographically Secured</p>
          </div>
        </div>
      </div>

      <div className="document-repo card">
        <h3>Document Repository</h3>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search documents..." 
            className="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {filterOptions.map(option => {
            const key = option === 'All' ? 'all' : option;
            const count = option === 'All' 
                ? allDocuments.length 
                : allDocuments.filter(d => d.type === option).length;
            
            return (
              <button 
                key={option}
                className={activeFilter === key ? 'active' : ''}
                onClick={() => setActiveFilter(key)}
              >
                {option} ({count})
              </button>
            );
          })}
        </div>

        <div className="tablescroll">
          <table>
            <thead>
              <tr>
                <th>Document</th><th>Type</th><th>Size</th><th>Related Transaction</th>
                <th>Category</th><th>Uploaded By</th><th>Date</th><th>Status</th>
                <th>Hash</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc, index) => (
                  <tr key={index}>
                    <td className="document-cell">
                      <strong>{doc.file_name}</strong>
                    </td>
                    <td><span className="tag">{doc.type}</span></td>
                    <td>{doc.size?.toFixed(2)} KB</td>
                    <td>{doc.related_transaction}</td>
                    <td>{doc.category || 'N/A'}</td>
                    <td>{doc.uploaded_by}</td>
                    <td>{new Date(doc.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status ${doc.status?.toLowerCase().replace(' ', '-')}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="hash">
                      {doc.hash ? `${doc.hash.substring(0, 10)}...` : 'N/A'}
                    </td>
                    <td>
                      <button className="btn" onClick={() => handleAction('view', doc)}>View</button>
                      <button className="btn" onClick={() => handleAction('download', doc)}>Download</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="10">No documents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default DocumentMngmt;