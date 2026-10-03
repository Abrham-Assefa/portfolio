import { escapeHtml } from './utils.js';
import { listPublishedPosts, readingTime } from '../lib/backend.js';
import { observeReveals } from './reveal.js';

export const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export function postCard(p, i = 0, base = './') {
  const tags = (p.tags || []).slice(0, 3).map((t) => `<span>${escapeHtml(t)}</span>`).join('');
  const href = `${base}blog.html?post=${encodeURIComponent(p.slug)}`;
  const cover = p.cover_url
    ? `<img src="${escapeHtml(p.cover_url)}" alt="" loading="lazy">`
    : `<span class="pc-glyph" aria-hidden="true">${escapeHtml((p.title || '?').trim()[0])}</span>`;
  return `<article class="post-card reveal">
    <a href="${href}" class="pc-link" aria-label="${escapeHtml(p.title)}"></a>
    <div class="pc-cover" data-n="${String(i + 1).padStart(2, '0')}">${cover}</div>
    <div class="pc-body">
      <div class="pc-meta"><time datetime="${escapeHtml(p.created_at)}">${fmtDate(p.created_at)}</time><span>${readingTime(p.content)} min read</span></div>
      <h3>${escapeHtml(p.title)}</h3>
      <p>${escapeHtml(p.excerpt || '')}</p>
      <div class="pc-foot"><div class="pc-tags">${tags}</div><span class="pc-go" aria-hidden="true">Read →</span></div>
    </div>
  </article>`;
}

export async function initBlog() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  try {
    const posts = await listPublishedPosts(3);
    grid.innerHTML = posts.length
      ? posts.map((p, i) => postCard(p, i)).join('')
      : '<p class="blog-empty">First post coming soon.</p>';
  } catch {
    grid.innerHTML = '<p class="blog-empty">Posts are unavailable right now — <a href="./blog.html">open the blog</a>.</p>';
  }
  grid.removeAttribute('aria-busy');
  observeReveals(grid);
}
