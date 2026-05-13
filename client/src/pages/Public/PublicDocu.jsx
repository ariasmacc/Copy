import React, { useState, useEffect } from 'react';
import '../../index.css';

const PublicDocu = () => {
  // 1. Point to your Backend Port
  const BACKEND_URL = 'http://localhost:3000';
  const API_BASE_URL = '/api/public/documents'; // Match your documents.js route
  
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      // Added BACKEND_URL. No 'auth' needed here as it's a public route
      const res = await fetch(`${BACKEND_URL}${API_BASE_URL}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      
      const data = await res.json();
      // FIX: Removed the empty array overwrite
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Secure View and Download Logic
  const handleDocumentAction = (action, doc) => {
    if (action === 'view') {
      // Opens the static file in a new tab
      window.open(`${BACKEND_URL}${doc.file_path}`, '_blank');
    } else if (action === 'download') {
      // Triggers our secure backend download route
      window.location.href = `${BACKEND_URL}${API_BASE_URL}/download/${doc.file_name}`;
    }
  };

  // Filter logic
  const filteredDocuments = documents.filter(doc => {
    const docText = `${doc.file_name} ${doc.description} ${doc.related_transaction}`.toLowerCase();
    const matchesSearch = docText.includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const summary = {
    total: documents.length,
    verified: documents.filter(d => d.status === 'Approved' || d.status === 'Verified').length,
    pending: documents.filter(d => d.status === 'Pending Review').length,
    storage: (documents.reduce((acc, d) => acc + (d.size || 0), 0) / 1024).toFixed(2)
  };

  return (
    <main className="document-management">
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
          {['all', 'Receipt', 'Invoice', 'Liquidation Report', 'Budget Proposal'].map(type => (
            <button 
              key={type}
              className={activeFilter === type ? 'active' : ''} 
              onClick={() => setActiveFilter(type)}
            >
              {type === 'all' ? 'All Documents' : type + 's'} ({
                type === 'all' ? documents.length : documents.filter(d => d.type === type).length
              })
            </button>
          ))}
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
              {isLoading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center' }}>Loading documents...</td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center' }}>No documents found.</td></tr>
              ) : (
                filteredDocuments.map((doc, index) => (
                  <tr key={index}>
                    <td className="document-cell">
                        <strong>{doc.file_name}</strong>
                    </td>
                    <td><span className="tag">{doc.type}</span></td>
                    <td>{doc.size?.toFixed(2)} KB</td>
                    <td>{doc.related_transaction}</td>
                    <td>{doc.category}</td>
                    <td>{doc.uploaded_by}</td>
                    <td>{new Date(doc.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status ${doc.status?.toLowerCase().replace(' ', '-')}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="hash">{doc.hash?.substring(0, 10)}...</td>
                    <td>
                      <button className="btn" onClick={() => handleDocumentAction('view', doc)} style={{ marginRight: '5px' }}>View</button>
                      <button className="btn" onClick={() => handleDocumentAction('download', doc)}>Download</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default PublicDocu;