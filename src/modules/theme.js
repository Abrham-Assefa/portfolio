import { $ } from './utils.js';

const root = document.documentElement;

export function getTheme() {
  return root.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(t, persist = true) {
  root.dataset.theme = t;
  if (persist) {
    try { localStorage.setItem('theme', t); } catch {}
  }
  const btn = $('.theme-toggle');
  btn?.setAttribute('aria-label', `Switch to ${t === 'dark' ? 'light' : 'dark'} theme`);
  window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  // View Transitions give a smooth cross-fade where supported
  if (document.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(() => setTheme(next));
  } else {
    setTheme(next);
  }
}

export function initTheme() {
  setTheme(getTheme(), false);
  $('.theme-toggle')?.addEventListener('click', toggleTheme);
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem('theme'); } catch {}
    if (!stored) setTheme(e.matches ? 'light' : 'dark', false);
  });
}
