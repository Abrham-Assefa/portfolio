// Tiny data layer for admin authentication and the contact inbox.
// With VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set it talks to Supabase (REST + Auth)
// using plain fetch, so no SDK is shipped. Without them it falls back to a browser-local
// demo store so the contact inbox still works for previewing.

const URL_ = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
export const isConfigured = Boolean(URL_ && KEY);

const SESSION_KEY = 'aa-admin-session';
const LOCAL_MSGS = 'aa-local-messages';

/* ---------------- session ---------------- */
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
}
function setSession(s) {
  try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch {}
}

async function authFetch(path, body) {
  const res = await fetch(`${URL_}/auth/v1/${path}`, {
    method: 'POST',
    headers: { apikey: KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.msg || data.message || `Auth error ${res.status}`);
  return data;
}

function storeAuth(data) {
  const s = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
    email: data.user?.email || ''
  };
  setSession(s);
  return s;
}

async function validToken() {
  let s = getSession();
  if (!s) return null;
  if (s.local) return 'local';
  if (Date.now() > s.expires_at - 60_000) {
    try { s = storeAuth(await authFetch('token?grant_type=refresh_token', { refresh_token: s.refresh_token })); }
    catch { setSession(null); return null; }
  }
  return s.access_token;
}

export function currentUser() {
  const s = getSession();
  return s ? { email: s.email, local: !!s.local } : null;
}

export async function signIn(email, password) {
  if (!isConfigured) throw new Error('Supabase is not configured.');
  return storeAuth(await authFetch('token?grant_type=password', { email, password }));
}

export async function updatePassword(password) {
  const token = await validToken();
  if (!token || token === 'local') throw new Error('Your session expired — please sign in again.');
  const res = await fetch(`${URL_}/auth/v1/user`, {
    method: 'PUT',
    headers: { apikey: KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || data.error_description || data.message || `Auth error ${res.status}`);
}

export function enterDemo() {
  setSession({ local: true, email: 'demo@local' });
}

export async function signOut() {
  const s = getSession();
  setSession(null);
  if (isConfigured && s?.access_token) {
    fetch(`${URL_}/auth/v1/logout`, { method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${s.access_token}` } }).catch(() => {});
  }
}

/* ---------------- REST ---------------- */
async function rest(path, { method = 'GET', body, auth = false, prefer } = {}) {
  const headers = { apikey: KEY, 'Content-Type': 'application/json' };
  const token = auth ? await validToken() : null;
  if (auth && !token) throw new Error('Your session expired — please sign in again.');
  headers.Authorization = `Bearer ${token || KEY}`;
  if (prefer) headers.Prefer = prefer;
  const res = await fetch(`${URL_}/rest/v1/${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

/* ---------------- local demo store ---------------- */
const readLocal = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return Array.isArray(v) ? v : fallback; } catch { return fallback; }
};
const writeLocal = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const byDate = (a, b) => new Date(b.created_at) - new Date(a.created_at);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const isLocalSession = () => !!getSession()?.local;

/* ---------------- messages ---------------- */
// Returns true when stored in the database (so the caller can skip other fallbacks).
export async function sendMessage({ name, email, message }) {
  if (!isConfigured) {
    writeLocal(LOCAL_MSGS, [...readLocal(LOCAL_MSGS, []), { id: uid(), name, email, message, read: false, created_at: new Date().toISOString() }]);
    return false;
  }
  await rest('messages', { method: 'POST', body: { name, email, message }, prefer: 'return=minimal' });
  return true;
}

export async function listMessages() {
  if (!isConfigured || isLocalSession()) return readLocal(LOCAL_MSGS, []).sort(byDate);
  return rest('messages?select=id,name,email,message,read,created_at&order=created_at.desc', { auth: true });
}

export async function setMessageRead(id, read) {
  if (!isConfigured || isLocalSession()) {
    return writeLocal(LOCAL_MSGS, readLocal(LOCAL_MSGS, []).map((m) => (m.id === id ? { ...m, read } : m)));
  }
  await rest(`messages?id=eq.${id}`, { method: 'PATCH', body: { read }, auth: true, prefer: 'return=minimal' });
}

export async function deleteMessage(id) {
  if (!isConfigured || isLocalSession()) return writeLocal(LOCAL_MSGS, readLocal(LOCAL_MSGS, []).filter((m) => m.id !== id));
  await rest(`messages?id=eq.${id}`, { method: 'DELETE', auth: true });
}
