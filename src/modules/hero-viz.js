import { $, reducedMotion } from './utils.js';

// Lo-fi hero scene: the developer types love.js, hearts float up, build passes, repeat.
const NS = 'http://www.w3.org/2000/svg';
const X0 = 142, Y0 = 101, LH = 12;
const LINES = [
  [['k', 'const '], ['', 'dev = {']],
  [['', '  '], ['p', 'name'], ['', ': '], ['s', '"Abrham Assefa"'], ['', ',']],
  [['', '  '], ['p', 'loves'], ['', ': ['], ['s', '"AI"'], ['', ', '], ['s', '"code"'], ['', ', '], ['s', '"coffee"'], ['', '],']],
  [['', '  '], ['p', 'stack'], ['', ': ['], ['s', '"React"'], ['', ', '], ['s', '"PyTorch"'], ['', '],']],
  [['', '};']],
  [['k', 'while '], ['', '(dev.'], ['f', 'isAwake'], ['', '()) {']],
  [['', '  dev.'], ['f', 'code'], ['', '(); dev.'], ['f', 'learn'], ['', '();']],
  [['', '  dev.'], ['f', 'ship'], ['', '('], ['s', '"with ♥"'], ['', ');']],
  [['', '}']],
  [['c', '// made with love in Verona']]
];
const GLYPHS = ['</>', '{ }', 'AI', '♥', '=>', '()'];
const HEART = 'M0 -3c-1.5-3-8-3-8 2.5 0 4 5 6.5 8 9.5 3-3 8-5.5 8-9.5 0-5.5-6.5-5.5-8-2.5z';

const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  parent && parent.appendChild(n);
  return n;
};
const lineLen = (t) => t.reduce((a, [, s]) => a + s.length, 0);

function render(text, tokens, n) {
  text.textContent = '';
  for (const [cls, s] of tokens) {
    if (n <= 0) break;
    const ts = el('tspan', cls ? { class: 'tk-' + cls } : {}, text);
    ts.textContent = s.slice(0, n);
    n -= s.length;
  }
}

export function initHeroViz() {
  const scene = $('.dev-scene');
  if (!scene) return;
  const code = $('#dev-code', scene), gutter = $('#dev-gutter', scene), caret = $('#dev-caret', scene);
  const toast = $('#dev-toast', scene), fx = $('#dev-fx', scene);
  const commitsEl = $('#dev-commits', scene), stateEl = $('#dev-state');
  let commits = 1284;

  const texts = LINES.map((_, i) => {
    const y = Y0 + i * LH;
    el('text', { x: 134, y }, gutter).textContent = i + 1;
    return el('text', { x: X0, y }, code);
  });
  const placeCaret = (i) => {
    caret.setAttribute('x', X0 + texts[i].getComputedTextLength() + 1);
    caret.setAttribute('y', Y0 + i * LH - 8);
  };

  if (reducedMotion()) {
    LINES.forEach((t, i) => render(texts[i], t, Infinity));
    placeCaret(LINES.length - 1);
    toast.classList.add('on');
    stateEl && (stateEl.textContent = 'shipped ♥');
    return;
  }

  let visible = true;
  const waiters = [];
  const setVisible = (v) => {
    visible = v && !document.hidden;
    scene.classList.toggle('paused', !visible);
    if (visible) while (waiters.length) waiters.shift()();
  };
  new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 }).observe(scene);
  document.addEventListener('visibilitychange', () => setVisible(scene.getBoundingClientRect().bottom > 0));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    .then(() => (visible ? null : new Promise((r) => waiters.push(r))));

  const spawn = (x, y, glyph) => {
    const g = el('g', { transform: `translate(${x} ${y})` }, fx);
    const node = glyph
      ? el('text', { class: 'fx fx-glyph', 'text-anchor': 'middle' }, g)
      : el('path', { class: 'fx fx-heart', d: HEART }, g);
    if (glyph) node.textContent = glyph;
    node.style.setProperty('--dx', `${(Math.random() * 40 - 20).toFixed(0)}px`);
    node.style.setProperty('--rot', `${(Math.random() * 40 - 20).toFixed(0)}deg`);
    if (!glyph) node.style.scale = (0.55 + Math.random() * 0.5).toFixed(2);
    node.addEventListener('animationend', () => g.remove());
  };
  setInterval(() => {
    if (!visible || !scene.classList.contains('typing')) return;
    const glyph = Math.random() < 0.45 ? GLYPHS[(Math.random() * GLYPHS.length) | 0] : null;
    spawn(130 + Math.random() * 220, 64, glyph);
  }, 650);

  (async function loop() {
    for (;;) {
      texts.forEach((t) => { t.classList.remove('fade'); t.textContent = ''; });
      toast.classList.remove('on');
      scene.classList.add('typing');
      stateEl && (stateEl.textContent = 'coding…');
      for (let i = 0; i < LINES.length; i++) {
        const total = lineLen(LINES[i]);
        for (let n = 1; n <= total; n++) {
          render(texts[i], LINES[i], n);
          placeCaret(i);
          const ch = texts[i].textContent.slice(-1);
          await sleep(/[,;{(]/.test(ch) ? 110 : 18 + Math.random() * 40);
        }
        await sleep(120 + Math.random() * 160);
      }
      scene.classList.remove('typing');
      stateEl && (stateEl.textContent = 'build passed ✓');
      await sleep(350);
      toast.classList.add('on');
      scene.classList.add('happy');
      commitsEl.textContent = ++commits;
      for (let k = 0; k < 9; k++) setTimeout(() => spawn(150 + Math.random() * 180, 66 + Math.random() * 6, k % 3 ? null : '♥'), k * 90);
      await sleep(3200);
      scene.classList.remove('happy');
      texts.forEach((t, i) => setTimeout(() => t.classList.add('fade'), i * 40));
      await sleep(700);
    }
  })();
}
