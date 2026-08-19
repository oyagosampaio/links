export function tenantHasAccess(tenant) {
  if (!tenant) return false;
  if (tenant.role === 'admin') return true;
  if (!['active', 'trialing'].includes(tenant.plan_status)) return false;
  if (tenant.current_period_end && new Date(tenant.current_period_end) < new Date()) {
    return false;
  }
  return true;
}

export function mapStripeStatus(status) {
  const map = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    incomplete: 'inactive',
    incomplete_expired: 'canceled',
    paused: 'inactive',
  };
  return map[status] || 'inactive';
}

export function subscriptionPeriodEnd(subscription) {
  const ts =
    subscription?.current_period_end ??
    subscription?.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export function publicTenant(tenant) {
  if (!tenant) return null;
  return {
    id: tenant.id,
    email: tenant.email,
    name: tenant.name,
    role: tenant.role,
    planStatus: tenant.plan_status,
    accessType: tenant.access_type,
    currentPeriodEnd: tenant.current_period_end,
    hasAccess: tenantHasAccess(tenant),
    hasStripe: Boolean(tenant.stripe_customer_id),
  };
}
