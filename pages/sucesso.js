import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getPageAuth, loginRedirect, publicTenant } from '../lib/auth';
import BrandLogo from '../components/BrandLogo';

export default function Sucesso() {
  const [msg, setMsg] = useState('Confirmando pagamento...');

  useEffect(() => {
    let tries = 0;
    const tick = async () => {
      const res = await fetch('/api/me');
      const body = await res.json().catch(() => ({}));
      if (body.hasAccess) {
        window.location.href = body.tenant?.role === 'admin' ? '/admin' : '/app';
        return;
      }
      tries += 1;
      if (tries >= 12) {
        setMsg('Pagamento recebido. Se o acesso ainda não liberou, atualize em alguns segundos.');
        return;
      }
      setTimeout(tick, 1500);
    };
    tick();
  }, []);

  return (
    <div className="paywall">
      <Head><title>Pagamento confirmado — Oryon Links</title></Head>
      <div className="auth-logo" style={{ justifyContent: 'center', marginBottom: 16 }}><BrandLogo /></div>
      <h1>Quase lá</h1>
      <p className="subtitle">{msg}</p>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (!user) return loginRedirect('/sucesso');
  return { props: { tenant: publicTenant(tenant) } };
}
