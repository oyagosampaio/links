import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Admin() {
  const [links, setLinks] = useState([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [dest, setDest] = useState('');
  const [desc, setDesc] = useState('');
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const BASE = 'link.oryondigital.com';

  useEffect(() => { fetchLinks(); }, []);

  async function fetchLinks() {
    const res = await fetch('/api/links');
    setLinks(await res.json());
  }

  function autoSlug(val) {
    return val.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
  }

  async function createLink() {
    if (!name || !slug || !dest) return showToast('Preencha nome, slug e destino', 'error');
    if (!/^https?:\/\//i.test(dest)) return showToast('Destino deve começar com https://', 'error');
    setLoading(true);
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, dest, desc }),
    });
    setLoading(false);
    if (res.status === 409) return showToast('Slug já existe, escolha outro', 'error');
    if (!res.ok) return showToast('Erro ao criar link', 'error');
    setName(''); setSlug(''); setDest(''); setDesc('');
    fetchLinks();
    showToast('Link criado!', 'success');
  }

  async function deleteLink(id) {
    await fetch('/api/links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchLinks();
    showToast('Link removido');
  }

  function copyLink(s) {
    navigator.clipboard.writeText(`https://${BASE}/${s}`);
    showToast('Link copiado!', 'success');
  }

  function showToast(msg, type = '') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2400);
  }

  const filtered = links.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Oryon Digital — Link Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0d0d0d; --bg-card: #161616; --bg-input: #1c1c1c;
          --border: rgba(255,255,255,0.08); --border-hover: rgba(255,255,255,0.18);
          --accent: #d4f24c; --accent-dim: rgba(212,242,76,0.12); --accent-text: #0d0d0d;
          --text-primary: #f0f0f0; --text-secondary: #888; --text-muted: #555;
          --danger: #ff4d4d; --danger-dim: rgba(255,77,77,0.12);
          --success: #4caf96; --success-dim: rgba(76,175,150,0.12);
          --radius: 10px; --radius-sm: 6px;
        }
        body { font-family: 'Syne', sans-serif; background: var(--bg); color: var(--text-primary); min-height: 100vh; }
        input, button { font-family: 'Syne', sans-serif; }
        header { border-bottom: 1px solid var(--border); padding: 18px 40px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--bg); z-index: 100; }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-mark { width: 32px; height: 32px; background: var(--accent); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { font-size: 15px; font-weight: 600; }
        .logo-sub { font-size: 11px; color: var(--text-muted); }
        .badge { background: var(--accent-dim); color: var(--accent); font-size: 12px; padding: 4px 10px; border-radius: 20px; border: 1px solid rgba(212,242,76,0.2); }
        main { max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }
        h1 { font-size: 30px; font-weight: 700; letter-spacing: -1px; margin-bottom: 4px; }
        h1 span { color: var(--accent); }
        .subtitle { font-size: 14px; color: var(--text-secondary); margin-bottom: 40px; font-weight: 400; }
        .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 28px; margin-bottom: 40px; }
        .card-label { font-size: 12px; font-weight: 500; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
        .full { grid-column: 1 / -1; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        .field input { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.15s; }
        .field input:focus { border-color: var(--accent); }
        .field input::placeholder { color: var(--text-muted); }
        .preview { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 13px; color: var(--text-muted); font-family: 'DM Mono', monospace; word-break: break-all; margin-bottom: 18px; }
        .preview b { color: var(--accent); font-weight: 400; }
        .btn-create { background: var(--accent); color: var(--accent-text); border: none; border-radius: var(--radius-sm); font-size: 14px; font-weight: 600; padding: 11px 24px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.15s; }
        .btn-create:hover { opacity: 0.85; }
        .btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
        .section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-head h2 { font-size: 16px; font-weight: 600; }
        .search { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; padding: 8px 14px; outline: none; width: 200px; }
        .search:focus { border-color: var(--accent); }
        .search::placeholder { color: var(--text-muted); }
        .link-list { display: flex; flex-direction: column; gap: 10px; }
        .link-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px 20px; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 16px; transition: border-color 0.15s; }
        .link-card:hover { border-color: var(--border-hover); }
        .link-name { font-size: 15px; font-weight: 600; margin-bottom: 4px; }
        .link-slug { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--accent); margin-bottom: 5px; }
        .link-slug .base { color: var(--text-muted); }
        .link-dest { font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 480px; }
        .link-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
        .actions { display: flex; gap: 8px; flex-shrink: 0; }
        .btn { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-secondary); cursor: pointer; padding: 7px 12px; font-size: 13px; font-weight: 500; transition: all 0.15s; white-space: nowrap; }
        .btn:hover { border-color: var(--border-hover); color: var(--text-primary); }
        .btn.copy:hover { background: var(--success-dim); border-color: var(--success); color: var(--success); }
        .btn.del:hover { background: var(--danger-dim); border-color: var(--danger); color: var(--danger); }
        .empty { text-align: center; padding: 60px 20px; color: var(--text-muted); font-size: 14px; }
        .toast { position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%); background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 20px; font-size: 13px; z-index: 999; transition: opacity 0.2s; white-space: nowrap; }
        .toast.success { border-color: var(--success); color: var(--success); }
        .toast.error { border-color: var(--danger); color: var(--danger); }
        @media (max-width: 600px) {
          header { padding: 16px 18px; }
          main { padding: 32px 16px 60px; }
          .row { grid-template-columns: 1fr; }
          h1 { font-size: 24px; }
          .link-card { grid-template-columns: 1fr; }
          .actions { justify-content: flex-start; }
        }
      `}</style>

      <header>
        <div className="logo">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8h12M8 2l6 6-6 6" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="logo-text">Oryon Digital</div>
            <div className="logo-sub">{BASE}</div>
          </div>
        </div>
        <div className="badge">{links.length} link{links.length !== 1 ? 's' : ''}</div>
      </header>

      <main>
        <h1>Gerenciador de <span>Links</span></h1>
        <p className="subtitle">Crie links intermediários que redirecionam para o destino final</p>

        <div className="card">
          <div className="card-label">Novo Link</div>
          <div className="row">
            <div className="field">
              <label>Nome do link</label>
              <input value={name} onChange={e => { setName(e.target.value); setSlug(autoSlug(e.target.value)); }} placeholder="Ex: Suporte WhatsApp" />
            </div>
            <div className="field">
              <label>Slug</label>
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Ex: suporte" />
            </div>
          </div>
          <div className="row">
            <div className="field full">
              <label>Destino final</label>
              <input value={dest} onChange={e => setDest(e.target.value)} placeholder="https://wa.me/558193173624" />
            </div>
          </div>
          <div className="row" style={{marginBottom: '18px'}}>
            <div className="field full">
              <label>Descrição (opcional)</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Atendimento WhatsApp" />
            </div>
          </div>
          <div className="preview">
            {BASE}/<b>{slug || 'seu-slug'}</b>
          </div>
          <button className="btn-create" onClick={createLink} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            {loading ? 'Criando...' : 'Criar Link'}
          </button>
        </div>

        <div className="section-head">
          <h2>Links criados</h2>
          <input className="search" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="link-list">
          {filtered.length === 0 ? (
            <div className="empty">{links.length === 0 ? 'Nenhum link ainda. Crie o primeiro acima!' : 'Nenhum link encontrado.'}</div>
          ) : filtered.map(link => (
            <div className="link-card" key={link.id}>
              <div>
                <div className="link-name">{link.name}</div>
                <div className="link-slug"><span className="base">{BASE}/</span>{link.slug}</div>
                <div className="link-dest">→ {link.dest}</div>
                {link.desc && <div className="link-desc">{link.desc}</div>}
              </div>
              <div className="actions">
                <button className="btn copy" onClick={() => copyLink(link.slug)}>Copiar</button>
                <button className="btn del" onClick={() => deleteLink(link.id)}>Apagar</button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </>
  );
}
