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
import { Health } from './pages/Health';
import { isAdminZone as isAdminZoneCheck } from './lib/routes';

function App() {
  // Computed inside the component (not module-level) so tests can vary the
  // hostname between zones. Aliased import so the local `isAdminZone` const
  // below doesn't shadow the imported function into its own TDZ.
  const isAdminZone = isAdminZoneCheck();

  // Single-zone deployments have no `admin.` subdomain (no free TLS cert can
  // exist for it), so the full app — including the public auth pages — runs at
  // the deployed origin. See VITE_SINGLE_ZONE in lib/routes.ts.
  const singleZone = import.meta.env.VITE_SINGLE_ZONE === 'true';
  const fullAppZone = singleZone || isAdminZone;

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <ErrorBoundary>
      {fullAppZone ? (
        /* Full app zone (admin.* subdomain, or the single deployed origin
           when VITE_SINGLE_ZONE=true): protected pages at root paths plus —
           in single-zone mode only — the public auth pages, so unauthenticated
           redirects (ProtectedRoute/api 401) stay on the same origin. */
        <Routes>
          {singleZone && (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/health" element={<Health />} />
            </>
          )}

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
          {/* Onboarding: public on the apex. The token arrives via the URL
              hash fragment from /register and is never persisted here; the
              business profile is saved to the backend before handing off to
              the admin zone. */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Public diagnostics page — no auth, shows service URLs from the
              backend /api/health endpoint (DB credentials are redacted there). */}
          <Route path="/health" element={<Health />} />

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
