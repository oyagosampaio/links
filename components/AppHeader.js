import { useState } from 'react';
import { getSupabaseBrowser } from '../lib/supabaseBrowser';
import { appHost } from '../lib/stripe';

function Logo() {
  return (
    <div className="logo">
      <div className="logo-mark">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8h12M8 2l6 6-6 6" stroke="#0d0d0d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div>
        <div className="logo-text">Oryon Links</div>
        <div className="logo-sub">{appHost()}</div>
      </div>
    </div>
  );
}

export default function AppHeader({ tenant, current, linkCount }) {
  async function logout() {
    const supabase = getSupabaseBrowser();
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/';
  }

  const isAdmin = tenant?.role === 'admin';

  return (
    <header className="app-header">
      <a href={isAdmin ? '/admin' : '/app'}><Logo /></a>
      <div className="header-right">
        {isAdmin && (
          <nav className="nav-tabs">
            <a href="/admin" className={current === 'links' ? 'active' : ''}>Links</a>
            <a href="/admin?tab=assinantes" className={current === 'subscribers' ? 'active' : ''}>Assinantes</a>
          </nav>
        )}
        {typeof linkCount === 'number' && (
          <div className="badge">{linkCount} link{linkCount !== 1 ? 's' : ''}</div>
        )}
        {tenant?.email && <div className="badge muted">{tenant.email}</div>}
        <button className="ghost" type="button" onClick={logout}>Sair</button>
      </div>
    </header>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type || ''}`}>{toast.msg}</div>;
}

export function useToast() {
  const [toast, setToast] = useState(null);
  function showToast(msg, type = '') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2600);
  }
  return { toast, showToast };
}
