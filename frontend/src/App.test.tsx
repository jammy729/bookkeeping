import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeProvider';
import { BusinessProvider } from './context/BusinessContext';
import App from './App';
import { isAdminZone, getLoginUrl, replaceLocation } from './lib/routes';

// jsdom's window.location is non-configurable, so we cannot redefine the
// hostname per-test. Instead we mock the pure zone helpers (already covered
// by routes.test.ts) so the App component can be driven through both zones
// deterministically.
vi.mock('./lib/routes', () => ({
  ADMIN_SUBDOMAIN_PREFIX: 'admin.',
  isAdminZone: vi.fn(),
  getApexOrigin: vi.fn(() => 'http://localhost:5173'),
  getAdminOrigin: vi.fn(() => 'http://admin.localhost:5173'),
  getLoginUrl: vi.fn(() => 'http://localhost:5173/login'),
  // ProtectedRoute navigates to the cross-origin apex login page through this
  // seam. We mock it (rather than spying on window.location.replace, which is
  // an unforgeable/non-configurable property in jsdom) and assert the exact
  // URL it was asked to navigate to.
  replaceLocation: vi.fn(),
}));

// Avoid real network attempts from Dashboard queries during tests.
vi.mock('./lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const FAKE_JWT = (() => {
  const payload = btoa(
    JSON.stringify({ sub: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' }),
  );
  return `header.${payload}.sig`;
})();

function renderApp(initialEntries: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="bookkeeping-theme-test">
        <BusinessProvider>
          <MemoryRouter
            initialEntries={initialEntries}
            future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
          >
            <App />
          </MemoryRouter>
        </BusinessProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

function mockZone(admin: boolean) {
  (isAdminZone as Mock).mockReturnValue(admin);
  (getLoginUrl as Mock).mockReturnValue('http://localhost:5173/login');
}

describe('App zone routing', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('apex zone renders the login form at /login', async () => {
    mockZone(false);
    renderApp(['/login']);

    expect(await screen.findByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('apex zone redirects / to the login form', async () => {
    mockZone(false);
    renderApp(['/']);

    // Real <Navigate to="/login"> re-renders the Login page within the router.
    expect(await screen.findByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('admin zone redirects unauthenticated / to the apex login URL via a full page navigation', async () => {
    mockZone(true);
    renderApp(['/']);

    // ProtectedRoute must perform a real cross-origin navigation (never a
    // react-router <Navigate>, which would treat the absolute URL as an
    // internal path and loop forever against the catch-all).
    await waitFor(() => {
      expect(replaceLocation).toHaveBeenCalledWith('http://localhost:5173/login');
    });
    // No dashboard content should be rendered while the redirect is in flight.
    expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
  });

  it('admin zone renders the dashboard for an authenticated user at /', async () => {
    mockZone(true);
    localStorage.setItem('token', FAKE_JWT);
    renderApp(['/']);

    expect(await screen.findByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText(/Hello, A/)).toBeInTheDocument();
  });
});
