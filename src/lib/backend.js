// Tiny data layer for the blog + admin.
// With VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY set it talks to Supabase (REST + Auth)
// using plain fetch, so no SDK is shipped. Without them it falls back to a browser-local
// demo store so the blog and admin still work for previewing.
import { STARTER_POSTS } from '../data/posts.js';

const URL_ = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
export const isConfigured = Boolean(URL_ && KEY);

const SESSION_KEY = 'aa-admin-session';
const LOCAL_POSTS = 'aa-local-posts';
const LOCAL_MSGS = 'aa-local-messages';

export const slugify = (s) =>
  String(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'post';

export const readingTime = (md = '') => Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 220));

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
const localPosts = () => readLocal(LOCAL_POSTS, STARTER_POSTS.map((p) => ({ ...p })));
const byDate = (a, b) => new Date(b.created_at) - new Date(a.created_at);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));
const isLocalSession = () => !!getSession()?.local;

/* ---------------- posts ---------------- */
const POST_COLS = 'id,slug,title,excerpt,content,cover_url,tags,published,created_at,updated_at';

export async function listPublishedPosts(limit) {
  if (!isConfigured) {
    const posts = localPosts().filter((p) => p.published).sort(byDate);
    return limit ? posts.slice(0, limit) : posts;
  }
  const q = `posts?select=${POST_COLS}&published=eq.true&order=created_at.desc${limit ? `&limit=${limit}` : ''}`;
  return rest(q);
}

export async function getPost(slug) {
  if (!isConfigured) return localPosts().find((p) => p.slug === slug && p.published) || null;
  const rows = await rest(`posts?select=${POST_COLS}&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);
  return rows?.[0] || null;
}

export async function adminListPosts() {
  if (!isConfigured || isLocalSession()) return localPosts().sort(byDate);
  return rest(`posts?select=${POST_COLS}&order=created_at.desc`, { auth: true });
}

export async function savePost(post) {
  const now = new Date().toISOString();
  const data = {
    slug: slugify(post.slug || post.title),
    title: post.title.trim(),
    excerpt: (post.excerpt || '').trim(),
    content: post.content || '',
    cover_url: (post.cover_url || '').trim() || null,
    tags: post.tags || [],
    published: !!post.published,
    updated_at: now
  };
  if (!isConfigured || isLocalSession()) {
    const all = localPosts();
    if (all.some((p) => p.slug === data.slug && p.id !== post.id)) throw new Error('Another post already uses this slug.');
    if (post.id) {
      const i = all.findIndex((p) => p.id === post.id);
      all[i] = { ...all[i], ...data };
    } else {
      all.push({ ...data, id: uid(), created_at: now });
    }
    writeLocal(LOCAL_POSTS, all);
    return;
  }
  if (post.id) await rest(`posts?id=eq.${post.id}`, { method: 'PATCH', body: data, auth: true, prefer: 'return=minimal' });
  else await rest('posts', { method: 'POST', body: data, auth: true, prefer: 'return=minimal' });
}

export async function deletePost(id) {
  if (!isConfigured || isLocalSession()) return writeLocal(LOCAL_POSTS, localPosts().filter((p) => p.id !== id));
  await rest(`posts?id=eq.${id}`, { method: 'DELETE', auth: true });
}

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
