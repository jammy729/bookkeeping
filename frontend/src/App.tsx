import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { TaxSummary } from './pages/TaxSummary';
import { Receipts } from './pages/Receipts';
import { Categories } from './pages/Categories';
import { Budgets } from './pages/Budgets';
import { Invoices } from './pages/Invoices';
import { Clients } from './pages/Clients';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';
import { isAdminZone as isAdminZoneCheck } from './lib/routes';

function App() {
  // Computed inside the component (not module-level) so tests can vary the
  // hostname between zones. Aliased import so the local `isAdminZone` const
  // below doesn't shadow the imported function into its own TDZ.
  const isAdminZone = isAdminZoneCheck();

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <ErrorBoundary>
      {isAdminZone ? (
        /* Admin zone (admin.*): full authenticated app at root paths. */
        <Routes>
          {/* Onboarding (protected) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="receipts" element={<Receipts />} />
            <Route path="clients" element={<Clients />} />
            <Route path="categories" element={<Categories />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tax-summary" element={<TaxSummary />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        /* Apex zone: public pages only. The JWT is never persisted here. */
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
