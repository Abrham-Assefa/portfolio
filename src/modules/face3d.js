import { $, $$, reducedMotion } from './utils.js';
import { FACE_POINTS } from '../data/face-points.js';

// Scroll-driven story: scattered noise → 3D point-cloud face → CV scan → neural network.
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const STAGES = [0, 0.2, 0.44, 0.72];
const STAGE_NAMES = ['raw data', 'structure', 'vision', 'ship'];
// landmarks in point-cloud space (x, y); z resolved from nearby points
const LM = { le: [-0.16, -0.16], re: [0.18, -0.17], nose: [0.03, -0.02], ml: [-0.12, 0.13], mr: [0.19, 0.13], mc: [0.035, 0.13],
  chin: [0.04, 0.37], jl: [-0.34, 0.08], jr: [0.36, 0.08], fh: [0, -0.46], bl: [-0.2, -0.26], br: [0.22, -0.27] };
const MESH = [['fh', 'bl'], ['fh', 'br'], ['bl', 'le'], ['br', 're'], ['le', 'nose'], ['re', 'nose'], ['le', 're'], ['nose', 'mc'],
  ['ml', 'mc'], ['mc', 'mr'], ['ml', 'chin'], ['mr', 'chin'], ['jl', 'le'], ['jr', 're'], ['jl', 'ml'], ['jr', 'mr'], ['jl', 'chin'], ['jr', 'chin'], ['bl', 'jl'], ['br', 'jr']];
const LAYERS = [4, 6, 7, 6, 3];

