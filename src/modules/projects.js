import { projects, filters } from '../data/projects.js';
import { $, escapeHtml, openDialog, reducedMotion, scrollToId } from './utils.js';
import { bindTilt } from './effects.js';

const state = { filter: 'all', query: '' };
const grid = () => $('#proj-grid');
const catLabel = { cv: 'Computer Vision', ml: 'Machine Learning', app: 'Web & Mobile' };

const haystack = (p) => [p.title, p.label, p.desc, p.metric, ...p.tags, ...p.highlights].join(' ').toLowerCase();

function highlight(text, q) {
  const safe = escapeHtml(text);
  if (!q) return safe;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return safe.replace(re, '<mark>$1</mark>');
}

export const matchesQuery = (p, q) => !q || haystack(p).includes(q.toLowerCase());

function visibleProjects() {
  return projects.filter((p) => (state.filter === 'all' || p.cats.includes(state.filter)) && matchesQuery(p, state.query));
}

function cardHtml(p, i) {
  const q = state.query;
  const linkNote = p.links.length ? `${escapeHtml(p.links[0].label)} ↗` : escapeHtml(p.note || '');
  return `
  <article class="proj-card glass bbox tilt enter${p.featured ? ' featured' : ''}" data-slug="${p.slug}" style="--d:${Math.min(i, 8) * 50}ms">
    <span class="bbox-tag" aria-hidden="true">detected: ${escapeHtml(p.cats.join(' + '))}</span>
    <div class="proj-top">
      <span class="proj-class">${escapeHtml(p.label)}</span>
      <span class="proj-conf">${escapeHtml(p.metric)}</span>
    </div>
    <h3 class="proj-title"><button type="button" class="proj-open" aria-haspopup="dialog">${highlight(p.title, q)}</button></h3>
    <p class="proj-desc">${highlight(p.desc, q)}</p>
    <div class="proj-tags">${p.tags.map((t) => `<span>${highlight(t, q)}</span>`).join('')}</div>
    <div class="proj-foot"><span class="note">${linkNote}</span><span class="more" aria-hidden="true">Details <span>→</span></span></div>
  </article>`;
}

function render() {
  const list = visibleProjects();
  const g = grid();
  g.innerHTML = list.length
    ? list.map(cardHtml).join('')
    : `<div class="proj-empty">No projects match “${escapeHtml(state.query)}”. <button type="button" data-reset>Reset filters</button></div>`;
  $('.proj-count').textContent = `Showing ${list.length} of ${projects.length} projects`;
  bindTilt(g);
}

function setFilter(id) {
  state.filter = id;
  document.querySelectorAll('.fbtn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === id)));
  render();
}

export function showProjectsFor(query, filter = 'all') {
  const input = $('#proj-search');
  input.value = query;
  state.query = query.trim();
  setFilter(filter);
  scrollToId('projects');
}

/* ---------- modal ---------- */
let current = -1;

function modalHtml(p) {
  const links = p.links.map((l) => `<a class="btn btn-primary" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)} ↗</a>`).join('');
  const note = !p.links.length && p.note ? `<span class="btn btn-ghost" aria-disabled="true">${escapeHtml(p.note)}</span>` : '';
  const prev = projects[(current - 1 + projects.length) % projects.length];
  const next = projects[(current + 1) % projects.length];
  return `
    <div class="proj-top"><span class="proj-class">${escapeHtml(p.label)}</span><span class="proj-conf">${escapeHtml(p.metric)}</span></div>
    <h3 id="modal-title">${escapeHtml(p.title)}</h3>
    <p class="proj-desc">${escapeHtml(p.desc)}</p>
    <h4>Highlights</h4>
    <ul class="hl">${p.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
    <h4>Stack &amp; domain</h4>
    <div class="proj-tags">${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}${p.cats.map((c) => `<span>${catLabel[c]}</span>`).join('')}</div>
    <div class="modal-links">${links}${note}</div>
    <div class="modal-nav">
      <button type="button" data-go="${prev.slug}">← ${escapeHtml(prev.title)}</button>
      <button type="button" data-go="${next.slug}">${escapeHtml(next.title)} →</button>
    </div>`;
}

export function openProject(slug, { updateHash = true } = {}) {
  const idx = projects.findIndex((p) => p.slug === slug);
  if (idx < 0) return;
  current = idx;
  const dlg = $('#proj-modal');
  $('.modal-body', dlg).innerHTML = modalHtml(projects[idx]);
  if (updateHash) history.replaceState(null, '', `#project/${slug}`);
  if (!dlg.open) {
    openDialog(dlg, {
      onClose: () => {
        if (location.hash.startsWith('#project/')) history.replaceState(null, '', '#projects');
      }
    });
  }
  $('.modal-inner', dlg).scrollTop = 0;
  $('.modal-close', dlg).focus();
}

export const projectList = projects;

function renderWorkLog() {
  const el = $('#work-log');
  if (!el) return;
  const max = Math.max(...filters.filter((f) => f.id !== 'all').map((f) => projects.filter((p) => p.cats.includes(f.id)).length));
  const rows = filters.filter((f) => f.id !== 'all').map((f, i) => {
    const n = projects.filter((p) => p.cats.includes(f.id)).length;
    return `<button type="button" class="wl-row wl-${f.id}" data-filter="${f.id}" style="--w:${(n / max) * 100}%;--d:${300 + i * 150}ms">
      <span class="wl-name">${escapeHtml(f.label)}</span><span class="wl-track"><i></i></span><b>${n}</b></button>`;
  }).join('');
  el.innerHTML = `
    <p class="wl-cmd"><span class="wl-p">$</span> ls ./projects --by-domain</p>
    ${rows}
    <p class="wl-total"><span class="wl-ok">✓</span> ${projects.length} projects · ${projects.filter((p) => p.featured).length} featured<span class="wl-caret" aria-hidden="true"></span></p>`;
  el.addEventListener('click', (e) => {
    const r = e.target.closest('.wl-row');
    if (!r) return;
    setFilter(r.dataset.filter);
    $('.proj-toolbar').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}

export function initProjects() {
  renderWorkLog();
  // filter buttons with counts
  const fbar = $('.proj-filter');
  fbar.innerHTML = filters.map((f) => {
    const n = f.id === 'all' ? projects.length : projects.filter((p) => p.cats.includes(f.id)).length;
    return `<button type="button" class="fbtn" data-filter="${f.id}" aria-pressed="${f.id === 'all'}">${escapeHtml(f.label)} <small>${n}</small></button>`;
  }).join('');
  fbar.addEventListener('click', (e) => {
    const b = e.target.closest('.fbtn');
    if (b) setFilter(b.dataset.filter);
  });

  let t;
  $('#proj-search').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { state.query = e.target.value.trim(); render(); }, 120);
  });

  grid().addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) {
      $('#proj-search').value = '';
      state.query = '';
      setFilter('all');
      return;
    }
    const card = e.target.closest('.proj-card');
    if (card) openProject(card.dataset.slug);
  });

  const dlg = $('#proj-modal');
  $('.modal-close', dlg).addEventListener('click', () => dlg._close?.());
  dlg.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) openProject(go.dataset.go);
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'ArrowRight') openProject(projects[(current + 1) % projects.length].slug);
    if (e.key === 'ArrowLeft') openProject(projects[(current - 1 + projects.length) % projects.length].slug);
  });

  render();

  const fromHash = () => {
    const m = location.hash.match(/^#project\/([\w-]+)/);
    if (m) {
      document.getElementById('projects')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'instant' });
      openProject(m[1], { updateHash: false });
    }
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}
