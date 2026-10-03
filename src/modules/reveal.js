import { $, $$, reducedMotion } from './utils.js';

// Two-way reveals: elements animate in on scroll down AND scroll up, and reset once fully off-screen.
// `.up` marks elements above the viewport so they slide down into place when scrolling back up.
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    const el = e.target;
    if (e.isIntersecting) {
      el.classList.add('in');
    } else {
      el.classList.remove('in');
      el.classList.toggle('up', e.boundingClientRect.top < (e.rootBounds?.top ?? 0));
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -6% 0px' });

const variant = (el) => {
  if (el.classList.contains('section-head')) return 'rv-wipe';
  if (el.matches('.tilt, .glass, .tl-item')) return 'rv-scale';
  if (el.matches('.about-body')) return 'rv-left';
  return 'rv-fade';
};

// stagger siblings that reveal together
export function observeReveals(root = document) {
  const groups = new Map();
  $$('.reveal:not(.in)', root).forEach((el) => {
    if (!/\brv-/.test(el.className)) el.classList.add(variant(el));
    const parent = el.parentElement;
    const i = groups.get(parent) ?? 0;
    groups.set(parent, i + 1);
    if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
    io.observe(el);
  });
}

export function initReveal() {
  observeReveals();
  initScrollFx();

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

// Scroll-linked effects (fully reversible): hero drifts and fades out, section titles parallax.
function initScrollFx() {
  if (reducedMotion()) return;
  const hero = $('.hero .hero-grid');
  const heads = $$('.section-head h2');
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = innerHeight;
    if (hero) {
      const p = Math.min(1, Math.max(0, scrollY / (vh * 0.9)));
      hero.style.transform = `translate3d(0, ${(p * 90).toFixed(1)}px, 0) scale(${(1 - p * 0.06).toFixed(3)})`;
      hero.style.opacity = (1 - p * 0.85).toFixed(3);
    }
    heads.forEach((h) => {
      const r = h.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const c = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5 around center
      h.style.transform = `translate3d(${(c * -40).toFixed(1)}px, 0, 0)`;
    });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}