export function initFace3d() {
  const section = $('.face3d');
  if (!section) return;
  const canvas = $('.face3d-canvas', section), ctx = canvas.getContext('2d');
  const steps = $$('.face3d-steps li', section), bar = $('.face3d-bar span', section);
  const yawEl = $('#f3-yaw'), stageEl = $('#f3-stage');

  const raw = Uint8Array.from(atob(FACE_POINTS), (c) => c.charCodeAt(0));
  const N = raw.length / 4;
  const face = new Float32Array(N * 3), scatter = new Float32Array(N * 3), net = new Float32Array(N * 3), tone = new Float32Array(N);
  const s8 = (v) => (v > 127 ? v - 256 : v) / 127;
  for (let i = 0; i < N; i++) {
    face[i * 3] = s8(raw[i * 4]); face[i * 3 + 1] = s8(raw[i * 4 + 1]); face[i * 3 + 2] = s8(raw[i * 4 + 2]);
    tone[i] = raw[i * 4 + 3] / 255;
    const r = 1.6 + Math.random() * 1.4, th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1);
    scatter[i * 3] = r * Math.sin(ph) * Math.cos(th); scatter[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th); scatter[i * 3 + 2] = r * Math.cos(ph);
  }
  $('#f3-points') && ($('#f3-points').textContent = N.toLocaleString('en-US'));

  const nodes = [];
  LAYERS.forEach((n, l) => { for (let k = 0; k < n; k++) nodes.push([(l / (LAYERS.length - 1) - 0.5) * 1.9, ((k + 0.5) / n - 0.5) * 1.5, 0, l]); });
  for (let i = 0; i < N; i++) {
    const nd = nodes[i % nodes.length], g = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.07;
    net[i * 3] = nd[0] + g(); net[i * 3 + 1] = nd[1] + g(); net[i * 3 + 2] = nd[2] + g();
  }
  const lm = {};
  for (const k in LM) {
    const [x, y] = LM[k]; let zs = 0, c = 0;
    for (let i = 0; i < N; i++) if (Math.abs(face[i * 3] - x) < 0.04 && Math.abs(face[i * 3 + 1] - y) < 0.04) { zs += face[i * 3 + 2]; c++; }
    lm[k] = [x, y, c ? zs / c + 0.02 : 0.3];
  }
  // Grad-CAM-like attention around eyes, nose and mouth
  const heat = new Float32Array(N);
  const hot = [[...LM.le, 0.09], [...LM.re, 0.09], [...LM.nose, 0.08], [...LM.mc, 0.11]];
  for (let i = 0; i < N; i++) for (const [hx, hy, r] of hot) {
    const d = ((face[i * 3] - hx) ** 2 + (face[i * 3 + 1] - hy) ** 2) / (r * r);
    heat[i] = Math.max(heat[i], Math.exp(-d));
  }

  let W = 0, H = 0, dpr = 1, colors = {};
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    colors = { dot: cs.getPropertyValue('--paper').trim(), acc: cs.getPropertyValue('--signal').trim(),
      acc2: cs.getPropertyValue('--signal-3').trim(), light: document.documentElement.dataset.theme === 'light' };
  };
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.75);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
  };
  readColors(); resize();
  addEventListener('resize', resize);
  addEventListener('themechange', readColors);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let target = 0, prog = 0, mx = 0, my = 0, visible = false, raf = 0, lastStage = -1;
  const still = reducedMotion();
  const measure = () => {
    const r = section.getBoundingClientRect();
    target = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
  };
  section.addEventListener('pointermove', (e) => { mx = (e.clientX / innerWidth - 0.5) * 2; my = (e.clientY / innerHeight - 0.5) * 2; });

  const proj = new Float32Array(N * 3);
  const project = (x, y, z, cy, sy, cp, sp, cx, cyy, sc) => {
    const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
    const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    const f = 3.2 / (3.2 - z2);
    return [cx + x1 * sc * f, cyy + y1 * sc * f, z2, f];
  };

  function frame(t) {
    raf = 0;
    prog += (target - prog) * (still ? 1 : 0.09);
    const p = prog;
    const a = smooth(0.03, 0.3, p), b = smooth(0.74, 0.94, p);
    const scan = smooth(0.46, 0.66, p) * (1 - smooth(0.72, 0.8, p));
    const time = still ? 0 : t / 1000;
    const yaw = (1 - a) * p * 6 + lerp(-0.55, 0.55, smooth(0.4, 0.72, p)) * (1 - b) + mx * 0.18 + Math.sin(time * 0.6) * 0.06 * a;
    const pitch = my * 0.12 + 0.05;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const wide = W > 900;
    const cx = wide ? W * 0.66 : W * 0.5, ccy = wide ? H * 0.52 : H * 0.36;
    const sc = Math.min(W * (wide ? 0.3 : 0.55), H * (wide ? 0.42 : 0.3)) * lerp(1, 0.95, b);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = colors.light ? 'source-over' : 'lighter';

    const scanY = lerp(-0.6, 0.5, (Math.sin(time * 1.6) + 1) / 2);
    for (let i = 0; i < N; i++) {
      const j = i * 3;
      let x = lerp(scatter[j], face[j], a), y = lerp(scatter[j + 1], face[j + 1], a), z = lerp(scatter[j + 2], face[j + 2], a);
      if (b) { x = lerp(x, net[j], b); y = lerp(y, net[j + 1], b); z = lerp(z, net[j + 2], b); }
      const [px, py, pz, f] = project(x, y, z, cy, sy, cp, sp, cx, ccy, sc);
      proj[j] = px; proj[j + 1] = py; proj[j + 2] = pz;
      const tn = colors.light ? 1 - tone[i] * 0.9 : tone[i];
      const hot = scan > 0 && Math.abs(face[j + 1] - scanY) < 0.03;
      const h = heat[i] * scan;
      ctx.fillStyle = hot || h > 0.45 ? (h > 0.8 ? colors.acc2 : colors.acc) : colors.dot;
      ctx.globalAlpha = Math.min(1, (0.06 + tn * tn * 0.94 + h * 0.4) * (0.7 + f * 0.3) * (hot ? 1.6 : 1));
      const s = (0.9 + tn * 1.7) * f * (hot ? 1.5 : 1);
      ctx.fillRect(px - s / 2, py - s / 2, s, s);
    }
    ctx.globalCompositeOperation = 'source-over';

    if (scan > 0.01) { // CV overlay: mesh, landmarks, bounding box, label
      const P = {};
      for (const k in lm) P[k] = project(...lm[k], cy, sy, cp, sp, cx, ccy, sc);
      ctx.globalAlpha = scan * 0.4; ctx.strokeStyle = colors.acc; ctx.lineWidth = 1;
      ctx.beginPath();
      MESH.forEach(([u, v]) => { ctx.moveTo(P[u][0], P[u][1]); ctx.lineTo(P[v][0], P[v][1]); });
      ctx.stroke();
      ctx.globalAlpha = scan; ctx.fillStyle = colors.acc;
      for (const k in P) { ctx.beginPath(); ctx.arc(P[k][0], P[k][1], 2.6, 0, 7); ctx.fill(); }
      const xs = [P.jl[0], P.jr[0], P.fh[0]], x0 = Math.min(...xs) - sc * 0.12, x1 = Math.max(...xs) + sc * 0.12;
      const y0 = P.fh[1] - sc * 0.16, y1 = P.chin[1] + sc * 0.1, L = 16;
      ctx.lineWidth = 2; ctx.beginPath();
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, dx, dy]) => {
        ctx.moveTo(x + dx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * L);
      });
      ctx.stroke();
      ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
      const label = `FACE · ${(0.9 + scan * 0.098).toFixed(3)}`;
      const tw = ctx.measureText(label).width + 14;
      ctx.fillRect(x0, y0 - 22, tw, 20);
      ctx.fillStyle = colors.light ? '#fff' : '#0B1118'; ctx.fillText(label, x0 + 7, y0 - 8);
    }

    if (b > 0.02) { // network edges
      const NP = nodes.map(([x, y, z]) => project(x, y, z, cy, sy, cp, sp, cx, ccy, sc));
      ctx.lineWidth = 1; ctx.strokeStyle = colors.acc;
      for (let i = 0; i < nodes.length; i++) for (let k = 0; k < nodes.length; k++) {
        if (nodes[k][3] !== nodes[i][3] + 1) continue;
        const pulse = (Math.sin(time * 3 + i * 1.7 + k) + 1) / 2;
        ctx.globalAlpha = b * (0.08 + pulse * 0.25);
        ctx.beginPath(); ctx.moveTo(NP[i][0], NP[i][1]); ctx.lineTo(NP[k][0], NP[k][1]); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    const stage = STAGES.reduce((s, v, i) => (p >= v - 0.02 ? i : s), 0);
    if (stage !== lastStage) {
      steps.forEach((li, i) => li.classList.toggle('on', i === stage));
      stageEl && (stageEl.textContent = `stage ${stage + 1}/4 · ${STAGE_NAMES[stage]}`);
      lastStage = stage;
    }
    bar.style.transform = `scaleX(${p})`;
    const deg = Math.round((((yaw * 180) / Math.PI) % 360 + 540) % 360 - 180);
    yawEl && (yawEl.textContent = `${deg >= 0 ? '+' : ''}${deg}°`);

    if (visible && (!still || Math.abs(target - prog) > 0.001)) raf = requestAnimationFrame(frame);
  }
  const kick = () => { measure(); if (visible && !raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', kick, { passive: true });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(section);
  measure(); prog = target; frame(0);
}
