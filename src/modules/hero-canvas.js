import { $, reducedMotion } from './utils.js';

// Lightweight "neural network" particle field. Pauses when off-screen or tab hidden.
export function initHeroCanvas() {
  const canvas = $('.hero-canvas');
  if (!canvas || reducedMotion()) return;
  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  const DPR = Math.min(devicePixelRatio || 1, 1.75);
  const LINK = 130;
  const mouse = { x: -9999, y: -9999 };
  let w = 0, h = 0, nodes = [], running = false, inView = true, raf = 0;
  let nodeRGB = getComputedStyle(document.documentElement).getPropertyValue('--node').trim() || '236,231,218';

  const resize = () => {
    const r = hero.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = w * DPR; canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.6,
      hot: Math.random() < 0.12
    }));
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      const dx = n.x - mouse.x, dy = n.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22000) {
        // gentle repulsion around the cursor
        const f = (1 - d2 / 22000) * 0.6;
        n.x += (dx / Math.sqrt(d2 + 0.01)) * f;
        n.y += (dy / Math.sqrt(d2 + 0.01)) * f;
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          const alpha = (1 - d / LINK) * 0.22;
          ctx.strokeStyle = a.hot || b.hot ? `rgba(255,122,26,${alpha * 1.6})` : `rgba(${nodeRGB},${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < 170) {
        ctx.strokeStyle = `rgba(255,122,26,${(1 - md / 170) * 0.45})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = n.hot ? 'rgba(255,122,26,0.95)' : `rgba(${nodeRGB},0.55)`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.hot ? n.r + 0.8 : n.r, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };

  const start = () => { if (!running && inView && !document.hidden) { running = true; raf = requestAnimationFrame(draw); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  resize();
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; inView ? start() : stop(); }).observe(hero);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('themechange', () => {
    nodeRGB = getComputedStyle(document.documentElement).getPropertyValue('--node').trim();
  });
  start();
}
