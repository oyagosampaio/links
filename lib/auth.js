import { getSupabaseAdmin } from './supabaseAdmin';
import { createPagesServerClient } from './supabaseServer';
import { tenantHasAccess, publicTenant } from './access';

function isAdminEmail(email) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  return email.toLowerCase() === adminEmail.toLowerCase();
}

export async function ensureTenant(admin, user) {
  if (!admin || !user) return null;

  const { data: existing, error } = await admin
    .from('tenants')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;

  const adminUser = isAdminEmail(user.email);

  if (!existing) {
    const { data, error: insertError } = await admin
      .from('tenants')
      .insert({
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email.split('@')[0],
        role: adminUser ? 'admin' : 'subscriber',
        plan_status: adminUser ? 'active' : 'inactive',
        access_type: adminUser ? 'manual' : 'none',
      })
      .select('*')
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        const { data: raced } = await admin
          .from('tenants')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        return raced;
      }
      throw insertError;
    }
    return data;
  }

  if (adminUser && existing.role !== 'admin') {
    const { data, error: updateError } = await admin
      .from('tenants')
      .update({
        role: 'admin',
        plan_status: 'active',
        access_type: existing.access_type === 'none' ? 'manual' : existing.access_type,
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (updateError) throw updateError;
    return data;
  }

  return existing;
}

export async function getRequestAuth(req, res) {
  const supabase = createPagesServerClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, tenant: null, supabase };

  const admin = getSupabaseAdmin();
  if (!admin) return { user, tenant: null, supabase };

  const tenant = await ensureTenant(admin, user);
  return { user, tenant, supabase };
}

export async function requireUser(req, res) {
  const ctx = await getRequestAuth(req, res);
  if (!ctx.user || !ctx.tenant) {
    res.status(401).json({ error: 'Não autenticado' });
    return null;
  }
  return ctx;
}

export async function requireActiveAccess(req, res) {
  const ctx = await requireUser(req, res);
  if (!ctx) return null;
  if (!tenantHasAccess(ctx.tenant)) {
    res.status(402).json({ error: 'Assinatura inativa', code: 'payment_required' });
    return null;
  }
  return ctx;
}

export async function requireAdmin(req, res) {
  const ctx = await requireUser(req, res);
  if (!ctx) return null;
  if (ctx.tenant.role !== 'admin') {
    res.status(403).json({ error: 'Acesso restrito ao administrador' });
    return null;
  }
  return ctx;
}

export async function getPageAuth(context) {
  return getRequestAuth(context.req, context.res);
}

export function loginRedirect(from = '') {
  const dest = from ? `/login?next=${encodeURIComponent(from)}` : '/login';
  return { redirect: { destination: dest, permanent: false } };
}

export function accessRedirect(tenant) {
  if (!tenant) return loginRedirect();
  if (tenant.role === 'admin') {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  if (tenantHasAccess(tenant)) {
    return { redirect: { destination: '/app', permanent: false } };
  }
  return { redirect: { destination: '/assinar', permanent: false } };
}

export { tenantHasAccess, publicTenant };
