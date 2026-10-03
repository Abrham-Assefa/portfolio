import { $, $$, finePointer, reducedMotion } from './utils.js';

const INTERACTIVE = 'a, button, input, textarea, [role="option"], label';

export function initCursor() {
  if (!finePointer() || reducedMotion()) return;
  const ring = $('.cursor-ring');
  const dot = $('.cursor-dot');
  let x = -100, y = -100, rx = x, ry = y, raf = 0, visible = false;

  const loop = () => {
    rx += (x - rx) * 0.2;
    ry += (y - ry) * 0.2;
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    dot.style.transform = `translate3d(${x}px,${y}px,0)`;
    raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
  };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    x = e.clientX; y = e.clientY;
    if (!visible) { visible = true; rx = x; ry = y; document.body.classList.add('has-cursor'); }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { visible = false; document.body.classList.remove('has-cursor'); });
  addEventListener('pointerdown', () => ring.classList.add('down'));
  addEventListener('pointerup', () => ring.classList.remove('down'));
  document.addEventListener('pointerover', (e) => ring.classList.toggle('hover', !!e.target.closest?.(INTERACTIVE)));
}

export function bindTilt(root = document) {
  if (!finePointer()) return;
  const allowTilt = !reducedMotion();
  $$('.tilt:not([data-tilt-bound])', root).forEach((el) => {
    el.dataset.tiltBound = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
      if (allowTilt) {
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', `${(px - 0.5) * 6}deg`);
        el.style.setProperty('--rx', `${(0.5 - py) * 6}deg`);
      }
    });
    el.addEventListener('pointerleave', () => {
      el.classList.remove('is-tilting');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

export function bindMagnetic(root = document) {
  if (!finePointer() || reducedMotion()) return;
  $$('.magnetic:not([data-mag-bound])', root).forEach((el) => {
    el.dataset.magBound = '1';
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px,${dy * 0.25}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

export function initHeroParallax() {
  if (!finePointer() || reducedMotion()) return;
  const vis = $('.hero-visual');
  const hero = $('.hero');
  hero.addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth - 0.5;
    const ny = e.clientY / innerHeight - 0.5;
    vis.style.setProperty('--px', `${nx * -18}px`);
    vis.style.setProperty('--py', `${ny * -18}px`);
  });
  hero.addEventListener('pointerleave', () => {
    vis.style.setProperty('--px', '0px');
    vis.style.setProperty('--py', '0px');
  });
}
