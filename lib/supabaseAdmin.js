import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function rowToLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    slug: row.slug,
    dest: row.dest,
    desc: row.desc ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToTenant(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    role: row.role,
    planStatus: row.plan_status,
    accessType: row.access_type,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    currentPeriodEnd: row.current_period_end,
    notes: row.notes ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    linksCount: row.links_count ?? 0,
  };
}
