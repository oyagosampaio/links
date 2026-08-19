import { useEffect, useState } from 'react';

const ACCESS_LABELS = {
  none: 'Sem acesso',
  subscription: 'Assinante',
  courtesy: 'Cortesia',
  tester: 'Tester',
  manual: 'Manual',
};

const STATUS_LABELS = {
  active: 'Ativo',
  inactive: 'Inativo',
  trialing: 'Trial',
  canceled: 'Cancelado',
  past_due: 'Inadimplente',
};

function statusClass(status) {
  if (status === 'active' || status === 'trialing') return 'success';
  if (status === 'past_due') return 'warn';
  if (status === 'canceled' || status === 'inactive') return 'danger';
  return 'muted';
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR');
}

const emptyForm = {
  email: '',
  password: '',
  name: '',
  accessType: 'courtesy',
  planStatus: 'active',
  currentPeriodEnd: '',
  notes: '',
  sendEmail: true,
};

export default function SubscribersPanel({ showToast }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { fetchRows(); }, []);

  async function fetchRows() {
    const res = await fetch('/api/admin/subscribers');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      showToast(body.error || 'Erro ao carregar assinantes', 'error');
      return;
    }
    setRows(await res.json());
  }

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(row) {
    setEditingId(row.id);
    setForm({
      email: row.email,
      password: '',
      name: row.name || '',
      accessType: row.accessType === 'none' ? 'manual' : row.accessType,
      planStatus: row.planStatus,
      currentPeriodEnd: row.currentPeriodEnd ? row.currentPeriodEnd.slice(0, 10) : '',
      notes: row.notes || '',
      sendEmail: false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function save() {
    if (!editingId && !form.email) return showToast('Informe o e-mail', 'error');
    setLoading(true);
    const payload = {
      id: editingId,
      email: form.email,
      password: form.password || undefined,
      name: form.name,
      accessType: form.accessType,
      planStatus: form.planStatus,
      currentPeriodEnd: form.currentPeriodEnd || null,
      notes: form.notes,
      sendEmail: form.sendEmail,
      sendAccessEmail: Boolean(editingId && form.sendEmail),
    };
    const res = await fetch('/api/admin/subscribers', {
      method: editingId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) return showToast(body.error || 'Erro ao salvar acesso', 'error');
    resetForm();
    fetchRows();
    showToast(editingId ? 'Acesso atualizado' : (form.sendEmail ? 'Acesso criado e e-mail enviado' : 'Acesso criado'), 'success');
  }

  async function revoke(id) {
    if (!confirm('Revogar o acesso deste usuário?')) return;
    const res = await fetch('/api/admin/subscribers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return showToast('Erro ao revogar', 'error');
    fetchRows();
    showToast('Acesso revogado');
  }

  async function sendAccess(row) {
    const res = await fetch('/api/admin/subscribers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, sendAccessEmail: true }),
    });
    if (!res.ok) return showToast('Erro ao enviar e-mail', 'error');
    showToast('E-mail de acesso enviado', 'success');
  }

  async function activate(row) {
    const res = await fetch('/api/admin/subscribers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: row.id,
        planStatus: 'active',
        accessType: row.accessType === 'none' ? 'manual' : row.accessType,
      }),
    });
    if (!res.ok) return showToast('Erro ao ativar', 'error');
    fetchRows();
    showToast('Acesso ativado e e-mail enviado', 'success');
  }

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    return r.email.toLowerCase().includes(q) || (r.name || '').toLowerCase().includes(q);
  });

  return (
    <>
      <div className="card">
        <div className="card-label">{editingId ? 'Editar acesso' : 'Liberar acesso manual'}</div>
        <div className="row">
          <div className="field">
            <label>E-mail</label>
            <input
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              placeholder="pessoa@email.com"
              disabled={Boolean(editingId)}
            />
          </div>
          <div className="field">
            <label>{editingId ? 'Nova senha (opcional)' : 'Senha inicial'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setField('password', e.target.value)}
              placeholder={editingId ? 'Deixe em branco para manter' : 'Mínimo 6 caracteres'}
            />
          </div>
        </div>
        <div className="row three">
          <div className="field">
            <label>Nome</label>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nome" />
          </div>
          <div className="field">
            <label>Tipo</label>
            <select value={form.accessType} onChange={(e) => setField('accessType', e.target.value)}>
              <option value="courtesy">Cortesia</option>
              <option value="tester">Tester</option>
              <option value="subscription">Assinante</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.planStatus} onChange={(e) => setField('planStatus', e.target.value)}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="trialing">Trial</option>
              <option value="canceled">Cancelado</option>
              <option value="past_due">Inadimplente</option>
            </select>
          </div>
        </div>
        <div className="row">
          <div className="field">
            <label>Válido até (opcional)</label>
            <input
              type="date"
              value={form.currentPeriodEnd}
              onChange={(e) => setField('currentPeriodEnd', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Observações</label>
            <input value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Ex: parceiro, beta..." />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.sendEmail}
              onChange={(e) => setField('sendEmail', e.target.checked)}
            />
            Enviar e-mail de acesso
          </label>
        </div>
        <div className="btn-row">
          <button className="btn-create" onClick={save} disabled={loading}>
            {loading ? 'Salvando...' : editingId ? 'Salvar acesso' : 'Criar acesso'}
          </button>
          {editingId && <button className="ghost" type="button" onClick={resetForm}>Cancelar</button>}
        </div>
      </div>

      <div className="section-head">
        <h2>Assinantes ({rows.length})</h2>
        <input className="search" placeholder="Buscar e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="table-wrap">
        <table className="subs">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Validade</th>
              <th>Links</th>
              <th>Desde</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="empty">Nenhum assinante encontrado.</td></tr>
            ) : filtered.map((row) => (
              <tr key={row.id}>
                <td>
                  <div className="email">{row.name || '—'}</div>
                  <div className="muted">{row.email}</div>
                  {row.notes ? <div className="muted">{row.notes}</div> : null}
                </td>
                <td><span className="badge muted">{ACCESS_LABELS[row.accessType] || row.accessType}</span></td>
                <td><span className={`badge ${statusClass(row.planStatus)}`}>{STATUS_LABELS[row.planStatus] || row.planStatus}</span></td>
                <td className="muted">{formatDate(row.currentPeriodEnd)}</td>
                <td className="mono">{row.linksCount}</td>
                <td className="muted">{formatDate(row.createdAt)}</td>
                <td>
                  <div className="actions">
                    <button className="btn edit" onClick={() => startEdit(row)}>Editar</button>
                    <button className="btn copy" onClick={() => sendAccess(row)}>E-mail</button>
                    {row.planStatus === 'active' || row.planStatus === 'trialing' ? (
                      <button className="btn del" onClick={() => revoke(row.id)}>Revogar</button>
                    ) : (
                      <button className="btn copy" onClick={() => activate(row)}>Ativar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
