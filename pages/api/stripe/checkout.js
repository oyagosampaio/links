import { requireUser, tenantHasAccess } from '../../../lib/auth';
import { getStripe, appUrl } from '../../../lib/stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const stripe = getStripe();
    if (!stripe || !process.env.STRIPE_PRICE_ID) {
      return res.status(503).json({ error: 'Stripe não configurado' });
    }

    const ctx = await requireUser(req, res);
    if (!ctx) return;

    if (ctx.tenant.role === 'admin') {
      return res.status(400).json({ error: 'Administradores não precisam assinar' });
    }

    if (tenantHasAccess(ctx.tenant) && ctx.tenant.plan_status !== 'past_due') {
      return res.status(400).json({ error: 'Você já tem acesso ativo' });
    }

    const origin = appUrl();
    const params = {
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assinar?canceled=1`,
      client_reference_id: ctx.user.id,
      metadata: {
        user_id: ctx.user.id,
        tenant_id: ctx.tenant.id,
      },
      subscription_data: {
        metadata: {
          user_id: ctx.user.id,
          tenant_id: ctx.tenant.id,
        },
      },
      allow_promotion_codes: true,
    };

    if (ctx.tenant.stripe_customer_id) {
      params.customer = ctx.tenant.stripe_customer_id;
    } else {
      params.customer_email = ctx.user.email;
    }

    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Erro em /api/stripe/checkout:', error);
    return res.status(500).json({
      error: 'Não foi possível iniciar o pagamento',
      details: error instanceof Error ? error.message : 'unknown_error',
    });
  }
}
