import { useEffect, useState } from 'react';
import { normalizeSlug } from '../lib/reservedSlugs';
import { appHost } from '../lib/stripe';

export default function LinkManager({ showToast, onCount }) {
  const [links, setLinks] = useState([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [dest, setDest] = useState('');
  const [desc, setDesc] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [slugLocked, setSlugLocked] = useState(false);

  const BASE = appHost();

  useEffect(() => { fetchLinks(); }, []);

  async function fetchLinks() {
    const res = await fetch('/api/links');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      showToast(body.error || 'Erro ao carregar links', 'error');
      return;
    }
    const data = await res.json();
    setLinks(data);
    if (onCount) onCount(Array.isArray(data) ? data.length : 0);
  }

  function onNameChange(val) {
    setName(val);
    if (!slugLocked && !editingId) setSlug(normalizeSlug(val));
  }

  function resetForm() {
    setName('');
    setSlug('');
    setDest('');
    setDesc('');
    setEditingId(null);
    setSlugLocked(false);
  }

  function startEdit(link) {
    setEditingId(link.id);
    setName(link.name);
    setSlug(link.slug);
    setDest(link.dest);
    setDesc(link.desc || '');
    setSlugLocked(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveLink() {
    if (!name || !slug || !dest) return showToast('Preencha nome, slug e destino', 'error');
    if (!/^https?:\/\//i.test(dest)) return showToast('Destino deve começar com https://', 'error');
    setLoading(true);
    const res = await fetch('/api/links', {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, name, slug, dest, desc }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.status === 409) return showToast(body.error || 'Slug já existe na plataforma', 'error');
    if (!res.ok) return showToast(body.error || 'Erro ao salvar link', 'error');
    const wasEditing = Boolean(editingId);
    resetForm();
    fetchLinks();
    showToast(wasEditing ? 'Link atualizado!' : 'Link criado!', 'success');
  }

  async function deleteLink(id) {
    if (!confirm('Apagar este link?')) return;
    const res = await fetch('/api/links', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return showToast('Erro ao apagar', 'error');
    if (editingId === id) resetForm();
    fetchLinks();
    showToast('Link removido');
  }

  function copyLink(s) {
    navigator.clipboard.writeText(`https://${BASE}/${s}`);
    showToast('Link copiado!', 'success');
  }

  const filtered = links.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="card">
        <div className="card-label">{editingId ? 'Editar link' : 'Novo link'}</div>
        <div className="row">
          <div className="field">
            <label>Nome do link</label>
            <input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="Ex: Suporte WhatsApp" />
          </div>
          <div className="field">
            <label>Slug (único na plataforma)</label>
            <input
              value={slug}
              onChange={(e) => { setSlug(normalizeSlug(e.target.value)); setSlugLocked(true); }}
              placeholder="Ex: suporte"
            />
          </div>
        </div>
        <div className="row">
          <div className="field full">
            <label>Destino final</label>
            <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder="https://wa.me/558193173624" />
          </div>
        </div>
        <div className="row" style={{ marginBottom: 18 }}>
          <div className="field full">
            <label>Descrição (opcional)</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex: Atendimento WhatsApp" />
          </div>
        </div>
        <div className="preview">
          {BASE}/<b>{slug || 'seu-slug'}</b>
        </div>
        <div className="btn-row">
          <button className="btn-create" onClick={saveLink} disabled={loading}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {loading ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar Link'}
          </button>
          {editingId && (
            <button className="ghost" type="button" onClick={resetForm}>Cancelar</button>
          )}
        </div>
      </div>

      <div className="section-head">
        <h2>Links criados</h2>
        <input className="search" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="link-list">
        {filtered.length === 0 ? (
          <div className="empty">
            {links.length === 0 ? 'Nenhum link ainda. Crie o primeiro acima!' : 'Nenhum link encontrado.'}
          </div>
        ) : filtered.map((link) => (
          <div className={`link-card ${editingId === link.id ? 'editing' : ''}`} key={link.id}>
            <div>
              <div className="link-name">{link.name}</div>
              <div className="link-slug"><span className="base">{BASE}/</span>{link.slug}</div>
              <div className="link-dest">→ {link.dest}</div>
              {link.desc && <div className="link-desc">{link.desc}</div>}
            </div>
            <div className="actions">
              <button className="btn copy" onClick={() => copyLink(link.slug)}>Copiar</button>
              <button className="btn edit" onClick={() => startEdit(link)}>Editar</button>
              <button className="btn del" onClick={() => deleteLink(link.id)}>Apagar</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
