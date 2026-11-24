import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/blog.css';
import './styles/admin.css';

import { $, $$, escapeHtml, toast } from './modules/utils.js';
import { initTheme } from './modules/theme.js';
import { initNav } from './modules/nav.js';
import { fmtDate } from './modules/blog.js';
import * as db from './lib/backend.js';

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
initTheme();
initNav();

const root = $('#admin-root');
const state = { messages: [], msgFilter: 'all', openMsg: null };

/* ---------------- login ---------------- */
const friendlyAuthError = (msg = '') => {
  if (/invalid login|invalid_grant|credentials/i.test(msg)) return 'Wrong email or password. Check for typos (0 vs O, 1 vs l) and try again.';
  if (/missing email|missing password/i.test(msg)) return 'Please enter both your email and password.';
  if (/email not confirmed/i.test(msg)) return 'This email is not confirmed yet in Supabase.';
  if (/load failed|failed to fetch|network/i.test(msg)) return "Couldn't reach the server — check your connection and try again.";
  return msg || 'Sign in failed.';
};

function renderLogin(error = '', email = '') {
  const setup = !db.isConfigured ? `
    <div class="adm-setup">
      <h3>Connect your database</h3>
      <p>The admin works in <b>demo mode</b> until Supabase is connected — demo data is stored only in this browser.</p>
      <ol>
        <li>Create a free project at <a href="https://supabase.com" target="_blank" rel="noopener">supabase.com</a>.</li>
        <li>Open <b>SQL Editor</b>, paste <code>supabase/schema.sql</code>, replace <code>YOUR_ADMIN_EMAIL</code>, run it.</li>
        <li><b>Authentication → Users → Add user</b> with that email + a password, then disable new sign-ups.</li>
        <li>In GitHub: <b>Settings → Secrets and variables → Actions → Variables</b>, add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then re-run the deploy.</li>
      </ol>
    </div>` : '';
  root.innerHTML = `
    <section class="adm-login">
      <div class="adm-login-card glass">
        <div class="eyebrow">Admin</div>
        <h1>Welcome back.</h1>
        <p class="adm-muted">Sign in to read messages from the contact form.</p>
        ${db.isConfigured ? `
        <form id="login-form" class="adm-form" novalidate>
          <label>Email<input name="email" type="email" autocomplete="username" autocapitalize="off" spellcheck="false" required value="${escapeHtml(email)}"></label>
          <label>Password
            <span class="adm-pw">
              <input name="password" type="password" autocomplete="current-password" required>
              <button type="button" class="adm-pw-toggle" aria-label="Show password" aria-pressed="false">Show</button>
            </span>
          </label>
          <p class="adm-error" role="alert">${escapeHtml(error)}</p>
          <button class="btn btn-primary" type="submit"><span class="btn-label">Sign in</span></button>
        </form>` : `
        <button class="btn btn-primary" type="button" id="demo-btn">Open demo dashboard →</button>`}
      </div>
      ${setup}
    </section>`;
  $('#demo-btn')?.addEventListener('click', () => { db.enterDemo(); boot(); });
  const form = $('#login-form');
  if (form) bindPwToggle(form);
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailVal = form.email.value.trim().toLowerCase();
    const pw = form.password.value.trim();
    if (!emailVal || !pw) { $('.adm-error', form).textContent = friendlyAuthError('missing email'); return; }
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    $('.btn-label', btn).textContent = 'Signing in…';
    try {
      await db.signIn(emailVal, pw);
      boot();
    } catch (err) {
      renderLogin(friendlyAuthError(err.message), emailVal);
    }
  });
  if (form) (email ? form.password : form.email).focus();
}

function bindPwToggle(scope) {
  $$('.adm-pw-toggle', scope).forEach((t) => t.addEventListener('click', () => {
    const input = t.previousElementSibling;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    t.textContent = show ? 'Hide' : 'Show';
    t.setAttribute('aria-pressed', String(show));
    t.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    input.focus();
  }));
}

