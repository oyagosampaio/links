import { useState } from 'react';
import Head from 'next/head';
import { getPageAuth, accessRedirect, publicTenant } from '../lib/auth';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import BrandLogo from '../components/BrandLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signError) {
      setError('E-mail ou senha inválidos');
      return;
    }
    const me = await fetch('/api/me').then((r) => r.json());
    if (me.tenant?.role === 'admin') {
      window.location.href = '/admin';
      return;
    }
    window.location.href = me.hasAccess ? '/app' : '/assinar';
  }

  async function forgotPassword() {
    setError('');
    setInfo('');
    if (!email) return setError('Informe seu e-mail para recuperar a senha');
    setLoading(true);
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || 'Não foi possível enviar o e-mail agora');
      return;
    }
    setInfo('Se o e-mail existir, enviaremos o link de recuperação.');
  }

  return (
    <div className="auth-wrap">
      <Head><title>Entrar — Oryon Links</title></Head>
      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="auth-logo"><BrandLogo /></div>
        <h1>Entrar</h1>
        <p className="subtitle">Acesse seu painel de links</p>
        {error && <div className="error-box">{error}</div>}
        {info && <div className="error-box" style={{ color: 'var(--success)', borderColor: 'rgba(76,175,150,0.25)', background: 'var(--success-dim)' }}>{info}</div>}
        <div className="field" style={{ marginBottom: 14 }}>
          <label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="ghost" type="button" onClick={forgotPassword} style={{ marginBottom: 8 }} disabled={loading}>
          {loading ? 'Enviando...' : 'Esqueci a senha'}
        </button>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="auth-switch">Não tem conta? <a href="/signup">Assinar por R$ 9,90/mês</a></p>
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { user, tenant } = await getPageAuth(context);
  if (user && tenant) return accessRedirect(tenant);
  return { props: { tenant: publicTenant(tenant) } };
}
