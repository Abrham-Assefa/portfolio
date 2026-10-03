import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/sections.css';
import './styles/hero-viz.css';
import './styles/animations.css';

import { $ } from './modules/utils.js';
import { initTheme } from './modules/theme.js';
import { initNav } from './modules/nav.js';
import { initReveal } from './modules/reveal.js';
import { initTyped, initCounters } from './modules/typed.js';
import { initCursor, bindTilt, bindMagnetic, initHeroParallax } from './modules/effects.js';
import { initHeroCanvas } from './modules/hero-canvas.js';
import { initHeroViz } from './modules/hero-viz.js';
import { initProjects } from './modules/projects.js';
import { initSkills } from './modules/skills.js';
import { initGitHub } from './modules/github.js';
import { initContact } from './modules/contact.js';
import { initPalette } from './modules/palette.js';

// Show the résumé button only when public/resume.pdf is actually deployed.
async function initResume() {
  const btn = $('.resume-btn');
  if (!btn) return;
  try {
    const res = await fetch(btn.getAttribute('href'), { method: 'HEAD' });
    const type = res.headers.get('content-type') || '';
    if (res.ok && type.includes('pdf')) btn.hidden = false;
  } catch {}
}

const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

initTheme();
initNav();
initProjects();
initSkills();
initReveal();
initTyped();
initCounters();
initContact();
initPalette();
initGitHub();
initHeroCanvas();
initHeroViz();
initCursor();
initHeroParallax();
bindTilt();
bindMagnetic();
initResume();