function openPasswordDialog() {
  const dlg = document.createElement('dialog');
  dlg.className = 'adm-dialog glass';
  dlg.innerHTML = `
    <form method="dialog" class="adm-form" novalidate>
      <h3>Change password</h3>
      <label>New password
        <span class="adm-pw"><input name="pw" type="password" autocomplete="new-password" minlength="8" required><button type="button" class="adm-pw-toggle" aria-label="Show password">Show</button></span>
      </label>
      <label>Confirm password
        <span class="adm-pw"><input name="pw2" type="password" autocomplete="new-password" required><button type="button" class="adm-pw-toggle" aria-label="Show password">Show</button></span>
      </label>
      <p class="adm-error" role="alert"></p>
      <div class="adm-dialog-actions">
        <button class="btn btn-ghost" type="button" data-cancel>Cancel</button>
        <button class="btn btn-primary" type="submit"><span class="btn-label">Save password</span></button>
      </div>
    </form>`;
  document.body.append(dlg);
  const f = $('form', dlg);
  const err = $('.adm-error', f);
  bindPwToggle(f);
  const close = () => { dlg.close(); dlg.remove(); };
  $('[data-cancel]', f).onclick = close;
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = f.pw.value.trim();
    if (pw.length < 8) { err.textContent = 'Use at least 8 characters.'; return; }
    if (pw !== f.pw2.value.trim()) { err.textContent = "Passwords don't match."; return; }
    const btn = $('button[type=submit]', f);
    btn.disabled = true;
    try {
      await db.updatePassword(pw);
      close();
      toast('Password updated — use it next time you sign in.');
    } catch (ex) {
      btn.disabled = false;
      err.textContent = ex.message || 'Could not update password.';
    }
  });
  dlg.showModal();
  f.pw.focus();
}

/* ---------------- dashboard shell ---------------- */
async function boot() {
  const user = db.currentUser();
  if (!user) return renderLogin();
  root.innerHTML = '<p class="page-state">Loading dashboard…</p>';
  try {
    state.messages = await db.listMessages();
  } catch (err) {
    if (/session|JWT|expired/i.test(err.message)) { await db.signOut(); return renderLogin('Session expired — please sign in again.'); }
    root.innerHTML = `<div class="page-state"><h1>Couldn't load data</h1><p>${escapeHtml(err.message)}</p><button class="btn btn-ghost" id="adm-out">Sign out</button></div>`;
    $('#adm-out').onclick = async () => { await db.signOut(); renderLogin(); };
    return;
  }
  renderShell();
}

function renderShell() {
  const user = db.currentUser();
  const unread = state.messages.filter((m) => !m.read).length;
  root.innerHTML = `
    <section class="adm">
      <div class="adm-top">
        <div>
          <div class="eyebrow">Dashboard</div>
          <h1>Hello, Abrham.</h1>
        </div>
        <div class="adm-user">
          <span class="adm-badge ${user.local ? 'demo' : 'live'}">${user.local ? 'Demo mode' : 'Live · Supabase'}</span>
          <span class="adm-muted">${escapeHtml(user.email)}</span>
          <a class="btn btn-ghost" href="./blog.html" target="_blank" rel="noopener">View blog ↗</a>
          ${user.local ? '' : '<button class="btn btn-ghost" id="change-pw" type="button">Change password</button>'}
          <button class="btn btn-ghost" id="sign-out" type="button">Sign out</button>
        </div>
      </div>
      <div class="adm-stats">
        <div class="adm-stat glass"><b>${state.messages.length}</b><span>Total messages</span></div>
        <div class="adm-stat glass ${unread ? 'hot' : ''}"><b>${unread}</b><span>Unread messages</span></div>
      </div>
      <div id="adm-panel" role="tabpanel"></div>
    </section>`;
  $('#sign-out').onclick = async () => { await db.signOut(); renderLogin(); };
  $('#change-pw')?.addEventListener('click', openPasswordDialog);
  renderMessages();
}

