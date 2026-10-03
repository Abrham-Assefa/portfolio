import { $, $$, reducedMotion } from './utils.js';

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

// stagger siblings that reveal together
export function observeReveals(root = document) {
  const groups = new Map();
  $$('.reveal:not(.in)', root).forEach((el) => {
    const parent = el.parentElement;
    const i = groups.get(parent) ?? 0;
    groups.set(parent, i + 1);
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
    io.observe(el);
  });
}

export function initReveal() {
  observeReveals();

  // timeline progress line follows scroll
  const tl = $('.timeline');
  if (!tl) return;
  let ticking = false;
  const update = () => {
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.6 - r.top) / r.height));
    tl.style.setProperty('--tp', reducedMotion() ? 1 : p.toFixed(3));
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}
