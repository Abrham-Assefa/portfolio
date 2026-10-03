import { $, $$ } from './utils.js';

export function initNav() {
  const header = $('.site-header');
  const nav = $('#primary-nav');
  const toggle = $('.navmenu-toggle');
  const progress = $('.scroll-progress span');
  const toTop = $('.back-to-top');
  const links = $$('#primary-nav a');

  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  links.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setMenu(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !nav.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
  });

  // scroll-driven UI: header state, auto-hide, progress, back-to-top
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    header.classList.toggle('scrolled', y > 20);
    header.classList.toggle('hide', y > 400 && y > lastY + 4 && !nav.classList.contains('open'));
    if (y < lastY - 4) header.classList.remove('hide');
    progress.style.transform = `scaleX(${p})`;
    toTop.classList.toggle('show', y > innerHeight * 0.8);
    toTop.style.setProperty('--p', p.toFixed(3));
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  toTop.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    $('.logo')?.focus({ preventScroll: true });
  });

  // scrollspy
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
      const link = map.get(e.target.id);
      if (link) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));
}
