import { getSupabaseAdmin } from '../../lib/supabaseAdmin';
import { appUrl } from '../../lib/stripe';
import { sendPasswordResetEmail } from '../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Informe um e-mail válido' });
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) {
      return res.status(503).json({ error: 'Não foi possível enviar o e-mail agora' });
    }

    const { data: userId } = await admin.rpc('get_user_id_by_email', { p_email: email });
    if (userId) {
      const { data, error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
      });
      if (error) throw error;

      const tokenHash = data?.properties?.hashed_token;
      if (!tokenHash) throw new Error('Não foi possível gerar o link de recuperação');

      const resetUrl = `${appUrl()}/recuperar?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;
      await sendPasswordResetEmail({ to: email, resetUrl });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Erro em /api/auth/forgot-password:', error);
    return res.status(500).json({ error: 'Não foi possível enviar o e-mail agora' });
  }
}
