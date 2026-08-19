import { getPageAuth, publicTenant, tenantHasAccess } from '../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  try {
    const { user, tenant } = await getPageAuth({ req, res });
    if (!user || !tenant) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    return res.status(200).json({
      email: user.email,
      tenant: publicTenant(tenant),
      hasAccess: tenantHasAccess(tenant),
    });
  } catch (error) {
    console.error('Erro em /api/me:', error);
    return res.status(500).json({ error: 'Erro ao carregar sessão' });
  }
}
