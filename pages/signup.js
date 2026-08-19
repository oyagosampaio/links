import { useState } from 'react';
import Head from 'next/head';
import { getPageAuth, accessRedirect, publicTenant, tenantHasAccess } from '../lib/auth';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const created = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const createdBody = await created.json().catch(() => ({}));
    if (!created.ok) {
      setLoading(false);
      setError(createdBody.error || 'Não foi possível criar a conta');
      return;
    }

    const supabase = getSupabaseBrowser();
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) {
      setLoading(false);
      setError('Conta criada, mas o login falhou. Tente entrar.');
      return;
    }

    const me = await fetch('/api/me').then((r) => r.json());
    if (me.tenant?.role === 'admin' || me.hasAccess) {
      window.location.href = me.tenant?.role === 'admin' ? '/admin' : '/app';
      return;
    }

    const checkout = await fetch('/api/stripe/checkout', { method: 'POST' });
    const checkoutBody = await checkout.json().catch(() => ({}));
    setLoading(false);
    if (!checkout.ok || !checkoutBody.url) {
      window.location.href = '/assinar';
      return;
    }
    window.location.href = checkoutBody.url;
  }

  return (
    <div className="auth-wrap">
      <Head><title>Criar conta — Oryon Links</title></Head>
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Criar conta</h1>
        <p className="subtitle">R$ 9,90/mês. O pagamento é feito com segurança no Stripe.</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
        </div>
        <div className="field" style={{ marginBottom: 14 }}>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Redirecionando...' : 'Continuar para o pagamento'}
        </button>
        <p className="auth-switch">Já tem conta? <a href="/login">Entrar</a></p>
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (user && tenant && (tenant.role === 'admin' || tenantHasAccess(tenant))) {
    return accessRedirect(tenant);
  }
  return { props: { tenant: publicTenant(tenant) } };
}
