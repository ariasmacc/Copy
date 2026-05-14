import React, { useState, useEffect } from 'react';
import '../../index.css';

const PublicDocu = () => {
  const API_BASE_URL = '/api/public/documents';
  
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  // FIX: Complete rewrite of loadDocuments function
  const loadDocuments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // FIX: Actually make the fetch call (was missing in original)
      const res = await fetch(API_BASE_URL);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch documents: ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Documents loaded:', data); // Debug log
      
      // FIX: Ensure data is an array
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading documents:', err);
      setError(err.message);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // FIX: Properly implement view and download actions
  const handleDocumentAction = (action, doc) => {
    if (!doc) return;
    
    if (action === 'view') {
      // View: Open file in new tab using the file path
      if (doc.file_path) {
        window.open(doc.file_path, '_blank');
      } else {
        alert('File path not available');
      }
    } else if (action === 'download') {
      // Download: Trigger download through backend endpoint
      if (doc.file_name) {
        // Create an invisible link and click it
        const link = document.createElement('a');
        link.href = `${API_BASE_URL}/download/${encodeURIComponent(doc.file_name)}`;
        link.download = doc.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert('File name not available');
      }
    }
  };

  // Filter logic with null safety
  const filteredDocuments = documents.filter(doc => {
    if (!doc) return false;
    
    const docText = `${doc.file_name || ''} ${doc.description || ''} ${doc.related_transaction || ''}`.toLowerCase();
    const matchesSearch = searchTerm === '' || docText.includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || doc.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Summary calculations with null safety
  const summary = {
    total: documents.length,
    verified: documents.filter(d => d && (d.status === 'Approved' || d.status === 'Verified')).length,
    pending: documents.filter(d => d && d.status === 'Pending Review').length,
    storage: (documents.reduce((acc, d) => acc + (d?.size || 0), 0) / 1024).toFixed(2)
  };

  // Retry loading
  const handleRetry = () => {
    loadDocuments();
  };

  return (
    <main className="document-management">
      <div className="document-managemant-box">
        <div className="header-row">
          <div>
            <h2>Document Management</h2>
            <p className="subtitle">Secure storage and verification of financial documents</p>
          </div>
          <button onClick={handleRetry} className="btn-secondary" style={{ marginLeft: 'auto' }}>
            Refresh Documents
          </button>
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

      {error && (
        <div className="error-message" style={{ 
          background: '#ffebee', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          color: '#c62828'
        }}>
          <strong>Error:</strong> {error}
          <button onClick={handleRetry} style={{ marginLeft: '10px' }}>Retry</button>
        </div>
      )}

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
                <th>Document</th>
                <th>Type</th>
                <th>Size</th>
                <th>Related Transaction</th>
                <th>Category</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Hash</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                  <div className="loading-spinner">Loading documents...</div>
                </td></tr>
              ) : error ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: 'red' }}>
                  Error loading documents. Click "Refresh Documents" to retry.
                </td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px' }}>
                  {documents.length === 0 ? 'No documents found in the system.' : 'No documents match your search criteria.'}
                </td></tr>
              ) : (
                filteredDocuments.map((doc, index) => (
                  <tr key={doc.id || index}>
                    <td className="document-cell">
                      <strong>{doc.file_name || 'Unnamed Document'}</strong>
                    </td>
                    <td><span className="tag">{doc.type || 'N/A'}</span></td>
                    <td>{(doc.size || 0).toFixed(2)} KB</td>
                    <td>{doc.related_transaction || 'N/A'}</td>
                    <td>{doc.category || 'N/A'}</td>
                    <td>{doc.uploaded_by || 'N/A'}</td>
                    <td>{doc.date ? new Date(doc.date).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status ${(doc.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                        {doc.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="hash">{(doc.hash || '').substring(0, 10)}...</td>
                    <td>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button 
                          className="btn btn-small" 
                          onClick={() => handleDocumentAction('view', doc)}
                          disabled={!doc.file_path}
                        >
                          View
                        </button>
                        <button 
                          className="btn btn-small" 
                          onClick={() => handleDocumentAction('download', doc)}
                          disabled={!doc.file_name}
                        >
                          Download
                        </button>
                      </div>
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