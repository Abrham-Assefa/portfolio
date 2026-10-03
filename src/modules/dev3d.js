import { $, $$, reducedMotion } from './utils.js';

// Scroll story: laptop opens → code types → stack orbits → ship. Everything is CSS 3D driven by a few custom properties.
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const STAGES = [0, 0.18, 0.48, 0.76];

export function initDev3d() {
  const section = $('.dev3d');
  if (!section) return;
  const steps = $$('.dev3d-steps li', section), lines = $$('.lp-code span', section), bar = $('.dev3d-bar span', section);
  const still = reducedMotion();
  let target = 0, prog = 0, spin = 0, last = 0, visible = false, raf = 0, stage = -1;

  const measure = () => {
    const r = section.getBoundingClientRect();
    target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  };
  const set = (k, v) => section.style.setProperty(k, v.toFixed(3));

  function frame(t) {
    raf = 0;
    const dt = Math.min(0.05, (t - (last || t)) / 1000); last = t;
    prog += (target - prog) * (still ? 1 : 0.1);
    const p = prog;
    if (!still) spin += dt * 18;
    set('--open', smooth(0.04, 0.26, p));
    set('--chips', smooth(0.46, 0.6, p));
    set('--ship', smooth(0.78, 0.88, p));
    set('--rz', -32 + smooth(0, 0.7, p) * 52 - smooth(0.72, 0.95, p) * 20);
    set('--spin', spin + p * 180);
    const shown = Math.round(smooth(0.12, 0.4, p) * lines.length);
    lines.forEach((l, i) => l.classList.toggle('on', i < shown));
    section.classList.toggle('shipped', p > 0.84);
    bar.style.transform = `scaleX(${p})`;
    const s = STAGES.reduce((acc, v, i) => (p >= v - 0.02 ? i : acc), 0);
    if (s !== stage) { steps.forEach((li, i) => li.classList.toggle('on', i === s)); stage = s; }
    if (visible && (!still || Math.abs(target - prog) > 0.001)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { measure(); if (visible && !raf) { last = 0; raf = requestAnimationFrame(frame); } };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(section);
  measure(); prog = target; frame(0);
}
