import { getSupabaseAdmin, rowToTenant } from '../../../lib/supabaseAdmin';
import { requireAdmin } from '../../../lib/auth';

const ACCESS_TYPES = ['subscription', 'courtesy', 'tester', 'manual'];
const PLAN_STATUSES = ['active', 'inactive', 'trialing', 'canceled', 'past_due'];

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function resolveUserId(admin, email, password, name) {
  const { data: existingId } = await admin.rpc('get_user_id_by_email', { p_email: email });
  if (existingId) {
    if (password) {
      const { error } = await admin.auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        user_metadata: name ? { name } : undefined,
      });
      if (error) throw error;
    }
    return existingId;
  }

  if (!password || String(password).length < 6) {
    const err = new Error('Senha obrigatória (mínimo 6 caracteres) para novo usuário');
    err.status = 400;
    throw err;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || email.split('@')[0] },
  });
  if (error) throw error;
  return data.user.id;
}

async function upsertTenant(admin, { userId, email, name, accessType, planStatus, periodEnd, notes }) {
  const { data: existing } = await admin
    .from('tenants')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const payload = {
    user_id: userId,
    email,
    name: name || existing?.name || email.split('@')[0],
    role: existing?.role === 'admin' ? 'admin' : 'subscriber',
    access_type: accessType,
    plan_status: planStatus,
    current_period_end: periodEnd,
    notes: notes ?? existing?.notes ?? '',
  };

  if (existing) {
    const { data, error } = await admin
      .from('tenants')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await admin.from('tenants').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

function parsePeriodEnd(value) {
  if (value === null || value === '') return null;
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const err = new Error('Data de validade inválida');
    err.status = 400;
    throw err;
  }
  return date.toISOString();
}

export default async function handler(req, res) {
  try {
    const ctx = await requireAdmin(req, res);
    if (!ctx) return;

    const admin = getSupabaseAdmin();
    if (!admin) return res.status(503).json({ error: 'Supabase não configurado' });

    if (req.method === 'GET') {
      const { data, error } = await admin
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const { data: linkRows } = await admin.from('links').select('tenant_id');
      const counts = {};
      (linkRows || []).forEach((row) => {
        if (!row.tenant_id) return;
        counts[row.tenant_id] = (counts[row.tenant_id] || 0) + 1;
      });

      const rows = (data || []).map((row) =>
        rowToTenant({
          ...row,
          links_count: counts[row.id] || 0,
        })
      );
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const email = normalizeEmail(req.body?.email);
      const password = req.body?.password ? String(req.body.password) : '';
      const name = String(req.body?.name || '').trim();
      const accessType = String(req.body?.accessType || 'courtesy');
      const planStatus = String(req.body?.planStatus || 'active');
      const notes = String(req.body?.notes || '').trim();
      const periodEnd = parsePeriodEnd(req.body?.currentPeriodEnd ?? null);

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'E-mail inválido' });
      }
      if (!ACCESS_TYPES.includes(accessType)) {
        return res.status(400).json({ error: 'Tipo de acesso inválido' });
      }
      if (!PLAN_STATUSES.includes(planStatus)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      const userId = await resolveUserId(admin, email, password, name);
      const tenant = await upsertTenant(admin, {
        userId,
        email,
        name,
        accessType,
        planStatus,
        periodEnd: periodEnd === undefined ? null : periodEnd,
        notes,
      });
      return res.status(201).json(rowToTenant(tenant));
    }

    if (req.method === 'PATCH') {
      const id = req.body?.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });

      const { data: existing, error: findError } = await admin
        .from('tenants')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (findError) throw findError;
      if (!existing) return res.status(404).json({ error: 'Assinante não encontrado' });
      if (existing.role === 'admin' && existing.id === ctx.tenant.id && req.body?.planStatus === 'inactive') {
        return res.status(400).json({ error: 'Você não pode desativar o próprio acesso de admin' });
      }

      const patch = {};
      if (req.body?.name !== undefined) patch.name = String(req.body.name).trim();
      if (req.body?.notes !== undefined) patch.notes = String(req.body.notes).trim();
      if (req.body?.accessType) {
        if (!ACCESS_TYPES.includes(req.body.accessType)) {
          return res.status(400).json({ error: 'Tipo de acesso inválido' });
        }
        patch.access_type = req.body.accessType;
      }
      if (req.body?.planStatus) {
        if (!PLAN_STATUSES.includes(req.body.planStatus)) {
          return res.status(400).json({ error: 'Status inválido' });
        }
        patch.plan_status = req.body.planStatus;
      }
      if (req.body?.currentPeriodEnd !== undefined) {
        patch.current_period_end = parsePeriodEnd(req.body.currentPeriodEnd);
      }

      if (req.body?.password) {
        if (String(req.body.password).length < 6) {
          return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
        }
        const { error } = await admin.auth.admin.updateUserById(existing.user_id, {
          password: String(req.body.password),
        });
        if (error) throw error;
      }

      const { data, error } = await admin
        .from('tenants')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return res.status(200).json(rowToTenant(data));
    }

    if (req.method === 'DELETE') {
      const id = req.body?.id;
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });
      if (id === ctx.tenant.id) {
        return res.status(400).json({ error: 'Você não pode revogar o próprio acesso' });
      }

      const { data, error } = await admin
        .from('tenants')
        .update({
          plan_status: 'inactive',
          access_type: 'none',
          current_period_end: null,
        })
        .eq('id', id)
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Assinante não encontrado' });
      return res.status(200).json(rowToTenant(data));
    }

    return res.status(405).end();
  } catch (error) {
    const status = error.status || 500;
    console.error('Erro em /api/admin/subscribers:', error);
    return res.status(status).json({
      error: error.message || 'Erro interno',
    });
  }
}