async function refresh() {
  state.messages = await db.listMessages();
  renderShell();
}

const guard = async (fn, ok) => {
  try { await fn(); if (ok) toast(ok); await refresh(); }
  catch (err) { toast(err.message || 'Something went wrong'); }
};

/* ---------------- messages ---------------- */
function renderMessages() {
  const panel = $('#adm-panel');
  const shown = state.messages.filter((m) => state.msgFilter === 'all' || !m.read);
  const open = state.messages.find((m) => m.id === state.openMsg) || null;
  panel.innerHTML = `
    <div class="adm-bar"><h2>Inbox</h2>
      <div class="tag-chips">
        <button class="chip" type="button" data-f="all" aria-pressed="${state.msgFilter === 'all'}">All (${state.messages.length})</button>
        <button class="chip" type="button" data-f="unread" aria-pressed="${state.msgFilter === 'unread'}">Unread (${state.messages.filter((m) => !m.read).length})</button>
      </div>
    </div>
    ${state.messages.length ? `
    <div class="adm-inbox">
      <ul class="adm-msgs">${shown.map((m) => `
        <li><button type="button" class="adm-msg ${m.read ? '' : 'unread'} ${open?.id === m.id ? 'active' : ''}" data-id="${m.id}">
          <span class="adm-av" aria-hidden="true">${escapeHtml((m.name || '?').trim()[0].toUpperCase())}</span>
          <span class="adm-msg-txt"><b>${escapeHtml(m.name)}</b><small>${escapeHtml(m.message.slice(0, 80))}</small></span>
          <time>${fmtDate(m.created_at)}</time>
        </button></li>`).join('') || '<li class="adm-empty">No unread messages 🎉</li>'}
      </ul>
      <div class="adm-read glass">${open ? `
        <div class="adm-read-head">
          <span class="adm-av lg" aria-hidden="true">${escapeHtml(open.name.trim()[0].toUpperCase())}</span>
          <div><h3>${escapeHtml(open.name)}</h3><a href="mailto:${escapeHtml(open.email)}">${escapeHtml(open.email)}</a></div>
          <time class="adm-muted">${new Date(open.created_at).toLocaleString()}</time>
        </div>
        <p class="adm-read-body">${escapeHtml(open.message)}</p>
        <div class="adm-actions">
          <a class="btn btn-primary" href="mailto:${escapeHtml(open.email)}?subject=${encodeURIComponent('Re: your message on my portfolio')}">Reply by email</a>
          <button class="adm-btn" type="button" data-read="${open.id}">${open.read ? 'Mark unread' : 'Mark read'}</button>
          <button class="adm-btn danger" type="button" data-delmsg="${open.id}">Delete</button>
        </div>` : '<p class="adm-empty">Select a message to read it.</p>'}
      </div>
    </div>` : `<p class="adm-empty">No messages yet. When visitors use “Let's build something.” on your homepage, they'll appear here.</p>`}`;

  panel.onclick = (e) => {
    const f = e.target.closest('[data-f]');
    if (f) { state.msgFilter = f.dataset.f; return renderMessages(); }
    const item = e.target.closest('.adm-msg');
    if (item) {
      const m = state.messages.find((x) => String(x.id) === item.dataset.id);
      state.openMsg = m.id;
      if (!m.read) guard(() => db.setMessageRead(m.id, true));
      else renderMessages();
      return;
    }
    const r = e.target.closest('[data-read]');
    if (r) {
      const m = state.messages.find((x) => String(x.id) === r.dataset.read);
      return guard(() => db.setMessageRead(m.id, !m.read));
    }
    const d = e.target.closest('[data-delmsg]');
    if (d && confirm('Delete this message?')) {
      state.openMsg = null;
      guard(() => db.deleteMessage(d.dataset.delmsg), 'Message deleted');
    }
  };
}

boot();
