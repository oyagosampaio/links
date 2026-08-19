import Head from 'next/head';
import { getPageAuth, tenantHasAccess, publicTenant } from '../lib/auth';
import { appHost } from '../lib/stripe';
import BrandLogo from '../components/BrandLogo';
import { BRAND } from '../lib/brand';

export default function Home({ loggedIn, hasAccess }) {
  const host = appHost();
  const ctaHref = loggedIn ? (hasAccess ? '/app' : '/assinar') : '/signup';
  const ctaLabel = loggedIn ? (hasAccess ? 'Abrir painel' : 'Concluir assinatura') : 'Começar agora';

  return (
    <>
      <Head>
        <title>{BRAND.name} — Gerencie seus links por R$ 9,90/mês</title>
        <meta name="description" content={BRAND.description} />
      </Head>

      <header className="landing-header">
        <a href="/"><BrandLogo /></a>
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
              <li>Cancele quando quiser, direto no painel</li>
            </ul>
            <a className="btn-primary" href={ctaHref}>Assinar agora</a>
          </div>
          <div className="side-note">
            <h3>Como funciona</h3>
            Crie sua conta, assine por R$ 9,90 e o acesso é liberado na hora.
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
