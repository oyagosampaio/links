import { useState } from 'react';
import Head from 'next/head';
import AppHeader, { Toast, useToast } from '../components/AppHeader';
import LinkManager from '../components/LinkManager';
import SubscribersPanel from '../components/SubscribersPanel';
import { getPageAuth, loginRedirect, publicTenant } from '../lib/auth';

export default function AdminPage({ tenant, initialTab }) {
  const { toast, showToast } = useToast();
  const [linkCount, setLinkCount] = useState(0);
  const tab = initialTab === 'assinantes' ? 'subscribers' : 'links';

  return (
    <>
      <Head><title>Admin — Oryon Links</title></Head>
      <AppHeader tenant={tenant} current={tab} linkCount={tab === 'links' ? linkCount : undefined} />
      <main className="page">
        {tab === 'links' ? (
          <>
            <h1>Gerenciador de <span>Links</span></h1>
            <p className="subtitle">Seus links de admin. Slugs são únicos entre todos os usuários.</p>
            <LinkManager showToast={showToast} onCount={setLinkCount} />
          </>
        ) : (
          <>
            <h1>Assinantes</h1>
            <p className="subtitle">Veja quem pagou, libere cortesias, testers e acessos manuais.</p>
            <SubscribersPanel showToast={showToast} />
          </>
        )}
      </main>
      <Toast toast={toast} />
    </>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (!user || !tenant) return loginRedirect('/admin');
  if (tenant.role !== 'admin') {
    return { redirect: { destination: '/app', permanent: false } };
  }
  return {
    props: {
      tenant: publicTenant(tenant),
      initialTab: context.query.tab === 'assinantes' ? 'assinantes' : 'links',
    },
  };
}
