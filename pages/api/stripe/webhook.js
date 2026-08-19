import { getStripe } from '../../../lib/stripe';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { mapStripeStatus, subscriptionPeriodEnd } from '../../../lib/access';
import { sendAccessEmailSafe } from '../../../lib/email';

export const config = {
  api: { bodyParser: false },
};

function stripeId(value) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.id;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function findTenant(admin, { userId, tenantId, customerId, subscriptionId }) {
  if (tenantId) {
    const { data } = await admin.from('tenants').select('*').eq('id', tenantId).maybeSingle();
    if (data) return data;
  }
  if (userId) {
    const { data } = await admin.from('tenants').select('*').eq('user_id', userId).maybeSingle();
    if (data) return data;
  }
  if (customerId) {
    const { data } = await admin.from('tenants').select('*').eq('stripe_customer_id', customerId).maybeSingle();
    if (data) return data;
  }
  if (subscriptionId) {
    const { data } = await admin.from('tenants').select('*').eq('stripe_subscription_id', subscriptionId).maybeSingle();
    if (data) return data;
  }
  return null;
}

async function applySubscription(admin, tenant, subscription, extra = {}) {
  const customerId =
    typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer?.id;

  const { error } = await admin
    .from('tenants')
    .update({
      stripe_customer_id: customerId || tenant.stripe_customer_id,
      stripe_subscription_id: subscription.id,
      plan_status: mapStripeStatus(subscription.status),
      access_type: 'subscription',
      current_period_end: subscriptionPeriodEnd(subscription),
      ...extra,
    })
    .eq('id', tenant.id);

  if (error) throw error;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhook não configurado' });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return res.status(503).json({ error: 'Supabase não configurado' });

  let event;
  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature:', error.message);
    return res.status(400).json({ error: 'Assinatura inválida' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const subscriptionId = stripeId(session.subscription);
        if (!subscriptionId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenant = await findTenant(admin, {
          userId: session.client_reference_id || session.metadata?.user_id,
          tenantId: session.metadata?.tenant_id,
          customerId: stripeId(session.customer),
          subscriptionId,
        });
        if (!tenant) {
          console.error('Webhook checkout: tenant não encontrado', session.id);
          break;
        }
        await applySubscription(admin, tenant, subscription, {
          stripe_customer_id: stripeId(session.customer),
        });
        await sendAccessEmailSafe({
          to: tenant.email,
          name: tenant.name,
        });
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const tenant = await findTenant(admin, {
          userId: subscription.metadata?.user_id,
          tenantId: subscription.metadata?.tenant_id,
          customerId: stripeId(subscription.customer),
          subscriptionId: subscription.id,
        });
        if (!tenant) {
          console.error('Webhook subscription: tenant não encontrado', subscription.id);
          break;
        }
        await applySubscription(admin, tenant, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const invoiceSubId = stripeId(invoice.subscription);
        if (!invoiceSubId) break;
        const subscription = await stripe.subscriptions.retrieve(invoiceSubId);
        const tenant = await findTenant(admin, {
          customerId: stripeId(invoice.customer),
          subscriptionId: invoiceSubId,
          userId: subscription.metadata?.user_id,
          tenantId: subscription.metadata?.tenant_id,
        });
        if (!tenant) break;
        await applySubscription(admin, tenant, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const tenant = await findTenant(admin, {
          customerId: stripeId(invoice.customer),
          subscriptionId: stripeId(invoice.subscription),
        });
        if (!tenant) break;
        await admin
          .from('tenants')
          .update({ plan_status: 'past_due' })
          .eq('id', tenant.id);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler:', error);
    return res.status(500).json({ error: 'Falha ao processar webhook' });
  }
}
