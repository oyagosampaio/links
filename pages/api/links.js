import { getSupabaseAdmin, rowToLink } from '../../lib/supabaseAdmin';
import { requireActiveAccess } from '../../lib/auth';
import { normalizeSlug, slugError } from '../../lib/reservedSlugs';

const LINK_COLUMNS = 'id,tenant_id,name,slug,dest,desc,created_at,updated_at';

function validateDest(dest) {
  if (!dest || !/^https?:\/\//i.test(dest)) {
    return 'Destino deve começar com http:// ou https://';
  }
  return null;
}

async function slugTaken(admin, slug, excludeId) {
  let query = admin.from('links').select('id').eq('slug', slug);
  if (excludeId) query = query.neq('id', Number(excludeId));
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export default async function handler(req, res) {
  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return res.status(503).json({ error: 'Supabase não configurado' });
    }

    const ctx = await requireActiveAccess(req, res);
    if (!ctx) return;

    if (req.method === 'GET') {
      const { data, error } = await admin
        .from('links')
        .select(LINK_COLUMNS)
        .eq('tenant_id', ctx.tenant.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json((data || []).map(rowToLink));
    }

    if (req.method === 'POST') {
      const name = String(req.body?.name || '').trim();
      const dest = String(req.body?.dest || '').trim();
      const desc = String(req.body?.desc || '').trim();
      const slug = normalizeSlug(req.body?.slug);

      if (!name || !slug || !dest) {
        return res.status(400).json({ error: 'name, slug e dest são obrigatórios' });
      }
      const sErr = slugError(slug);
      if (sErr) return res.status(400).json({ error: sErr });
      const dErr = validateDest(dest);
      if (dErr) return res.status(400).json({ error: dErr });
      if (await slugTaken(admin, slug)) {
        return res.status(409).json({ error: 'Este slug já está em uso na plataforma' });
      }

      const { data, error } = await admin
        .from('links')
        .insert({
          tenant_id: ctx.tenant.id,
          name,
          slug,
          dest,
          desc,
        })
        .select(LINK_COLUMNS)
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Este slug já está em uso na plataforma' });
        }
        throw error;
      }
      return res.status(201).json(rowToLink(data));
    }

    if (req.method === 'PUT') {
      const id = Number(req.body?.id);
      const name = String(req.body?.name || '').trim();
      const dest = String(req.body?.dest || '').trim();
      const desc = String(req.body?.desc || '').trim();
      const slug = normalizeSlug(req.body?.slug);

      if (!id || !name || !slug || !dest) {
        return res.status(400).json({ error: 'id, name, slug e dest são obrigatórios' });
      }
      const sErr = slugError(slug);
      if (sErr) return res.status(400).json({ error: sErr });
      const dErr = validateDest(dest);
      if (dErr) return res.status(400).json({ error: dErr });
      if (await slugTaken(admin, slug, id)) {
        return res.status(409).json({ error: 'Este slug já está em uso na plataforma' });
      }

      const { data, error } = await admin
        .from('links')
        .update({ name, slug, dest, desc })
        .eq('id', id)
        .eq('tenant_id', ctx.tenant.id)
        .select(LINK_COLUMNS)
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'Este slug já está em uso na plataforma' });
        }
        throw error;
      }
      if (!data) return res.status(404).json({ error: 'Link não encontrado' });
      return res.status(200).json(rowToLink(data));
    }

    if (req.method === 'DELETE') {
      const id = Number(req.body?.id);
      if (!id) return res.status(400).json({ error: 'id é obrigatório' });

      const { data, error } = await admin
        .from('links')
        .delete()
        .eq('id', id)
        .eq('tenant_id', ctx.tenant.id)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Link não encontrado' });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (error) {
    console.error('Erro em /api/links:', error);
    return res.status(500).json({
      error: 'Erro interno ao salvar links',
      details: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
