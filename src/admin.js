import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/blog.css';
import './styles/admin.css';

import { marked } from 'marked';
import DOMPurify from 'dompurify';
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
const md = (s) => DOMPurify.sanitize(marked.parse(s || '', { gfm: true }));
const state = { tab: 'posts', posts: [], messages: [], msgFilter: 'all', openMsg: null };

/* ---------------- login ---------------- */
function renderLogin(error = '') {
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
        <p class="adm-muted">Sign in to write posts and read messages from the contact form.</p>
        ${db.isConfigured ? `
        <form id="login-form" class="adm-form" novalidate>
          <label>Email<input name="email" type="email" autocomplete="username" required></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
          <p class="adm-error" role="alert">${escapeHtml(error)}</p>
          <button class="btn btn-primary" type="submit"><span class="btn-label">Sign in</span></button>
        </form>` : `
        <button class="btn btn-primary" type="button" id="demo-btn">Open demo dashboard →</button>`}
      </div>
      ${setup}
    </section>`;
  $('#demo-btn')?.addEventListener('click', () => { db.enterDemo(); boot(); });
  const form = $('#login-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('button', form);
    btn.disabled = true;
    $('.btn-label', btn).textContent = 'Signing in…';
    try {
      await db.signIn(form.email.value.trim(), form.password.value);
      boot();
    } catch (err) {
      renderLogin(err.message || 'Sign in failed.');
    }
  });
  form?.email.focus();
}

/* ---------------- dashboard shell ---------------- */
async function boot() {
  const user = db.currentUser();
  if (!user) return renderLogin();
  root.innerHTML = '<p class="page-state">Loading dashboard…</p>';
  try {
    [state.posts, state.messages] = await Promise.all([db.adminListPosts(), db.listMessages()]);
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
  const published = state.posts.filter((p) => p.published).length;
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
          <button class="btn btn-ghost" id="sign-out" type="button">Sign out</button>
        </div>
      </div>
      <div class="adm-stats">
        <div class="adm-stat glass"><b>${state.posts.length}</b><span>Total posts</span></div>
        <div class="adm-stat glass"><b>${published}</b><span>Published</span></div>
        <div class="adm-stat glass"><b>${state.posts.length - published}</b><span>Drafts</span></div>
        <div class="adm-stat glass ${unread ? 'hot' : ''}"><b>${unread}</b><span>Unread messages</span></div>
      </div>
      <div class="adm-tabs" role="tablist">
        <button role="tab" type="button" data-tab="posts" aria-selected="${state.tab === 'posts'}">Posts</button>
        <button role="tab" type="button" data-tab="messages" aria-selected="${state.tab === 'messages'}">Messages ${unread ? `<i>${unread}</i>` : ''}</button>
      </div>
      <div id="adm-panel" role="tabpanel"></div>
    </section>`;
  $('#sign-out').onclick = async () => { await db.signOut(); renderLogin(); };
  $$('.adm-tabs [data-tab]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; renderShell(); }));
  state.tab === 'posts' ? renderPosts() : renderMessages();
}

async function refresh() {
  [state.posts, state.messages] = await Promise.all([db.adminListPosts(), db.listMessages()]);
  renderShell();
}

const guard = async (fn, ok) => {
  try { await fn(); if (ok) toast(ok); await refresh(); }
  catch (err) { toast(err.message || 'Something went wrong'); }
};

/* ---------------- posts ---------------- */
function renderPosts() {
  const panel = $('#adm-panel');
  panel.innerHTML = `
    <div class="adm-bar"><h2>Posts</h2><button class="btn btn-primary" id="new-post" type="button">+ New post</button></div>
    ${state.posts.length ? `<ul class="adm-list">${state.posts.map((p) => `
      <li class="adm-row glass">
        <div class="adm-row-main">
          <span class="adm-pill ${p.published ? 'on' : ''}">${p.published ? 'Published' : 'Draft'}</span>
          <h3>${escapeHtml(p.title)}</h3>
          <p class="adm-muted">/${escapeHtml(p.slug)} · ${fmtDate(p.created_at)} · ${(p.tags || []).map(escapeHtml).join(', ') || 'no tags'}</p>
        </div>
        <div class="adm-actions">
          ${p.published ? `<a class="adm-btn" href="./blog.html?post=${encodeURIComponent(p.slug)}" target="_blank" rel="noopener">View</a>` : ''}
          <button class="adm-btn" data-toggle="${p.id}" type="button">${p.published ? 'Unpublish' : 'Publish'}</button>
          <button class="adm-btn" data-edit="${p.id}" type="button">Edit</button>
          <button class="adm-btn danger" data-del="${p.id}" type="button">Delete</button>
        </div>
      </li>`).join('')}</ul>` : '<p class="adm-empty">No posts yet — write your first one.</p>'}`;
  $('#new-post').onclick = () => renderEditor();
  panel.onclick = (e) => {
    const t = e.target;
    const find = (id) => state.posts.find((p) => String(p.id) === id);
    if (t.dataset.edit) renderEditor(find(t.dataset.edit));
    if (t.dataset.toggle) {
      const p = find(t.dataset.toggle);
      guard(() => db.savePost({ ...p, published: !p.published }), p.published ? 'Moved to drafts' : 'Published ✓');
    }
    if (t.dataset.del) {
      const p = find(t.dataset.del);
      if (confirm(`Delete “${p.title}”? This cannot be undone.`)) guard(() => db.deletePost(p.id), 'Post deleted');
    }
  };
}

function renderEditor(post = null) {
  const p = post || { title: '', slug: '', excerpt: '', content: '', tags: [], cover_url: '', published: false };
  let slugTouched = !!post;
  const panel = $('#adm-panel');
  panel.onclick = null;
  panel.innerHTML = `
    <form class="adm-editor" id="post-form" novalidate>
      <div class="adm-bar">
        <button class="adm-btn" type="button" id="ed-back">← Back to posts</button>
        <div class="adm-actions">
          <label class="adm-switch"><input type="checkbox" name="published" ${p.published ? 'checked' : ''}><span></span>Published</label>
          <button class="btn btn-primary" type="submit"><span class="btn-label">${post ? 'Save changes' : 'Create post'}</span></button>
        </div>
      </div>
      <div class="adm-fields glass">
        <label class="wide">Title<input name="title" required maxlength="200" value="${escapeHtml(p.title)}" placeholder="What did you build or learn?"></label>
        <label>Slug<input name="slug" maxlength="80" value="${escapeHtml(p.slug)}" placeholder="auto-from-title"></label>
        <label>Tags <small>comma separated</small><input name="tags" value="${escapeHtml((p.tags || []).join(', '))}" placeholder="Computer Vision, XAI"></label>
        <label class="wide">Excerpt <small>shown on cards</small><textarea name="excerpt" rows="2" maxlength="400">${escapeHtml(p.excerpt || '')}</textarea></label>
        <label class="wide">Cover image URL <small>optional</small><input name="cover_url" type="url" value="${escapeHtml(p.cover_url || '')}" placeholder="https://…"></label>
      </div>
      <div class="adm-md">
        <div class="adm-md-tabs" role="tablist">
          <button type="button" data-view="write" aria-selected="true">Write</button>
          <button type="button" data-view="preview" aria-selected="false">Preview</button>
          <span class="adm-muted" id="ed-stats"></span>
        </div>
        <div class="adm-md-grid" data-view="write">
          <textarea name="content" spellcheck="true" placeholder="Write in Markdown — ## headings, **bold**, lists, \`code\`, [links](https://…)">${escapeHtml(p.content || '')}</textarea>
          <div class="prose adm-preview" aria-live="polite"></div>
        </div>
      </div>
      <p class="adm-error" role="alert"></p>
    </form>`;
  const form = $('#post-form');
  const preview = $('.adm-preview', form);
  const stats = $('#ed-stats');
  const update = () => {
    preview.innerHTML = md(form.content.value) || '<p class="adm-muted">Nothing to preview yet.</p>';
    const words = form.content.value.split(/\s+/).filter(Boolean).length;
    stats.textContent = `${words} words · ${db.readingTime(form.content.value)} min read`;
  };
  update();
  form.content.addEventListener('input', update);
  form.title.addEventListener('input', () => { if (!slugTouched) form.slug.value = db.slugify(form.title.value); });
  form.slug.addEventListener('input', () => { slugTouched = true; });
  form.slug.addEventListener('blur', () => { if (form.slug.value) form.slug.value = db.slugify(form.slug.value); });
  $$('.adm-md-tabs [data-view]', form).forEach((b) => b.addEventListener('click', () => {
    $$('.adm-md-tabs [data-view]', form).forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    $('.adm-md-grid', form).dataset.view = b.dataset.view;
  }));
  $('#ed-back').onclick = () => {
    if (form.dataset.dirty && !confirm('Discard unsaved changes?')) return;
    renderShell();
  };
  form.addEventListener('input', () => { form.dataset.dirty = '1'; });
  form.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); form.requestSubmit(); }
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('.adm-error', form);
    if (!form.title.value.trim()) { err.textContent = 'Title is required.'; form.title.focus(); return; }
    const btn = $('button[type=submit]', form);
    btn.disabled = true;
    try {
      await db.savePost({
        id: post?.id,
        title: form.title.value,
        slug: form.slug.value || form.title.value,
        excerpt: form.excerpt.value,
        content: form.content.value,
        cover_url: form.cover_url.value,
        tags: form.tags.value.split(',').map((t) => t.trim()).filter(Boolean),
        published: form.published.checked
      });
      toast(post ? 'Saved ✓' : 'Post created ✓');
      state.tab = 'posts';
      await refresh();
    } catch (ex) {
      err.textContent = ex.message;
      btn.disabled = false;
    }
  });
  form.title.focus();
}

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
