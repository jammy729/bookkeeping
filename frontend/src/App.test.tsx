import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
    window.location.hash = '';
    localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
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

  it('apex zone redirects /onboarding without a handoff token to the register form', async () => {
    mockZone(false);
    renderApp(['/onboarding']);

    // Onboarding requires a #token= handoff from /register; a direct visit
    // must bounce back to registration instead of showing a broken form.
    expect(
      await screen.findByRole('button', { name: /create account/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/business \/ company name/i)).not.toBeInTheDocument();
  });

  it('apex zone renders onboarding with a handoff token instead of the login form', async () => {
    mockZone(false);
    // The token arrives via window.location.hash (MemoryRouter does not
    // propagate it), which is exactly how /register hands the JWT over.
    window.location.hash = '#token=' + encodeURIComponent(FAKE_JWT);
    renderApp(['/onboarding']);

    expect(
      await screen.findByText(/business \/ company name/i),
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('you@example.com')).not.toBeInTheDocument();
  });

  it('apex zone renders the system health page at /health with service URLs', async () => {
    mockZone(false);
    const { api } = await import('./lib/api');
    (api.get as Mock).mockResolvedValueOnce({
      data: {
        status: 'ok',
        timestamp: '2026-08-02T00:00:00.000Z',
        environment: 'development',
        urls: {
          frontend: 'http://localhost:5173',
          backend: 'http://localhost:3001',
          database: 'postgresql://aws-1-us-west-2.pooler.supabase.com:5432/postgres',
        },
      },
    });

    renderApp(['/health']);

    expect(await screen.findByText(/system health/i)).toBeInTheDocument();
    expect(await screen.findByText('http://localhost:3001')).toBeInTheDocument();
    expect(
      screen.getByText('postgresql://aws-1-us-west-2.pooler.supabase.com:5432/postgres'),
    ).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
    expect(screen.getByText(/healthy/i)).toBeInTheDocument();
  });

  it('register submits and navigates to apex onboarding with the token in the hash', async () => {
    mockZone(false);
    const { api } = await import('./lib/api');
    (api.post as Mock).mockResolvedValueOnce({
      data: { user: { id: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' }, token: FAKE_JWT },
    });

    renderApp(['/register']);

    const firstName = await screen.findByPlaceholderText('First name');
    const lastName = screen.getByPlaceholderText('Last name');
    const email = screen.getByPlaceholderText('you@example.com');
    const password = screen.getByPlaceholderText(/at least 6 characters/i);
    const confirmPassword = screen.getByPlaceholderText(/confirm your password/i);

    fireEvent.change(firstName, { target: { value: 'A' } });
    fireEvent.change(lastName, { target: { value: 'B' } });
    fireEvent.change(email, { target: { value: 'a@b.c' } });
    fireEvent.change(password, { target: { value: 'password123' } });
    fireEvent.change(confirmPassword, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(replaceLocation).toHaveBeenCalledWith(
        'http://localhost:5173/onboarding#token=' + encodeURIComponent(FAKE_JWT),
      );
    });
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

  // ── Single-zone mode (VITE_SINGLE_ZONE=true) ────────────────────────────
  // Free hosting (Render *.onrender.com) can't serve an `admin.` subdomain, so
  // the full app runs at the deployed origin. App.tsx reads the flag at render
  // time, so stubbing the env var is sufficient — no module re-import needed.

  it('single-zone mode exposes /login inside the full app (no cross-origin redirect)', async () => {
    vi.stubEnv('VITE_SINGLE_ZONE', 'true');
    mockZone(true); // zone logic collapses onto the deployed origin

    renderApp(['/login']);

    expect(await screen.findByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(replaceLocation).not.toHaveBeenCalled();
  });

  it('single-zone mode serves protected pages for an authenticated user', async () => {
    vi.stubEnv('VITE_SINGLE_ZONE', 'true');
    mockZone(true);
    localStorage.setItem('token', FAKE_JWT);

    renderApp(['/']);

    expect(await screen.findByText('Recent Transactions')).toBeInTheDocument();
    expect(screen.getByText(/Hello, A/)).toBeInTheDocument();
  });
});
