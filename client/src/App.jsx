import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './pages/Public/PublicLayout'; 
import AdminLayout from './components/layout/AdminLayout';
import ValidatorLayout from './components/layout/ValidatorLayout';

// Auth & Public Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import OTPVerification from './pages/auth/OTPVerification';
import Welcome from './pages/Public/Welcome';
import Overview from './pages/Public/PublicOverview';
import Ledger from './pages/Public/PublicTL';
import Documents from './pages/Public/PublicDocu';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminOverview from './pages/admin/AdminOverview';
import ValidationCenter from './pages/admin/ValidationCenter';
import BudgetAllocation from './pages/admin/BudgetAllocation';
import RecordExpense from './pages/admin/RecordExpense';
import UserMngmnt from './pages/admin/UserMngmnt';
import TransactionLedger from './pages/admin/TransactionLedger';
import DocumentMngmt from './pages/admin/DocumentMngmt';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Standalone Pages (No Dashboard Header) */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/signup" element={<Signup />} />
        <Route path="/auth/verify-otp" element={<OTPVerification />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        
        {/* 2. ADMIN ROUTES */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="overview" element={<AdminOverview />} />
          <Route path="validation" element={<ValidationCenter />} />
          <Route path="budget-allocation" element={<BudgetAllocation />} />
          <Route path="record-expense" element={<RecordExpense />} />
          <Route path="user-management" element={<UserMngmnt />} />
          <Route path="transaction-ledger" element={<TransactionLedger />} />
          <Route path="documents" element={<DocumentMngmt />} />  
          <Route index element={<Navigate to="overview" replace />} />
        </Route>

        {/* 3. VALIDATOR ROUTES (Uses same components as Admin but different Layout) */}
        <Route path="/validator" element={<ValidatorLayout />}>
          <Route path="overview" element={<AdminOverview />} />
          <Route path="validation" element={<ValidationCenter />} />
          <Route path="transaction-ledger" element={<TransactionLedger />} />
          <Route path="documents" element={<DocumentMngmt />} />
          <Route index element={<Navigate to="overview" replace />} />
        </Route>

        {/* Redirect root (/) to the Welcome splash screen */}
        <Route path="/" element={<Navigate to="/welcome" replace />} />

        {/* 4. Public Dashboard Group (Uses PublicLayout with Tabs) */}
        <Route path="/public" element={<PublicLayout />}>
          <Route path="overview" element={<Overview />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="documents" element={<Documents />} />
          <Route index element={<Navigate to="overview" replace />} />
        </Route>

        {/* 5. Safety Catch-All Route */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
