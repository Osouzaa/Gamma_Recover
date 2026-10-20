import { z } from 'zod';
const key = 'gamma-portal-demo-session';
const schema = z.object({ debtorId: z.string(), expires: z.number() });
export function portalSession() {
  try {
    const parsed = schema.safeParse(JSON.parse(sessionStorage.getItem(key) || 'null'));
    return parsed.success && parsed.data.expires > Date.now() ? parsed.data.debtorId : '';
  } catch {
    return '';
  }
}
export function openPortalSession(debtorId: string) {
  sessionStorage.setItem(key, JSON.stringify({ debtorId, expires: Date.now() + 30 * 60 * 1000 }));
}
export function closePortalSession() {
  sessionStorage.removeItem(key);
}

export function portalRemaining() {
  try {
    const parsed = schema.safeParse(JSON.parse(sessionStorage.getItem(key) || 'null'));
    return parsed.success ? Math.max(0, parsed.data.expires - Date.now()) : 0;
  } catch {
    return 0;
  }
}
