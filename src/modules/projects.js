import { projects, filters } from '../data/projects.js';
import { $, escapeHtml, openDialog, reducedMotion, scrollToId } from './utils.js';

const state = { filter: 'all', query: '' };
const catLabel = { cv: 'Computer Vision', ml: 'Machine Learning', app: 'Web & Mobile' };

const haystack = (p) => [p.title, p.label, p.desc, p.metric, ...p.tags, ...p.highlights].join(' ').toLowerCase();
export const matchesQuery = (p, q) => !q || haystack(p).includes(q.toLowerCase());
const mobile = () => matchMedia('(max-width: 900px)').matches;
let active = null;

function visibleProjects() {
  return projects.filter((p) => (state.filter === 'all' || p.cats.includes(state.filter)) && matchesQuery(p, state.query));
}

const kindOf = (p) => (p.cats.includes('app') ? 'app' : p.cats[0] === 'cv' ? 'cv' : 'ml');

function vizHtml(p) {
  const k = kindOf(p);
  if (k === 'cv') return `<div class="pv pv-cv"><div class="pv-grid"></div><div class="pv-box"><span>${escapeHtml(p.metric)}</span></div><div class="pv-scan"></div></div>`;
  if (k === 'ml') {
    const L = [[30, [25, 50, 75]], [50, [15, 38, 62, 85]], [70, [30, 70]], [88, [50]]];
    let edges = '', nodes = '';
    L.forEach(([x, ys], i) => {
      ys.forEach((y) => {
        nodes += `<circle cx="${x}" cy="${y}" r="3.2"/>`;
        if (L[i + 1]) L[i + 1][1].forEach((y2) => { edges += `<line x1="${x}" y1="${y}" x2="${L[i + 1][0]}" y2="${y2}"/>`; });
      });
    });
    return `<div class="pv pv-ml"><svg viewBox="12 0 92 100" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g class="pv-e">${edges}</g><g class="pv-n">${nodes}</g></svg><span class="pv-out">${escapeHtml(p.metric)}</span></div>`;
  }
  return `<div class="pv pv-app"><div class="pv-win"><div class="pv-chrome"><i></i><i></i><i></i><span>${escapeHtml(p.title.toLowerCase().replace(/[^a-z]+/g, '-'))}.app</span></div>
    <div class="pv-page"><b></b><p></p><p></p><div class="pv-cards"><i></i><i></i><i></i></div></div></div><span class="pv-badge">${escapeHtml(p.metric)}</span></div>`;
}

function linksHtml(p) {
  return p.links.length
    ? p.links.map((l) => `<a class="btn btn-ghost" href="${escapeHtml(l.href)}" target="_blank" rel="noopener">${escapeHtml(l.label)} ↗</a>`).join('')
    : `<span class="px-note">${escapeHtml(p.note || '')}</span>`;
}

function detailHtml(p) {
  return `<p class="proj-desc">${escapeHtml(p.desc)}</p>
    <div class="proj-tags">${p.tags.map((t) => `<span>${escapeHtml(t)}</span>`).join('')}</div>
    <div class="px-actions"><button type="button" class="btn btn-primary" data-open="${p.slug}">Case study →</button>${linksHtml(p)}</div>`;
}

function panelHtml(p) {
  const n = projects.indexOf(p) + 1;
  return `<div class="px-swap">
    ${vizHtml(p)}
    <div class="proj-top"><span class="proj-class">${escapeHtml(p.label)}</span><span class="px-num">${String(n).padStart(2, '0')} / ${projects.length}</span></div>
    <h3 class="px-title">${escapeHtml(p.title)}</h3>
    ${detailHtml(p)}</div>`;
}

function setActive(slug, { force = false } = {}) {
  if (slug === active && !force) return;
  active = slug;
  const p = projects.find((x) => x.slug === slug);
  document.querySelectorAll('.px-item').forEach((li) => li.classList.toggle('on', li.dataset.slug === slug));
  if (p) $('#px-panel').innerHTML = panelHtml(p);
}

function render() {
  const list = visibleProjects();
  const ol = $('#px-list');
  ol.innerHTML = list.length
    ? list.map((p) => {
      const n = projects.indexOf(p) + 1;
      return `<li class="px-item" data-slug="${p.slug}">
        <button type="button" class="px-head" aria-haspopup="dialog">
          <span class="px-n">${String(n).padStart(2, '0')}</span>
          <span class="px-name">${escapeHtml(p.title)}<small>${escapeHtml(p.label)}</small></span>
          <span class="px-metric">${escapeHtml(p.metric)}</span>
          <span class="px-arrow" aria-hidden="true">↗</span>
        </button>
        <div class="px-inline">${detailHtml(p)}</div>
      </li>`;
    }).join('')
    : `<li class="px-empty">No projects match “${escapeHtml(state.query)}”. <button type="button" data-reset>Show all</button></li>`;

  const parts = [];
  if (state.filter !== 'all') parts.push(escapeHtml(filters.find((f) => f.id === state.filter).label));
  if (state.query) parts.push(`“${escapeHtml(state.query)}”`);
  $('.px-status').innerHTML = parts.length
    ? `<span>Showing ${list.length} of ${projects.length} · ${parts.join(' + ')}</span><button type="button" data-reset>Clear ✕</button>`
    : '';
  document.querySelectorAll('.wl-row').forEach((r) => r.classList.toggle('sel', r.dataset.filter === state.filter));
  $('#px-panel').hidden = !list.length;
  const keep = list.some((p) => p.slug === active);
  if (list.length) setActive(keep ? active : mobile() ? null : list[0].slug, { force: true });
}

function setFilter(id) {
  state.filter = id;
  render();
}

function reset() {
  state.query = '';
  setFilter('all');
}

export function showProjectsFor(query, filter = 'all') {
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
    setFilter(state.filter === r.dataset.filter ? 'all' : r.dataset.filter);
    $('#proj-explorer').scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  });
}

export function initProjects() {
  renderWorkLog();
  const sec = $('#projects');
  sec.addEventListener('click', (e) => {
    if (e.target.closest('[data-reset]')) return reset();
    const o = e.target.closest('[data-open]');
    if (o) return openProject(o.dataset.open);
    const head = e.target.closest('.px-head');
    if (!head) return;
    const slug = head.parentElement.dataset.slug;
    if (mobile()) setActive(slug === active ? null : slug);
    else openProject(slug);
  });
  const list = $('#px-list');
  const hover = (e) => {
    const li = e.target.closest('.px-item');
    if (li && !mobile()) setActive(li.dataset.slug);
  };
  list.addEventListener('pointerover', hover);
  list.addEventListener('focusin', hover);

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
