import { z } from 'zod';
import type { Role } from '../types/domain';
import { demoAdapter } from './persistence';
import { SettingsService } from './admin';
export const adminSessionKey = 'gamma-admin-demo-session-v1';
export const adminSessionEvent = 'gamma-admin-session-changed';
export const demoAccounts: { email: string; role: Role }[] = [
  { email: 'admin@gamma.demo', role: 'Administrador' },
  { email: 'operador@gamma.demo', role: 'Operador' },
  { email: 'financeiro@gamma.demo', role: 'Financeiro' },
];
const sessionSchema = z.object({
  email: z.string(),
  expires: z.number().finite(),
  version: z.literal(1),
});
export type AdminSession = z.infer<typeof sessionSchema>;
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.')),
  password: z.string().min(1, 'Informe a senha.'),
});
export function readAdminSession(): AdminSession | null {
  try {
    const parsed = sessionSchema.safeParse(
      JSON.parse(localStorage.getItem(adminSessionKey) || 'null'),
    );
    return parsed.success &&
      parsed.data.expires > Date.now() &&
      demoAccounts.some((a) => a.email === parsed.data.email)
      ? parsed.data
      : null;
  } catch {
    return null;
  }
}
export function closeAdminSession() {
  localStorage.removeItem(adminSessionKey);
  window.dispatchEvent(new Event(adminSessionEvent));
}
export async function signInAdmin(values: z.infer<typeof loginSchema>) {
  const input = loginSchema.parse(values);
  const account = demoAccounts.find((a) => a.email === input.email);
  if (!account || input.password !== 'Gamma@123')
    throw new Error('E-mail ou senha de demonstração inválidos.');
  const db = await demoAdapter.read();
  await SettingsService.switchRole({ creditorId: '', role: db.settings.role }, account.role);
  const session: AdminSession = {
    email: account.email,
    expires: Date.now() + 8 * 60 * 60 * 1000,
    version: 1,
  };
  try {
    localStorage.setItem(adminSessionKey, JSON.stringify(session));
  } catch {
    throw new Error(
      'Não foi possível abrir a sessão. Habilite o armazenamento do navegador e tente novamente.',
    );
  }
  window.dispatchEvent(new Event(adminSessionEvent));
  return session;
}
export function adminReturnPath(from: unknown) {
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//') ||
    from.includes('\\')
  )
    return '/';
  const url = new URL(from, 'https://gamma.invalid');
  return url.origin === 'https://gamma.invalid' &&
    /^\/(?:$|(?:empresas|carteiras|devedores|conversas|cobranca|negociacoes|acordos|financeiro|campanhas|relatorios|configuracoes)(?:\/|$))/.test(
      url.pathname,
    )
    ? url.pathname + url.search + url.hash
    : '/';
}
