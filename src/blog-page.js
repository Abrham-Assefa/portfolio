import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/blog.css';
import './styles/animations.css';

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { $, escapeHtml, toast } from './modules/utils.js';
import { initTheme } from './modules/theme.js';
import { initNav } from './modules/nav.js';
import { observeReveals } from './modules/reveal.js';
import { postCard, fmtDate } from './modules/blog.js';
import { listPublishedPosts, readingTime } from './lib/backend.js';

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
initTheme();
initNav();

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && /^https?:/i.test(node.getAttribute('href') || '')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});
export const renderMarkdown = (md) => DOMPurify.sanitize(marked.parse(md || '', { gfm: true, breaks: false }));

const indexEl = $('#blog-index');
const postEl = $('#post-view');
const list = $('#blog-list');
const chips = $('#tag-chips');
const q = $('#blog-q');
const count = $('#blog-count');
const progress = $('.read-progress');
let posts = [];
let activeTag = 'All';

function renderList() {
  const term = q.value.trim().toLowerCase();
  const shown = posts.filter((p) =>
    (activeTag === 'All' || (p.tags || []).includes(activeTag)) &&
    (!term || `${p.title} ${p.excerpt} ${(p.tags || []).join(' ')} ${p.content}`.toLowerCase().includes(term)));
  list.classList.toggle('filtered', activeTag !== 'All' || !!term);
  list.innerHTML = shown.length
    ? shown.map((p, i) => postCard(p, i)).join('')
    : '<p class="blog-empty">No posts match — try another tag or search.</p>';
  count.textContent = `${shown.length} ${shown.length === 1 ? 'post' : 'posts'}${activeTag !== 'All' ? ` in ${activeTag}` : ''}`;
  observeReveals(list);
}

function renderChips() {
  const tags = ['All', ...new Set(posts.flatMap((p) => p.tags || []))];
  chips.innerHTML = tags.map((t) => `<button type="button" class="chip" aria-pressed="${t === activeTag}" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('');
}

function showPost(slug) {
  const i = posts.findIndex((p) => p.slug === slug);
  const p = posts[i];
  indexEl.hidden = true;
  postEl.hidden = false;
  progress.hidden = false;
  if (!p) {
    document.title = 'Post not found — Abrham Assefa';
    postEl.innerHTML = `<div class="page-state"><h1>Post not found</h1><p>It may have been moved or unpublished.</p><p><a class="btn btn-primary" href="./blog.html">Back to the blog</a></p></div>`;
    return;
  }
  document.title = `${p.title} — Abrham Assefa`;
  document.querySelector('meta[name="description"]')?.setAttribute('content', p.excerpt || p.title);
  const newer = posts[i - 1];
  const older = posts[i + 1];
  postEl.innerHTML = `
    <a class="post-back" href="./blog.html">← All posts</a>
    <div class="post-meta"><time datetime="${escapeHtml(p.created_at)}">${fmtDate(p.created_at)}</time><span>${readingTime(p.content)} min read</span>
      <div class="post-tags">${(p.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div></div>
    <h1>${escapeHtml(p.title)}</h1>
    ${p.excerpt ? `<p class="post-lede">${escapeHtml(p.excerpt)}</p>` : ''}
    ${p.cover_url ? `<figure class="post-cover"><img src="${escapeHtml(p.cover_url)}" alt=""></figure>` : ''}
    <hr class="post-rule">
    <div class="prose">${renderMarkdown(p.content)}</div>
    <div class="post-foot">
      <span class="post-meta">Written by Abrham Assefa</span>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button type="button" class="btn btn-ghost" id="share-post">Copy link</button>
        <a class="btn btn-primary" href="./#contact">Let's talk →</a>
      </div>
    </div>
    <nav class="post-nav" aria-label="More posts">
      ${newer ? `<a href="?post=${encodeURIComponent(newer.slug)}"><small>← Newer</small>${escapeHtml(newer.title)}</a>` : ''}
      ${older ? `<a class="next" href="?post=${encodeURIComponent(older.slug)}"><small>Older →</small>${escapeHtml(older.title)}</a>` : ''}
    </nav>`;
  $('#share-post').addEventListener('click', async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.title, url: location.href });
      else { await navigator.clipboard.writeText(location.href); toast('Link copied ✓'); }
    } catch {}
  });
  scrollTo(0, 0);
}

function route() {
  const slug = new URLSearchParams(location.search).get('post');
  if (slug) return showPost(slug);
  document.title = 'Blog — Abrham Assefa';
  postEl.hidden = true;
  progress.hidden = true;
  indexEl.hidden = false;
  renderList();
}

// keep navigation inside the page (no full reload) for post links
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin || url.pathname !== location.pathname) return;
  e.preventDefault();
  history.pushState({}, '', url);
  route();
});
addEventListener('popstate', route);

chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  activeTag = b.dataset.tag;
  renderChips();
  renderList();
});
q.addEventListener('input', renderList);

addEventListener('scroll', () => {
  if (postEl.hidden) return;
  const r = postEl.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
  progress.style.setProperty('--rp', p.toFixed(3));
}, { passive: true });

(async () => {
  try {
    posts = await listPublishedPosts();
  } catch {
    list.innerHTML = '<p class="blog-empty">Couldn\'t load posts right now. Please try again later.</p>';
    list.removeAttribute('aria-busy');
    return;
  }
  list.removeAttribute('aria-busy');
  renderChips();
  route();
})();
