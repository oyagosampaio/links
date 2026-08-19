import { useState } from 'react';
import Head from 'next/head';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';

export default function Recuperar() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabaseBrowser();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    window.location.href = '/app';
  }

  return (
    <div className="auth-wrap">
      <Head><title>Nova senha — Oryon Links</title></Head>
      <form className="card auth-card" onSubmit={onSubmit}>
        <h1>Nova senha</h1>
        <p className="subtitle">Defina uma senha para acessar o painel.</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field" style={{ marginBottom: 8 }}>
          <label>Senha</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
        </div>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </div>
  );
}
