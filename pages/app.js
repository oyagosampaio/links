import { useState } from 'react';
import Head from 'next/head';
import AppHeader, { Toast, useToast } from '../components/AppHeader';
import LinkManager from '../components/LinkManager';
import { getPageAuth, loginRedirect, publicTenant, tenantHasAccess } from '../lib/auth';

export default function AppPage({ tenant }) {
  const { toast, showToast } = useToast();
  const [linkCount, setLinkCount] = useState(0);

  async function openPortal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) {
      showToast(body.error || 'Portal indisponível', 'error');
      return;
    }
    window.location.href = body.url;
  }

  return (
    <>
      <Head><title>Meus links — Oryon Links</title></Head>
      <AppHeader tenant={tenant} current="links" linkCount={linkCount} />
      <main className="page">
        <div className="section-head" style={{ marginBottom: 24 }}>
          <div>
            <h1>Gerenciador de <span>Links</span></h1>
            <p className="subtitle" style={{ marginBottom: 0 }}>Crie e edite redirecionamentos. Slugs não se repetem na plataforma.</p>
          </div>
          {tenant.hasStripe && (
            <button className="ghost" type="button" onClick={openPortal}>Gerenciar assinatura</button>
          )}
        </div>
        <LinkManager showToast={showToast} onCount={setLinkCount} />
      </main>
      <Toast toast={toast} />
    </>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (!user || !tenant) return loginRedirect('/app');
  if (tenant.role === 'admin') {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  if (!tenantHasAccess(tenant)) {
    return { redirect: { destination: '/assinar', permanent: false } };
  }
  return { props: { tenant: publicTenant(tenant) } };
}
