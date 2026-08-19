import { requireUser } from '../../../lib/auth';
import { getStripe, appUrl } from '../../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Pagamento indisponível no momento' });

    const ctx = await requireUser(req, res);
    if (!ctx) return;

    let customerId = ctx.tenant.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ error: 'Nenhuma assinatura encontrada' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl()}/app`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erro em /api/stripe/portal:', error);
    return res.status(500).json({
      error: 'Não foi possível abrir o gerenciamento da assinatura',
      details: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
