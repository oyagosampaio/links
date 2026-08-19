export const RESERVED_SLUGS = new Set([
  'admin',
  'app',
  'login',
  'signup',
  'assinar',
  'sucesso',
  'cancelado',
  'recuperar',
  'api',
  'auth',
  'account',
  'settings',
  'pricing',
  'dashboard',
  'webhook',
  'index',
  'home',
  'www',
  'static',
  'favicon',
  'robots',
  'sitemap',
  'billing',
  'checkout',
  'stripe',
]);

export function normalizeSlug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isValidSlug(slug) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function slugError(slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return 'Slug é obrigatório';
  if (RESERVED_SLUGS.has(normalized)) return 'Este slug é reservado pelo sistema';
  if (!isValidSlug(normalized)) return 'Slug inválido. Use letras, números e hífens';
  return null;
}
