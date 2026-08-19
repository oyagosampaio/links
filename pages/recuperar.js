import { useEffect, useState } from 'react';
import Head from 'next/head';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import BrandLogo from '../components/BrandLogo';

export default function Recuperar() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setError('Não foi possível validar o link');
      setChecking(false);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type') || 'recovery';

    async function prepare() {
      if (tokenHash) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type,
        });
        if (otpError) {
          setError('Este link é inválido ou já expirou. Peça um novo em Entrar.');
          setChecking(false);
          return;
        }
        window.history.replaceState({}, '', '/recuperar');
        setReady(true);
        setChecking(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        setError('Abra o link que enviamos por e-mail para definir uma nova senha.');
      }
      setChecking(false);
    }

    prepare();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError('Não foi possível salvar a senha. Tente outro link de recuperação.');
      return;
    }
    window.location.href = '/app';
  }

  return (
    <div className="auth-wrap">
      <Head><title>Nova senha — Oryon Links</title></Head>
      <form className="card auth-card" onSubmit={onSubmit}>
        <div className="auth-logo"><BrandLogo /></div>
        <h1>Nova senha</h1>
        <p className="subtitle">Defina uma senha para acessar o painel.</p>
        {error && <div className="error-box">{error}</div>}
        {checking ? (
          <p className="subtitle">Validando link...</p>
        ) : ready ? (
          <>
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Senha</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar senha'}
            </button>
          </>
        ) : (
          <a className="btn-primary" href="/login" style={{ justifyContent: 'center' }}>Voltar para entrar</a>
        )}
      </form>
    </div>
  );
}
