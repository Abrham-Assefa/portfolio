import { $, $$, reducedMotion } from './utils.js';

const roles = ['AI / Machine Learning Engineer', 'Computer Vision Developer', 'Full-Stack Web Developer', 'Flutter Mobile Developer'];

export function initTyped() {
  const el = $('#typed');
  if (!el || reducedMotion()) return;
  let ri = 0, ci = 0, deleting = false;
  const tick = () => {
    const word = roles[ri];
    ci += deleting ? -1 : 1;
    el.textContent = word.slice(0, ci);
    if (!deleting && ci === word.length) {
      deleting = true;
      return setTimeout(tick, 1600);
    }
    if (deleting && ci === 0) {
      deleting = false;
      ri = (ri + 1) % roles.length;
    }
    setTimeout(tick, deleting ? 32 : 62);
  };
  el.textContent = '';
  tick();
}

export function animateCount(el, to) {
  const decimals = Number(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || '';
  if (reducedMotion()) {
    el.textContent = to.toFixed(decimals) + suffix;
    return;
  }
  const dur = 1400;
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = (to * eased).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

export function initCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      animateCount(e.target, Number(e.target.dataset.count));
      io.unobserve(e.target);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => io.observe(el));
}
