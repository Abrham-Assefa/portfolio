import { skills } from '../data/skills.js';
import { projects } from '../data/projects.js';
import { $, escapeHtml } from './utils.js';
import { matchesQuery, showProjectsFor } from './projects.js';
import { observeReveals } from './reveal.js';
import { bindTilt } from './effects.js';

const domains = [
  { id: 'cv', label: 'Computer Vision', color: '#FF7A1A' },
  { id: 'ml', label: 'Machine Learning', color: '#FF4D6D' },
  { id: 'app', label: 'Web & Mobile', color: '#FFB36B' }
];

export function initSkills() {
  // infinite marquee: two rows, opposite directions; content duplicated for a seamless loop
  const all = skills.flatMap((s) => s.tags.map((t) => [t, s.id]));
  const pill = ([t, id]) => `<span class="mq-pill mq-${id}"><i></i>${escapeHtml(t)}</span>`;
  const half = Math.ceil(all.length / 2);
  [['#mq-a', all.slice(0, half)], ['#mq-b', all.slice(half)]].forEach(([sel, items]) => {
    const el = $(sel);
    if (el) el.innerHTML = (items.map(pill).join('')).repeat(2);
  });

  const grid = $('#skills-grid');
  grid.innerHTML = skills.map((s) => {
    const tagHtml = s.tags.map((t) => {
      const n = projects.filter((p) => matchesQuery(p, t)).length;
      const label = n ? `${t} — used in ${n} project${n > 1 ? 's' : ''}` : t;
      return `<button type="button" class="skill-tag" data-skill="${escapeHtml(t)}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${escapeHtml(t)}${n ? `<sup>${n}</sup>` : ''}</button>`;
    }).join('');
    return `
      <div class="skill-card glass bbox tilt reveal">
        <span class="bbox-tag">${escapeHtml(s.id)} · ${s.tags.length} tools</span>
        <div class="skill-head"><div class="skill-cat">${escapeHtml(s.cat)}</div><span class="skill-icon" aria-hidden="true">${s.icon}</span></div>
        <div class="skill-tags">${tagHtml}</div>
      </div>`;
  }).join('');
  grid.addEventListener('click', (e) => {
    const tag = e.target.closest('.skill-tag');
    if (tag) showProjectsFor(tag.dataset.skill);
  });
  observeReveals(grid);
  bindTilt(grid);

  // donut: project count per domain (a project can belong to multiple domains)
  const counts = domains.map((d) => ({ ...d, n: projects.filter((p) => p.cats.includes(d.id)).length }));
  const total = counts.reduce((a, c) => a + c.n, 0);
  const R = 48, C = 2 * Math.PI * R, GAP = 2;
  let offset = 0;
  const svg = $('.donut');
  svg.innerHTML = `<circle class="track" cx="60" cy="60" r="${R}"/>` + counts.map((c) => {
    const len = (c.n / total) * C - GAP;
    const el = `<circle cx="60" cy="60" r="${R}" stroke="${c.color}" style="stroke-dasharray:0 ${C}" data-len="${len}" stroke-dashoffset="${-offset}" data-domain="${c.id}"/>`;
    offset += len + GAP;
    return el;
  }).join('');
  $('#donut-total').textContent = projects.length;
  $('#donut-legend').innerHTML = counts.map((c) =>
    `<li><button type="button" data-domain="${c.id}"><i style="background:${c.color}"></i>${escapeHtml(c.label)}<b>${c.n}</b></button></li>`
  ).join('');
  $('#donut-legend').addEventListener('click', (e) => {
    const b = e.target.closest('[data-domain]');
    if (b) showProjectsFor('', b.dataset.domain);
  });
  const legend = $('#donut-legend');
  legend.addEventListener('pointerover', (e) => {
    const id = e.target.closest('[data-domain]')?.dataset.domain;
    svg.querySelectorAll('[data-domain]').forEach((c) => (c.style.opacity = !id || c.dataset.domain === id ? 1 : 0.25));
  });
  legend.addEventListener('pointerleave', () => svg.querySelectorAll('[data-domain]').forEach((c) => (c.style.opacity = 1)));

  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    svg.querySelectorAll('[data-len]').forEach((c) => (c.style.strokeDasharray = `${c.dataset.len} ${C}`));
    io.disconnect();
  }, { threshold: 0.4 }).observe(svg);
}
