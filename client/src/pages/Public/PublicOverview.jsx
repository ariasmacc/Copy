import React, { useState, useEffect, useRef } from 'react';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PublicOverview = () => {
  // FIX: Use relative path for production or get from env
  const API_BASE_URL = '/api/public'; 

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
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // FIX: Add error handling for each fetch
        const summaryRes = await fetch(`${API_BASE_URL}/overview/summary`);
        if (!summaryRes.ok) throw new Error(`Summary fetch failed: ${summaryRes.statusText}`);
        const summaryData = await summaryRes.json();
        
        const total = summaryData.totalBudget || 0;
        const spent = summaryData.totalSpent || 0;
        setSummary({
          totalBudget: total,
          totalSpent: spent,
          remaining: total - spent,
          percentage: total > 0 ? ((spent / total) * 100).toFixed(0) : 0
        });

        // FIX: Fetch transactions with error handling
        const txRes = await fetch(`${API_BASE_URL}/transactions`);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(Array.isArray(txData) ? txData.slice(0, 5) : []);
        }

        // FIX: Fetch both utilization and trend simultaneously
        const [utilRes, trendRes] = await Promise.all([
          fetch(`${API_BASE_URL}/overview/utilization`),
          fetch(`${API_BASE_URL}/overview/spending-trend`)
        ]);

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

    fetchData();
    
    // FIX: Add auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // FIX: Safe chart data with fallbacks
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
        return new Date(d.month + '-02').toLocaleString('default', { month: 'short' });
      } catch {
        return d.month || 'Unknown';
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
          <p className="subtitle" style={{ color: 'red' }}>Error loading dashboard: {error}</p>
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
            <p className="amount">₱<span id="total-budget">{summary.totalBudget.toLocaleString()}</span></p>
            <small>Allocated across all categories</small>
          </div>

          <div className="over-card">
            <h3>Total Spent</h3>
            <p className="amount highlight">₱<span id="total-spent">{summary.totalSpent.toLocaleString()}</span></p>
            <small><span id="budget-percentage">{summary.percentage}%</span> of total budget</small>
          </div>

          <div className="over-card">
            <h3>Remaining</h3>
            <p className="amount green">₱<span id="remaining">{summary.remaining.toLocaleString()}</span></p>
            <small>Available for future expenses</small>
          </div>
        </section>

        <section className="charts">
          <div className="chart-card">
            <h3>Budget Allocation by Category</h3>
            <p className="subtitle">Current spending vs allocated amounts</p>
            <div style={{ height: '300px' }}>
              <Bar data={categoryChartData} options={chartOptions} id="budgetCategoryChart" />
            </div>
          </div>

          <div className="chart-card">
            <h3>Monthly Spending Trend</h3>
            <p className="subtitle">Spending patterns over the last 6 months</p>
            <div style={{ height: '300px' }}>
              <Bar data={trendChartData} options={chartOptions} id="monthlySpendingChart" />
            </div>
          </div>
        </section>

        <section className="budget-transactions">
          <section className="budget-section card">
            <h3>Budget Utilization by Category</h3>
            <p className="subtitle">Progress towards budget limits</p>
            <div id="budgetContainer">
              {utilization.length === 0 ? (
                <p>No budget utilization data available</p>
              ) : (
                utilization.map((cat, index) => {
                  const percentage = cat.totalAllocated > 0 
                    ? ((cat.totalSpent / cat.totalAllocated) * 100).toFixed(0) 
                    : 0;
                  return (
                    <div className="budget-item" key={index}>
                      <div className="budget-details">
                        <span>{cat.category || 'Unknown'}</span>
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
                      <strong>{tx.type || 'N/A'}: {tx.name_or_vendor || 'N/A'}</strong>
                      <small>{tx.category || 'N/A'} • {tx.timestamp ? new Date(tx.timestamp).toLocaleDateString() : 'N/A'}</small>
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