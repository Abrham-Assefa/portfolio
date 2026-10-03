import { $, escapeHtml } from './utils.js';
import { animateCount } from './typed.js';
import { bindTilt } from './effects.js';
import { observeReveals } from './reveal.js';

const USER = 'Abrham-Assefa';
const CACHE_KEY = 'gh-cache-v1';
const TTL = 30 * 60 * 1000;
const LANG_COLORS = {
  'Jupyter Notebook': '#DA5B0B', Python: '#3572A5', JavaScript: '#F1E05A', TypeScript: '#3178C6',
  Dart: '#00B4AB', HTML: '#E34C26', CSS: '#563D7C', Java: '#B07219', 'C++': '#F34B7D', PHP: '#4F5D95',
  Kotlin: '#A97BFF', Shell: '#89E051', Vue: '#41B883', C: '#555555'
};
const color = (l) => LANG_COLORS[l] || '#8B949E';

// shown if the API is unreachable or rate-limited
const FALLBACK = [
  { name: 'Detecting-AI-Generated-Faces', description: 'Real vs. synthetic face detection with ViT, ResNet, DANN, SimCLR and explainability.', language: 'Jupyter Notebook' },
  { name: 'ASL-HAND-SIGN-CLASSIFICATION', description: 'Real-time ASL classifier on MediaPipe landmarks, SVM + SHAP.', language: 'Jupyter Notebook' },
  { name: 'Trafic-Light-Classfiaction-', description: 'GTSRB traffic sign recognition: HOG + SVM/KNN and EfficientNetV2S ensemble.', language: 'Jupyter Notebook' },
  { name: 'AI-and-Finacee-project-', description: 'Almgren-Chriss + Heston optimal liquidation with Q-Learning and SARSA agents.', language: 'Jupyter Notebook' }
].map((r) => ({ ...r, html_url: `https://github.com/${USER}/${r.name}`, stargazers_count: null, forks_count: null, pushed_at: null }));

const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600]];
  for (const [u, n] of units) if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v > 1 ? 's' : ''} ago`; }
  return 'just now';
};

async function fetchData() {
  try {
    const c = JSON.parse(sessionStorage.getItem(CACHE_KEY));
    if (c && Date.now() - c.t < TTL) return c.data;
  } catch {}
  const opts = { headers: { Accept: 'application/vnd.github+json' } };
  const [uRes, rRes] = await Promise.all([
    fetch(`https://api.github.com/users/${USER}`, opts),
    fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, opts)
  ]);
  if (!uRes.ok || !rRes.ok) throw new Error(`GitHub API ${uRes.status}/${rRes.status}`);
  const user = await uRes.json();
  const repos = (await rRes.json()).map(({ name, description, html_url, language, stargazers_count, forks_count, pushed_at, fork, topics }) =>
    ({ name, description, html_url, language, stargazers_count, forks_count, pushed_at, fork, topics }));
  const data = { user: { public_repos: user.public_repos, followers: user.followers }, repos };
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), data })); } catch {}
  return data;
}

function repoCard(r) {
  const meta = [
    r.language ? `<span><i style="background:${color(r.language)}"></i>${escapeHtml(r.language)}</span>` : '',
    r.stargazers_count != null ? `<span title="Stars">★ ${r.stargazers_count}</span>` : '',
    r.forks_count != null ? `<span title="Forks">⑂ ${r.forks_count}</span>` : '',
    r.pushed_at ? `<span>Updated ${timeAgo(r.pushed_at)}</span>` : ''
  ].join('');
  return `
    <article class="gh-card glass bbox tilt reveal">
      <h3><a href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener">${escapeHtml(r.name)} ↗</a></h3>
      <p>${escapeHtml(r.description || 'No description provided.')}</p>
      <div class="gh-meta">${meta}</div>
    </article>`;
}

export function initGitHub() {
  const section = $('#github');
  const grid = $('#gh-grid');
  const note = $('#gh-note');
  let loaded = false;

  const load = async () => {
    if (loaded) return;
    loaded = true;
    try {
      const { user, repos } = await fetchData();
      const own = repos.filter((r) => !r.fork);
      const repoStat = $('#repo-stat');
      if (repoStat && user.public_repos > Number(repoStat.dataset.count)) {
        repoStat.dataset.count = user.public_repos;
        animateCount(repoStat, user.public_repos);
      }
      const featured = own
        .filter((r) => r.name.toLowerCase() !== USER.toLowerCase())
        .sort((a, b) => b.stargazers_count - a.stargazers_count || new Date(b.pushed_at) - new Date(a.pushed_at))
        .slice(0, 6);
      grid.innerHTML = featured.map(repoCard).join('');
      note.textContent = `Live data from api.github.com · ${own.length} original repositories`;
    } catch (err) {
      grid.innerHTML = FALLBACK.map(repoCard).join('');
      note.textContent = 'GitHub API unavailable right now (rate limit or offline) — showing featured repositories.';
    }
    grid.setAttribute('aria-busy', 'false');
    observeReveals(grid);
    bindTilt(grid);
  };

  // only hit the API when the section is approaching the viewport
  new IntersectionObserver(([e], io) => {
    if (e.isIntersecting) { load(); io.disconnect(); }
  }, { rootMargin: '600px 0px' }).observe(section);
}
