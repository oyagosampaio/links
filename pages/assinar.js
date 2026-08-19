import { useState } from 'react';
import Head from 'next/head';
import { getPageAuth, loginRedirect, accessRedirect, publicTenant, tenantHasAccess } from '../lib/auth';

export default function Assinar({ canceled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function checkout() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok || !body.url) {
      setError(body.error || 'Não foi possível iniciar o pagamento');
      return;
    }
    window.location.href = body.url;
  }

  return (
    <div className="paywall">
      <Head><title>Assinar — Oryon Links</title></Head>
      <h1>Libere seu painel</h1>
      <p className="subtitle">Assinatura mensal de R$ 9,90. Acesso único por conta, dados isolados.</p>
      <div className="card">
        {canceled && <div className="error-box">Pagamento cancelado. Você pode tentar de novo quando quiser.</div>}
        {error && <div className="error-box">{error}</div>}
        <div className="amount" style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          R$ 9,90 <small style={{ fontSize: 16, color: 'var(--text-secondary)', fontWeight: 500 }}>/mês</small>
        </div>
        <ul className="features">
          <li>Links ilimitados no seu painel</li>
          <li>Slug único em toda a plataforma</li>
          <li>Edição e exclusão a qualquer momento</li>
        </ul>
        <button className="btn-primary" onClick={checkout} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
          {loading ? 'Abrindo pagamento...' : 'Assinar agora'}
        </button>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (!user || !tenant) return loginRedirect('/assinar');
  if (tenantHasAccess(tenant)) return accessRedirect(tenant);
  return {
    props: {
      tenant: publicTenant(tenant),
      canceled: context.query.canceled === '1',
    },
  };
}
