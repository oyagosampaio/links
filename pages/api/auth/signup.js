import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { ensureTenant } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Senha deve ter no mínimo 6 caracteres' });
    }

    const admin = getSupabaseAdmin();
    if (!admin) return res.status(503).json({ error: 'Serviço indisponível no momento' });

    const { data: existingId } = await admin.rpc('get_user_id_by_email', { p_email: email });
    if (existingId) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado. Entre na sua conta.' });
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || email.split('@')[0] },
    });
    if (error) throw error;

    await ensureTenant(admin, data.user);
    return res.status(201).json({ ok: true });
  } catch (error) {
    console.error('Erro em /api/auth/signup:', error);
    return res.status(500).json({
      error: error.message || 'Não foi possível criar a conta',
    });
  }
}
