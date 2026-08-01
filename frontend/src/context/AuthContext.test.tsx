import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { isAdminZone } from '../lib/routes';

// The apex zone must never persist a JWT, so the hash handoff is gated on
// isAdminZone(). We control the zone per-test through the mock (jsdom's
// window.location.hostname is non-configurable).
vi.mock('../lib/routes', () => ({
  ADMIN_SUBDOMAIN_PREFIX: 'admin.',
  isAdminZone: vi.fn(),
  getApexOrigin: vi.fn(),
  getAdminOrigin: vi.fn(),
  getLoginUrl: vi.fn(),
}));

const PAYLOAD = { sub: 'u1', email: 'a@b.c', firstName: 'A', lastName: 'B' };
const FAKE_JWT = `header.${btoa(JSON.stringify(PAYLOAD))}.sig`;

function Probe() {
  const { isAuthenticated, user } = useAuth();
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
    </div>
  );
}

describe('AuthProvider hash-token handoff', () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = '';
    (isAdminZone as Mock).mockReturnValue(false); // apex zone by default
  });

  afterEach(() => {
    localStorage.clear();
    window.location.hash = '';
    vi.clearAllMocks();
  });

  it('stores a #token= hash JWT in localStorage and strips the hash (admin zone)', async () => {
    (isAdminZone as Mock).mockReturnValue(true);
    window.location.hash = `#token=${FAKE_JWT}`;

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(localStorage.getItem('token')).toBe(FAKE_JWT));
    expect(window.location.hash).toBe('');
    expect(await screen.findByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.c');
  });

  it('fresh #token= handoff overwrites an existing stored token (admin zone)', async () => {
    // Regression: a fresh cross-origin handoff token must always win, even
    // when localStorage already holds an older (possibly expired) token.
    (isAdminZone as Mock).mockReturnValue(true);
    const OLD_JWT = `header.${btoa(JSON.stringify({ sub: 'u0', email: 'old@b.c', firstName: 'Old', lastName: 'User' }))}.sig`;
    localStorage.setItem('token', OLD_JWT);
    window.location.hash = `#token=${FAKE_JWT}`;

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    await waitFor(() => expect(localStorage.getItem('token')).toBe(FAKE_JWT));
    expect(window.location.hash).toBe('');
    expect(await screen.findByTestId('authed')).toHaveTextContent('true');
    expect(screen.getByTestId('email')).toHaveTextContent('a@b.c');
    expect(screen.getByTestId('email')).not.toHaveTextContent('old@b.c');
  });

  it('purges a pre-existing token on the apex zone (apex is strictly stateless)', async () => {
    // The apex zone must never hold a session: any token left over from a
    // previous admin-zone visit is actively purged on mount.
    localStorage.setItem('token', FAKE_JWT);

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authed')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('email')).toHaveTextContent('none');
    expect(window.location.hash).toBe('');
  });

  it('does not persist a token when there is no hash and no stored token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authed')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('clears an unparseable hash token (admin zone)', async () => {
    (isAdminZone as Mock).mockReturnValue(true);
    window.location.hash = '#token=not-a-valid-jwt';

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authed')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('survives a malformed percent-encoded #token hash without persisting it', async () => {
    // decodeURIComponent('%E0%A4%A') throws URIError; the provider must not
    // crash the app (it renders above ErrorBoundary) and must still strip
    // the hash while leaving localStorage empty.
    window.location.hash = '#token=%E0%A4%A';

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authed')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('');
  });

  it('never persists a #token hash on the apex zone', async () => {
    window.location.hash = `#token=${FAKE_JWT}`;

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByTestId('authed')).toHaveTextContent('false');
    expect(localStorage.getItem('token')).toBeNull();
    expect(window.location.hash).toBe('');
  });
});
