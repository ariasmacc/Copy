import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PublicOverview = () => {
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    percentage: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [trend, setTrend] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching public overview data...');
      
      // Fetch summary
      const summaryRes = await fetch('/api/public/overview/summary', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'omit' // No cookies needed for public routes
      });

      console.log('Summary response status:', summaryRes.status);
      console.log('Summary content-type:', summaryRes.headers.get('content-type'));

      // Check if response is JSON
      const contentType = summaryRes.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await summaryRes.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned HTML instead of JSON. Please check if the backend is properly configured.');
      }

      if (!summaryRes.ok) {
        throw new Error(`Server error: ${summaryRes.status} ${summaryRes.statusText}`);
      }

      const summaryData = await summaryRes.json();
      console.log('Summary data:', summaryData);
      
      const total = summaryData.totalBudget || 0;
      const spent = summaryData.totalSpent || 0;
      setSummary({
        totalBudget: total,
        totalSpent: spent,
        remaining: total - spent,
        percentage: total > 0 ? ((spent / total) * 100).toFixed(0) : 0
      });

      // Fetch other data in parallel
      const [txRes, utilRes, trendRes] = await Promise.all([
        fetch('/api/public/transactions', {
          headers: { 'Accept': 'application/json' },
          credentials: 'omit'
        }),
        fetch('/api/public/overview/utilization', {
          headers: { 'Accept': 'application/json' },
          credentials: 'omit'
        }),
        fetch('/api/public/overview/spending-trend', {
          headers: { 'Accept': 'application/json' },
          credentials: 'omit'
        })
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(Array.isArray(txData) ? txData.slice(0, 5) : []);
      }

      if (utilRes.ok) {
        const utilData = await utilRes.json();
        setUtilization(Array.isArray(utilData) ? utilData : []);
      }

      if (trendRes.ok) {
        const trendData = await trendRes.json();
        setTrend(Array.isArray(trendData) ? trendData : []);
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart configurations
  const categoryChartData = {
    labels: utilization.length > 0 ? utilization.map(c => c.category || 'Unknown') : ['No Data'],
    datasets: [{
      label: 'Budget Allocated',
      data: utilization.length > 0 ? utilization.map(c => c.totalAllocated || 0) : [0],
      backgroundColor: 'rgba(44, 62, 80, 0.9)',
      borderColor: 'rgba(44, 62, 80, 1)',
      borderWidth: 1
    }]
  };

  const trendChartData = {
    labels: trend.length > 0 ? trend.map(d => {
      try {
        return new Date(d.month + '-01').toLocaleString('default', { month: 'short' });
      } catch {
        return d.month || '?';
      }
    }) : ['No Data'],
    datasets: [{
      label: 'Total Spent',
      data: trend.length > 0 ? trend.map(d => d.totalSpent || 0) : [0],
      backgroundColor: 'rgba(44, 62, 80, 0.9)',
      borderColor: 'rgba(44, 62, 80, 1)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `₱${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        ticks: {
          callback: (value) => `₱${value.toLocaleString()}`
        }
      } 
    }
  };

  if (isLoading) {
    return (
      <main className="dashboard">
        <div className="public-budget">
          <h1>Public Budget Dashboard</h1>
          <p className="subtitle">Loading real-time data...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="dashboard">
        <div className="public-budget">
          <h1>Public Budget Dashboard</h1>
          <div style={{
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            padding: '20px',
            margin: '20px 0'
          }}>
            <h3 style={{color: '#c62828', marginTop: 0}}>⚠️ Unable to Load Dashboard</h3>
            <p style={{color: '#c62828'}}>{error}</p>
            <div style={{background: '#fff', padding: '15px', borderRadius: '4px', margin: '15px 0'}}>
              <strong>Troubleshooting:</strong>
              <ol style={{marginBottom: 0}}>
                <li>Check if the backend server is running</li>
                <li>Verify that public API routes are configured</li>
                <li>Try accessing <a href="/api/debug" target="_blank">/api/debug</a> to check database</li>
                <li>Check browser console for network errors</li>
              </ol>
            </div>
            <button 
              onClick={fetchData}
              style={{
                background: '#2c3e50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry Loading
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <div className="public-budget">
        <h1>Public Budget Dashboard</h1>
        <p className="subtitle">Real-time view of budget allocations and spending</p>

        <section className="summary-cards">
          <div className="over-card">
            <h3>Total Budget</h3>
            <p className="amount">₱<span>{summary.totalBudget.toLocaleString()}</span></p>
            <small>Allocated across all categories</small>
          </div>

          <div className="over-card">
            <h3>Total Spent</h3>
            <p className="amount highlight">₱<span>{summary.totalSpent.toLocaleString()}</span></p>
            <small><span>{summary.percentage}%</span> of total budget</small>
          </div>

          <div className="over-card">
            <h3>Remaining</h3>
            <p className="amount green">₱<span>{summary.remaining.toLocaleString()}</span></p>
            <small>Available for future expenses</small>
          </div>
        </section>

        <section className="charts">
          <div className="chart-card">
            <h3>Budget Allocation by Category</h3>
            <p className="subtitle">Current spending vs allocated amounts</p>
            <div style={{ height: '300px' }}>
              <Bar data={categoryChartData} options={chartOptions} />
            </div>
          </div>

          <div className="chart-card">
            <h3>Monthly Spending Trend</h3>
            <p className="subtitle">Spending patterns over the last 6 months</p>
            <div style={{ height: '300px' }}>
              <Bar data={trendChartData} options={chartOptions} />
            </div>
          </div>
        </section>

        <section className="budget-transactions">
          <section className="budget-section card">
            <h3>Budget Utilization by Category</h3>
            <p className="subtitle">Progress towards budget limits</p>
            <div id="budgetContainer">
              {utilization.length === 0 ? (
                <p>No budget data available</p>
              ) : (
                utilization.map((cat, index) => {
                  const percentage = cat.totalAllocated > 0 
                    ? ((cat.totalSpent / cat.totalAllocated) * 100).toFixed(0) 
                    : 0;
                  return (
                    <div className="budget-item" key={index}>
                      <div className="budget-details">
                        <span>{cat.category}</span>
                        <span>₱{(cat.totalSpent || 0).toLocaleString()} / ₱{(cat.totalAllocated || 0).toLocaleString()}</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="transactions-section card">
            <h3>Recent Transactions</h3>
            <p className="subtitle">Latest budget activities</p>
            <div id="transactionsContainer">
              {transactions.length === 0 ? (
                <p>No recent transactions</p>
              ) : (
                transactions.map((tx, index) => (
                  <div className="transaction-item" key={index}>
                    <div className={`icon ${(tx.type || '').toLowerCase()}`}></div>
                    <div className="details">
                      <strong>{tx.type}: {tx.name_or_vendor}</strong>
                      <small>{tx.category} • {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : ''}</small>
                    </div>
                    <div className="amount">₱{(tx.amount || 0).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default PublicOverview;