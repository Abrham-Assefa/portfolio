import { $, reducedMotion } from './utils.js';

// One cycle (~11s): type code → train (net fires, curves draw, epochs tick) → infer (landmarks, box, Grad-CAM) → deploy.
const CODE = [
  'import torch, timm',
  'model = create_model("vit_s16")',
  'for epoch in range(20):',
  '    loss = train(model, faces_140k)',
  '    acc  = evaluate(model)  # 0.995',
  'explain(model, method="grad-cam")',
  'deploy(model, ["api","web","app"])'
];
const SAMPLES = [
  { label: 'REAL · 0.996', fake: false, conf: '0.996' },
  { label: 'AI-GEN · 0.981', fake: true, conf: '0.981' },
  { label: 'REAL · 0.989', fake: false, conf: '0.989' }
];
const LAYERS = [3, 5, 5, 2];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function highlight(line) {
  const ci = line.indexOf('#');
  const code = ci >= 0 ? line.slice(0, ci) : line;
  const comment = ci >= 0 ? line.slice(ci) : '';
  let h = esc(code)
    .replace(/("[^"]*"?)/g, '<span class="tk-s">$1</span>')
    .replace(/\b(import|for|in|range)\b/g, '<span class="tk-k">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b(?![^<]*<\/span>)/g, '<span class="tk-n">$1</span>')
    .replace(/\b(train|evaluate|explain|deploy|create_model)(?=\()/g, '<span class="tk-f">$1</span>');
  return h + (comment ? `<span class="tk-c">${esc(comment)}</span>` : '');
}

function buildNet(svg) {
  const W = 200, H = 130, nodes = [];
  LAYERS.forEach((n, li) => {
    const x = 18 + (li * (W - 36)) / (LAYERS.length - 1);
    const layer = [];
    for (let i = 0; i < n; i++) layer.push({ x, y: H / 2 + (i - (n - 1) / 2) * 24 });
    nodes.push(layer);
  });
  let edges = '', pulses = '', circles = '';
  nodes.forEach((layer, li) => {
    if (li < nodes.length - 1) layer.forEach((a, ai) => nodes[li + 1].forEach((b, bi) => {
      const d = `M${a.x} ${a.y}L${b.x} ${b.y}`;
      edges += `<path class="edge" d="${d}"/>`;
      pulses += `<path class="pulse" pathLength="100" data-e="${li}-${ai}-${bi}" d="${d}"/>`;
    }));
    layer.forEach((n, i) => {
      circles += `<circle class="node${li === nodes.length - 1 ? ' out' : ''}" data-n="${li}-${i}" cx="${n.x}" cy="${n.y}" r="${li === nodes.length - 1 ? 6 : 4.5}"/>`;
    });
  });
  svg.innerHTML = edges + pulses + circles;
}

function buildDetect(svg) {
  // stylized face + landmarks; heat blob = Grad-CAM style explanation
  const lms = [[82, 58], [118, 58], [100, 74], [88, 92], [100, 95], [112, 92], [70, 64], [130, 64], [100, 112], [76, 84], [124, 84]];
  svg.innerHTML = `
    <defs><radialGradient id="vz-heat"><stop offset="0" stop-color="#FF4D6D"/><stop offset=".5" stop-color="#FF7A1A" stop-opacity=".6"/><stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient></defs>
    <ellipse class="heat" cx="100" cy="74" rx="44" ry="34" fill="url(#vz-heat)"/>
    <path class="face" d="M100 26c-26 0-40 20-40 46 0 30 18 52 40 52s40-22 40-52c0-26-14-46-40-46Z"/>
    <path class="face" d="M60 70c-5 0-6 14 1 16M140 70c5 0 6 14-1 16"/>
    <path class="mesh" pathLength="100" d="M70 64 82 58 100 74 118 58 130 64M82 58 76 84 88 92 100 95 112 92 124 84 118 58M100 74 88 92M100 74 112 92M88 92 100 112 112 92"/>
    ${lms.map(([x, y], i) => `<circle class="lm" data-i="${i}" cx="${x}" cy="${y}" r="2.2"/>`).join('')}
    <rect class="box" x="52" y="20" width="96" height="112" rx="3"/>`;
  return lms.length;
}

export function initHeroViz() {
  const root = $('.ai-viz');
  if (!root) return;
  const codeEl = $('#viz-code'), net = $('#viz-net'), det = $('.viz-detect'), pred = $('#viz-pred');
  const acc = $('#viz-acc'), loss = $('#viz-loss'), accV = $('#viz-acc-v'), lossV = $('#viz-loss-v');
  const prog = $('#viz-prog'), epoch = $('#viz-epoch'), conf = $('#viz-conf'), deploys = root.querySelectorAll('.viz-deploy i');
  buildNet(net);
  const lmCount = buildDetect($('#viz-detect'));
  const lms = root.querySelectorAll('.lm');

  const setTrain = (t) => { // t: 0..1
    const e = Math.round(t * 20);
    epoch.textContent = `epoch ${String(e).padStart(2, '0')}/20`;
    prog.style.width = `${t * 100}%`;
    acc.style.setProperty('--draw', 100 - t * 100);
    loss.style.setProperty('--draw', 100 - t * 100);
    accV.textContent = `${(50 + 49.5 * (1 - Math.pow(1 - t, 3))).toFixed(1)}%`;
    lossV.textContent = (2.31 * Math.pow(1 - t, 2.4) + 0.04 * t).toFixed(2);
  };

  // static final state for reduced motion
  if (reducedMotion()) {
    codeEl.innerHTML = CODE.map(highlight).join('\n');
    setTrain(1);
    lms.forEach((l) => l.classList.add('on'));
    det.classList.add('boxed', 'meshed', 'explained');
    deploys.forEach((d) => d.classList.add('on'));
    return;
  }

  let visible = true, timers = [], sample = 0;
  const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));
  const waitVisible = async () => { while (!visible || document.hidden) await wait(400); };

  const firePath = () => {
    // random forward pass through the network
    let prev = Math.floor(Math.random() * LAYERS[0]);
    const nodeOn = (l, i) => {
      const n = net.querySelector(`[data-n="${l}-${i}"]`);
      n?.classList.add('on');
      setTimeout(() => n?.classList.remove('on'), 500);
    };
    nodeOn(0, prev);
    for (let l = 0; l < LAYERS.length - 1; l++) {
      const next = Math.floor(Math.random() * LAYERS[l + 1]);
      const p = net.querySelector(`[data-e="${l}-${prev}-${next}"]`);
      const nl = l + 1, ni = next;
      setTimeout(() => {
        if (!p) return;
        p.classList.remove('go'); void p.getBBox(); p.classList.add('go');
        setTimeout(() => nodeOn(nl, ni), 450);
      }, l * 420);
      prev = next;
    }
  };
  let fireTimer = setInterval(() => { if (visible && !document.hidden) firePath(); }, 260);

  const cycle = async () => {
    for (;;) {
      await waitVisible();
      // reset
      codeEl.innerHTML = '';
      setTrain(0);
      lms.forEach((l) => l.classList.remove('on'));
      det.classList.remove('boxed', 'meshed', 'explained');
      deploys.forEach((d) => d.classList.remove('on'));

      // 1. type code
      let typed = [];
      for (const line of CODE) {
        typed.push('');
        for (let c = 1; c <= line.length; c++) {
          typed[typed.length - 1] = line.slice(0, c);
          codeEl.innerHTML = typed.map(highlight).join('\n');
          await wait(line.startsWith('    ') && c < 4 ? 0 : 22);
        }
        await wait(120);
      }

      // 2. train
      const start = performance.now(), dur = 2600;
      await new Promise((res) => {
        const step = (now) => {
          const t = Math.min(1, (now - start) / dur);
          setTrain(t);
          t < 1 ? requestAnimationFrame(step) : res();
        };
        requestAnimationFrame(step);
      });

      // 3. inference: landmarks → mesh → box + label → grad-cam
      const s = SAMPLES[sample++ % SAMPLES.length];
      pred.textContent = s.label;
      pred.classList.toggle('fake', s.fake);
      for (let i = 0; i < lmCount; i++) { lms[i].classList.add('on'); await wait(55); }
      det.classList.add('meshed');
      await wait(500);
      det.classList.add('boxed');
      conf.textContent = s.conf;
      await wait(500);
      det.classList.add('explained');

      // 4. deploy
      for (const d of deploys) { await wait(380); d.classList.add('on'); }
      await wait(2600);
    }
  };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(root);
  cycle();
  addEventListener('pagehide', () => { clearInterval(fireTimer); timers.forEach(clearTimeout); });
}
