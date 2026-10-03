import { $, escapeHtml, openDialog, copyEmail, scrollToId } from './utils.js';
import { toggleTheme } from './theme.js';
import { openProject, projectList } from './projects.js';

const SECTIONS = [
  ['top', 'Home', '⌂'], ['about', 'About', '◉'], ['skills', 'Skills', '⚙'], ['projects', 'Projects', '▦'],
  ['experience', 'Experience', '↗'], ['github', 'GitHub activity', '⌥'], ['contact', 'Contact', '✉']
];

function buildCommands() {
  const cmds = [
    ...SECTIONS.map(([id, label, icon]) => ({ group: 'Navigate', label: `Go to ${label}`, icon, run: () => scrollToId(id) })),
    ...projectList.map((p) => ({ group: 'Projects', label: p.title, hint: p.label, icon: '◇', keywords: p.tags.join(' '), run: () => openProject(p.slug) })),
    { group: 'Actions', label: 'Toggle dark / light theme', icon: '◐', hint: 'T', run: toggleTheme },
    { group: 'Actions', label: 'Copy email address', icon: '⧉', run: copyEmail },
    { group: 'Actions', label: 'Send an email', icon: '✉', run: () => (location.href = 'mailto:abrhamassefa759@gmail.com') },
    { group: 'Links', label: 'GitHub — Abrham-Assefa', icon: '⌥', run: () => open('https://github.com/Abrham-Assefa', '_blank', 'noopener') },
    { group: 'Links', label: 'GitHub — abrham-cyper', icon: '⌥', run: () => open('https://github.com/abrham-cyper', '_blank', 'noopener') },
    { group: 'Links', label: 'LinkedIn', icon: 'in', run: () => open('https://www.linkedin.com/in/abrham-assefa-1599b1251', '_blank', 'noopener') }
  ];
  const resume = $('.resume-btn');
  if (resume && !resume.hidden) cmds.push({ group: 'Actions', label: 'Download résumé', icon: '↓', run: () => resume.click() });
  return cmds;
}

// simple fuzzy score: all chars in order, bonus for contiguous/word-start
function score(text, q) {
  if (!q) return 1;
  text = text.toLowerCase();
  if (text.includes(q)) return 100 - text.indexOf(q);
  let ti = 0, s = 0;
  for (const ch of q) {
    const i = text.indexOf(ch, ti);
    if (i < 0) return 0;
    s += i === ti ? 3 : 1;
    ti = i + 1;
  }
  return s;
}

export function initPalette() {
  const dlg = $('#palette');
  const input = $('input', dlg);
  const list = $('#palette-list');
  let items = [], active = 0;

  const render = () => {
    const q = input.value.trim().toLowerCase();
    items = buildCommands()
      .map((c) => ({ ...c, s: score(`${c.label} ${c.hint || ''} ${c.keywords || ''} ${c.group}`, q) }))
      .filter((c) => c.s > 0)
      .sort((a, b) => (q ? b.s - a.s : 0));
    active = Math.min(active, Math.max(0, items.length - 1));
    if (!items.length) {
      list.innerHTML = `<li class="palette-empty">No results for “${escapeHtml(input.value)}”</li>`;
      input.removeAttribute('aria-activedescendant');
      return;
    }
    let html = '', group = '';
    items.forEach((c, i) => {
      if (!q && c.group !== group) { group = c.group; html += `<li class="palette-group" role="presentation">${group}</li>`; }
      html += `<li class="palette-item" role="option" id="pi-${i}" data-i="${i}" aria-selected="${i === active}">
        <span class="pi-icon" aria-hidden="true">${escapeHtml(c.icon)}</span><span>${escapeHtml(c.label)}</span>${c.hint ? `<span class="pi-hint">${escapeHtml(c.hint)}</span>` : ''}</li>`;
    });
    list.innerHTML = html;
    input.setAttribute('aria-activedescendant', `pi-${active}`);
  };

  const setActive = (i) => {
    active = (i + items.length) % items.length;
    list.querySelectorAll('.palette-item').forEach((el) => el.setAttribute('aria-selected', String(Number(el.dataset.i) === active)));
    input.setAttribute('aria-activedescendant', `pi-${active}`);
    list.querySelector(`#pi-${active}`)?.scrollIntoView({ block: 'nearest' });
  };

  const run = (i) => {
    const cmd = items[i];
    if (!cmd) return;
    dlg._close?.();
    setTimeout(cmd.run, 230);
  };

  const show = () => {
    input.value = '';
    active = 0;
    render();
    openDialog(dlg);
    input.focus();
  };

  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
  });
  list.addEventListener('click', (e) => {
    const it = e.target.closest('.palette-item');
    if (it) run(Number(it.dataset.i));
  });
  list.addEventListener('pointermove', (e) => {
    const it = e.target.closest('.palette-item');
    if (it && Number(it.dataset.i) !== active) setActive(Number(it.dataset.i));
  });

  $('.palette-trigger')?.addEventListener('click', show);

  document.addEventListener('keydown', (e) => {
    const typing = e.target.closest?.('input, textarea, [contenteditable]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dlg.open ? dlg._close?.() : show();
    } else if (!typing && !dlg.open && !$('#proj-modal').open) {
      if (e.key === '/') { e.preventDefault(); show(); }
      else if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) toggleTheme();
    }
  });
}
