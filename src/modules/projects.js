import { projects, filters } from '../data/projects.js';
import { $, escapeHtml, openDialog, reducedMotion, scrollToId } from './utils.js';

const catLabel = { cv: 'Computer Vision', ml: 'Machine Learning', app: 'Web & Mobile' };
const haystack = (p) => [p.title, p.label, p.desc, p.metric, ...p.tags, ...p.highlights].join(' ').toLowerCase();
export const matchesQuery = (p, q) => !q || haystack(p).includes(q.toLowerCase());

const featured = projects.filter((p) => p.featured);
const rest = projects.filter((p) => !p.featured);
const pad = (n) => String(n).padStart(2, '0');
const kindOf = (p) => (p.cats.includes('app') ? 'app' : p.cats[0] === 'cv' ? 'cv' : 'ml');
const ICON = { cv: '◎', ml: '⌬', app: '▣' };

function vizHtml(p) {
  const k = kindOf(p);
  if (k === 'cv') return `<div class="pv pv-cv"><div class="pv-grid"></div><div class="pv-box"><span>${escapeHtml(p.metric)}</span></div><div class="pv-scan"></div></div>`;
  if (k === 'ml') {
    const L = [[22, [25, 50, 75]], [44, [15, 38, 62, 85]], [66, [30, 70]], [86, [50]]];
    let edges = '', nodes = '';
    L.forEach(([x, ys], i) => ys.forEach((y) => {
      nodes += `<circle cx="${x}" cy="${y}" r="3.2"/>`;
      if (L[i + 1]) L[i + 1][1].forEach((y2) => { edges += `<line x1="${x}" y1="${y}" x2="${L[i + 1][0]}" y2="${y2}"/>`; });
    }));
    return `<div class="pv pv-ml"><svg viewBox="8 0 92 100" aria-hidden="true"><g class="pv-e">${edges}</g><g class="pv-n">${nodes}</g></svg></div>`;
  }
  return `<div class="pv pv-app"><div class="pv-win"><div class="pv-chrome"><i></i><i></i><i></i></div><div class="pv-page"><b></b><p></p><p></p><div class="pv-cards"><i></i><i></i><i></i></div></div></div></div>`;
}

function linkHtml(p) {
  return p.links.length
    ? p.links.map((l) => `<a class="btn btn-ghost" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)} ↗</a>`).join('')
    : `<span class="pj-note">${escapeHtml(p.note || '')}</span>`;
}

function stackCard(p, i) {
  return `<article class="st-card st-${kindOf(p)}" data-slug="${p.slug}" style="--i:${i}">
    <div class="st-body">
      <div class="st-meta"><span class="st-num">${pad(i + 1)}</span><span class="proj-class">${escapeHtml(p.label)}</span></div>
      <h3 class="st-title">${escapeHtml(p.title)}</h3>
      <p class="st-desc">${escapeHtml(p.desc)}</p>
      <ul class="st-hl">${p.highlights.slice(0, 3).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>
      <div class="proj-tags">${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
      <div class="st-actions"><button type="button" class="btn btn-primary" data-open="${p.slug}">Case study →</button>${linkHtml(p)}</div>
    </div>
    <div class="st-visual">${vizHtml(p)}<div class="st-metric"><small>result</small><b>${escapeHtml(p.metric)}</b></div></div>
  </article>`;
}

function moreTile(p, i) {
  const k = kindOf(p);
  return `<button type="button" class="mt mt-${k}" data-open="${p.slug}" aria-haspopup="dialog">
    <span class="mt-top"><span class="mt-ico" aria-hidden="true">${ICON[k]}</span><span class="mt-num">${pad(featured.length + i + 1)}</span></span>
    <span class="mt-title">${escapeHtml(p.title)}</span>
    <span class="mt-label">${escapeHtml(p.label)}</span>
    <span class="mt-foot"><span class="mt-metric">${escapeHtml(p.metric)}</span><span class="mt-go" aria-hidden="true">↗</span></span>
  </button>`;
}

/* ---------- highlight from skills / donut ---------- */
function applyFocus(query, filter) {
  const q = query.trim();
  const on = q || filter !== 'all';
  let n = 0;
  document.querySelectorAll('#projects [data-slug], #projects .mt[data-open]').forEach((el) => {
    const p = projects.find((x) => x.slug === (el.dataset.slug || el.dataset.open));
    const hit = (filter === 'all' || p.cats.includes(filter)) && matchesQuery(p, q);
    if (hit) n++;
    el.classList.toggle('pj-dim', on && !hit);
    el.classList.toggle('pj-hit', on && hit);
  });
  const label = [filter !== 'all' && filters.find((f) => f.id === filter)?.label, q && `“${q}”`].filter(Boolean).map(escapeHtml).join(' + ');
  $('.pj-status').innerHTML = on
    ? `<span>${n ? `Highlighting ${n} project${n > 1 ? 's' : ''}` : 'No projects'} for ${label}</span><button type="button" data-clear>Clear ✕</button>`
    : '';
}

export function showProjectsFor(query, filter = 'all') {
  applyFocus(query, filter);
  scrollToId('projects');
}

/* ---------- stacking scroll effect ---------- */
function initStackFx() {
  const cards = [...document.querySelectorAll('.st-card')];
  if (reducedMotion() || !cards.length) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return c.style.setProperty('--p', 0);
      const a = c.getBoundingClientRect();
      const b = next.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
      c.style.setProperty('--p', p.toFixed(3));
    });
  };
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update);
  update();
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

export function initProjects() {
  $('#pj-stack').innerHTML = featured.map(stackCard).join('');
  $('#pj-more').innerHTML = rest.map(moreTile).join('') + `<a class="mt mt-cta" href="https://github.com/Abrham-Assefa" target="_blank" rel="noopener">
    <span class="mt-top"><span class="mt-ico" aria-hidden="true">↗</span></span>
    <span class="mt-title">More on GitHub</span><span class="mt-label">Notebooks, experiments &amp; source</span>
    <span class="mt-foot"><span class="mt-metric">@Abrham-Assefa</span><span class="mt-go" aria-hidden="true">→</span></span></a>`;
  $('#pj-more-count').textContent = `${rest.length} more · ${projects.length} total`;

  const sec = $('#projects');
  sec.addEventListener('click', (e) => {
    if (e.target.closest('[data-clear]')) return applyFocus('', 'all');
    const o = e.target.closest('[data-open]');
    if (o) openProject(o.dataset.open);
  });
  $('#pj-more').addEventListener('pointermove', (e) => {
    const t = e.target.closest('.mt');
    if (!t) return;
    const r = t.getBoundingClientRect();
    t.style.setProperty('--mx', `${e.clientX - r.left}px`);
    t.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
  initStackFx();

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
