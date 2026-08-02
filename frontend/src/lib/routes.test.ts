import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  ADMIN_SUBDOMAIN_PREFIX,
  getAdminOrigin,
  getApexOrigin,
  getLoginUrl,
  isAdminZone,
} from './routes';

describe('routes zone helpers', () => {
  it('isAdminZone detects the admin subdomain prefix', () => {
    expect(isAdminZone('admin.localhost')).toBe(true);
    expect(isAdminZone('localhost')).toBe(false);
    expect(isAdminZone('notadmin.localhost')).toBe(false);
  });

  it('isAdminZone defaults to window.location.hostname', () => {
    expect(isAdminZone()).toBe(isAdminZone(window.location.hostname));
  });

  it('isAdminZone is case-insensitive (DNS hostnames are case-insensitive)', () => {
    expect(isAdminZone('ADMIN.LOCALHOST')).toBe(true);
    expect(isAdminZone('Admin.Localhost')).toBe(true);
    expect(isAdminZone('ADMIN.BOOKKEEPING.APP')).toBe(true);
    expect(isAdminZone('LOCALHOST')).toBe(false);
  });

  it('getApexOrigin strips the admin. prefix and preserves the port', () => {
    expect(getApexOrigin('http://admin.localhost:5173')).toBe('http://localhost:5173');
    expect(getApexOrigin('https://admin.bookkeeping.app')).toBe('https://bookkeeping.app');
  });

  it('getApexOrigin is a no-op for a non-admin origin', () => {
    expect(getApexOrigin('http://localhost:5173')).toBe('http://localhost:5173');
  });

  it('getApexOrigin normalizes uppercase admin hostnames to lowercase apex', () => {
    expect(getApexOrigin('http://ADMIN.LOCALHOST:5173')).toBe('http://localhost:5173');
    expect(getApexOrigin('https://ADMIN.BOOKKEEPING.APP')).toBe('https://bookkeeping.app');
  });

  it('getAdminOrigin normalizes uppercase apex hostnames to lowercase admin', () => {
    expect(getAdminOrigin('http://LOCALHOST:5173')).toBe('http://admin.localhost:5173');
  });

  it('uppercase hostnames round-trip through the apex/admin helpers', () => {
    expect(getApexOrigin(getAdminOrigin('http://LOCALHOST:5173'))).toBe('http://localhost:5173');
    expect(getAdminOrigin(getApexOrigin('http://ADMIN.LOCALHOST:5173'))).toBe('http://admin.localhost:5173');
  });

  it('getAdminOrigin prepends admin. and preserves the port', () => {
    expect(getAdminOrigin('http://localhost:5173')).toBe('http://admin.localhost:5173');
    expect(getAdminOrigin('https://bookkeeping.app')).toBe('https://admin.bookkeeping.app');
  });

  it('getAdminOrigin is idempotent when already on the admin subdomain', () => {
    expect(getAdminOrigin('http://admin.localhost:5173')).toBe('http://admin.localhost:5173');
  });

  it('ADMIN_SUBDOMAIN_PREFIX is "admin."', () => {
    expect(ADMIN_SUBDOMAIN_PREFIX).toBe('admin.');
  });

  it('getLoginUrl targets the apex login page', () => {
    expect(getLoginUrl()).toBe(`${getApexOrigin()}/login`);
  });
});

describe('routes zone helpers — single-zone mode (VITE_SINGLE_ZONE=true)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // The flag is read at module evaluation, so the module must be re-imported
  // after stubbing the env var for the assertions to see it.
  async function loadSingleZone() {
    vi.stubEnv('VITE_SINGLE_ZONE', 'true');
    vi.resetModules();
    return await import('./routes');
  }

  it('isAdminZone treats every hostname as the admin zone', async () => {
    const mod = await loadSingleZone();
    expect(mod.isAdminZone('localhost')).toBe(true);
    expect(mod.isAdminZone('bookkeeping-frontend-scey.onrender.com')).toBe(true);
  });

  it('origin helpers are no-ops (everything runs at the deployed origin)', async () => {
    const mod = await loadSingleZone();
    const origin = 'https://bookkeeping-frontend-scey.onrender.com';
    expect(mod.getApexOrigin(origin)).toBe(origin);
    expect(mod.getAdminOrigin(origin)).toBe(origin);
    expect(mod.getAdminOrigin('http://localhost:5173')).toBe('http://localhost:5173');
    expect(mod.getApexOrigin('http://admin.localhost:5173')).toBe('http://admin.localhost:5173');
  });

  it('getLoginUrl stays on the same origin', async () => {
    const mod = await loadSingleZone();
    expect(mod.getLoginUrl()).toBe(`${window.location.origin}/login`);
  });
});
