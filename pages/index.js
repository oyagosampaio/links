import Head from 'next/head';
import { getPageAuth, tenantHasAccess, publicTenant } from '../lib/auth';
import { appHost } from '../lib/stripe';

export default function Home({ loggedIn, hasAccess }) {
  const host = appHost();
  const ctaHref = loggedIn ? (hasAccess ? '/app' : '/assinar') : '/signup';
  const ctaLabel = loggedIn ? (hasAccess ? 'Abrir painel' : 'Concluir assinatura') : 'Começar agora';

  return (
    <>
      <Head>
        <title>Oryon Links — Gerencie seus links por R$ 9,90/mês</title>
        <meta name="description" content="Crie slugs únicos, redirecione para qualquer destino e gerencie seus links em um painel isolado." />
      </Head>

      <header className="landing-header">
        <div className="logo">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M8 2l6 6-6 6" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">Oryon Links</div>
            <div className="logo-sub">{host}</div>
          </div>
        </div>
        <div className="header-right">
          {loggedIn ? (
            <a className="ghost" href={hasAccess ? '/app' : '/assinar'}>{hasAccess ? 'Painel' : 'Assinar'}</a>
          ) : (
            <>
              <a className="ghost" href="/login">Entrar</a>
              <a className="btn-primary" href="/signup">Assinar</a>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <h1>Seus links, com slug próprio e painel exclusivo.</h1>
        <p className="lead">
          Crie, edite e compartilhe redirecionamentos em {host}. Cada conta tem dados isolados.
          Slugs são únicos em toda a plataforma.
        </p>
        <div className="hero-actions">
          <a className="btn-primary btn-lg" href={ctaHref}>{ctaLabel}</a>
          {!loggedIn && <a className="ghost btn-lg" href="/login">Já tenho conta</a>}
        </div>

        <div className="pricing">
          <div className="price-card">
            <div className="badge">Plano mensal</div>
            <div className="amount" style={{ marginTop: 16 }}>R$ 9,90 <small>/mês</small></div>
            <ul className="features">
              <li>Painel para criar, editar e apagar links</li>
              <li>Slug único na plataforma — ninguém usa o seu</li>
              <li>Redirecionamento instantâneo para o destino</li>
              <li>Dados e configurações isolados por conta</li>
              <li>Cancele quando quiser pelo portal Stripe</li>
            </ul>
            <a className="btn-primary" href={ctaHref}>Assinar com Stripe</a>
          </div>
          <div className="side-note">
            <h3>Como funciona</h3>
            Crie sua conta, pague R$ 9,90 no Stripe e o acesso é liberado automaticamente.
            Depois é só gerar links como <span className="mono" style={{ color: 'var(--accent)' }}>{host}/seu-slug</span> e
            apontar para WhatsApp, Instagram, site ou qualquer URL.
          </div>
        </div>
      </section>
    </>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (user && tenant?.role === 'admin') {
    return { redirect: { destination: '/admin', permanent: false } };
  }
  if (user && tenantHasAccess(tenant)) {
    return { redirect: { destination: '/app', permanent: false } };
  }
  return {
    props: {
      loggedIn: Boolean(user),
      hasAccess: tenantHasAccess(tenant),
      tenant: publicTenant(tenant),
    },
  };
}
