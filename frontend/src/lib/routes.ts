export const ADMIN_SUBDOMAIN_PREFIX = 'admin.';

// Single-zone deployments (e.g. a free Render/Vercel URL): no TLS certificate
// can be issued for `admin.<service>.onrender.com`, so the admin subdomain is
// unreachable. When VITE_SINGLE_ZONE=true the app collapses both zones onto
// the deployed origin — every hostname is treated as the admin zone and the
// origin helpers below become no-ops. The subdomain architecture stays intact
// for when a real domain is added (just unset the flag).
const SINGLE_ZONE = import.meta.env.VITE_SINGLE_ZONE === 'true';

/**
 * Returns true when the given hostname belongs to the admin zone
 * (e.g. `admin.bookkeeping.app` / `admin.localhost`).
 */
export function isAdminZone(hostname: string = window.location.hostname): boolean {
  return SINGLE_ZONE || hostname.toLowerCase().startsWith(ADMIN_SUBDOMAIN_PREFIX);
}

/**
 * Returns the apex origin (admin. subdomain stripped) preserving the port.
 * e.g. http://admin.localhost:5173 -> http://localhost:5173
 * Hostnames are case-insensitive (DNS), so they are normalized to lowercase.
 * In single-zone mode this is a no-op (everything runs at the deployed origin).
 */
export function getApexOrigin(origin: string = window.location.origin): string {
  if (SINGLE_ZONE) return origin;
  const url = new URL(origin);
  if (url.hostname.toLowerCase().startsWith(ADMIN_SUBDOMAIN_PREFIX)) {
    url.hostname = url.hostname.slice(ADMIN_SUBDOMAIN_PREFIX.length).toLowerCase();
  }
  return url.origin;
}

/**
 * Returns the admin origin (admin. subdomain prepended) preserving the port.
 * Idempotent — no-op when already on the admin subdomain.
 * Hostnames are case-insensitive (DNS), so they are normalized to lowercase.
 * In single-zone mode this is a no-op (everything runs at the deployed origin).
 */
export function getAdminOrigin(origin: string = window.location.origin): string {
  if (SINGLE_ZONE) return origin;
  const url = new URL(origin);
  if (!url.hostname.toLowerCase().startsWith(ADMIN_SUBDOMAIN_PREFIX)) {
    url.hostname = `${ADMIN_SUBDOMAIN_PREFIX}${url.hostname.toLowerCase()}`;
  }
  return url.origin;
}

/**
 * Absolute URL of the apex login page. Used for cross-origin redirects
 * from the admin zone (localStorage is per-origin, so the apex login page
 * must be a full page load).
 */
export function getLoginUrl(): string {
  return `${getApexOrigin()}/login`;
}

/**
 * Performs a full-page navigation. Used for cross-origin moves between the
 * admin and apex zones where react-router's <Navigate> (which treats string
 * targets as internal paths) cannot be used. Exposed as a seam so tests can
 * stub it — jsdom's window.location.replace is an unforgeable property.
 */
export function replaceLocation(url: string): void {
  window.location.replace(url);
}
