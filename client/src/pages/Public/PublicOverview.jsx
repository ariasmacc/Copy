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

// Register ChartJS components | Use npm install chart.js react-chartjs-2 para gumana
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PublicOverview = () => {
  const API_BASE_URL = '/api/public'; 

  // State for data
  const [summary, setSummary] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    percentage: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [trend, setTrend] = useState([]);

  // Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Summary
        const summaryRes = await fetch(`${API_BASE_URL}/overview/summary`);
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          const total = data.totalBudget || 0;
          const spent = data.totalSpent || 0;
          setSummary({
            totalBudget: total,
            totalSpent: spent,
            remaining: total - spent,
            percentage: total > 0 ? ((spent / total) * 100).toFixed(0) : 0
          });
        }

        // 2. Fetch Transactions
        const txRes = await fetch(`${API_BASE_URL}/transactions`);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.slice(0, 5));
        }

        // 3. Fetch Dashboard Data (Utilization and Trend)
        const [utilRes, trendRes] = await Promise.all([
          fetch(`${API_BASE_URL}/overview/utilization`),
          fetch(`${API_BASE_URL}/overview/spending-trend`)
        ]);

        if (utilRes.ok) setUtilization(await utilRes.json());
        if (trendRes.ok) setTrend(await trendRes.json());

      } catch (err) {
        console.error('Error loading dashboard data:', err);
      }
    };

    fetchData();
  }, []);

  // Chart Data Configurations
  const categoryChartData = {
    labels: utilization.map(c => c.category),
    datasets: [{
      label: 'Budget Allocated',
      data: utilization.map(c => c.totalAllocated),
      backgroundColor: 'rgba(44, 62, 80, 0.9)',
      borderColor: 'rgba(44, 62, 80, 1)',
      borderWidth: 1
    }]
  };

  const trendChartData = {
    labels: trend.map(d => new Date(d.month + '-02').toLocaleString('default', { month: 'short' })),
    datasets: [{
      label: 'Total Spent',
      data: trend.map(d => d.totalSpent),
      backgroundColor: 'rgba(44, 62, 80, 0.9)',
      borderColor: 'rgba(44, 62, 80, 1)',
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

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

          {/* Validation Status card hidden in public view per original script logic */}
          <div className="over-card" style={{ display: 'none' }}>
            <h3>Validation Status</h3>
            <p className="amount"><span id="validation-count">0</span></p>
            <small><span id="pending-count">0</span> pending validations</small>
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
              {utilization.map((cat, index) => {
                const percentage = cat.totalAllocated > 0 
                  ? ((cat.totalSpent / cat.totalAllocated) * 100).toFixed(0) 
                  : 0;
                return (
                  <div className="budget-item" key={index}>
                    <div className="budget-details">
                      <span>{cat.category}</span>
                      <span>₱{cat.totalSpent.toLocaleString()} / ₱{cat.totalAllocated.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="transactions-section card">
            <h3>Recent Transactions</h3>
            <p className="subtitle">Latest budget activities</p>
            <div id="transactionsContainer">
              {transactions.map((tx, index) => (
                <div className="transaction-item" key={index}>
                  <div className={`icon ${tx.type.toLowerCase()}`}></div>
                  <div className="details">
                    <strong>{tx.type}: {tx.name_or_vendor}</strong>
                    <small>{tx.category} • {new Date(tx.timestamp).toLocaleDateString()}</small>
                  </div>
                  <div className="amount">₱{tx.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
};

export default PublicOverview;