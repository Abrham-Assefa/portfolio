# Abrham Assefa — AI & Full-Stack Developer Portfolio

Interactive portfolio built with **Vite + vanilla JS/CSS** (no framework, ~25 KB gzipped).

## Features
- Dark / light theme (remembers choice, `T` shortcut)
- Animated hero: neural-net canvas background + illustrated "developer coding" scene (typing editor, floating hearts, day/night window that follows the theme)
- Filterable/searchable projects grid with detail modals (`#project/<slug>` deep links)
- Skills visualization, experience & education timeline
- Live GitHub stats & repos (cached, with offline fallback)
- Contact form with validation (Formspree or mailto fallback)
- Command palette (`⌘/Ctrl + K` or `/`), back-to-top, reveal animations
- SEO / Open Graph / JSON-LD, accessible markup, respects `prefers-reduced-motion`

## Develop
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview
```

## Configuration
- **Contact form:** copy `.env.example` to `.env` and set `VITE_FORMSPREE_ID=<your form id>`. Without it, the form opens the visitor's email client.
- **Résumé:** drop `resume.pdf` into `public/`. The "Résumé" button appears automatically when the file exists.
- **Projects / skills:** edit `src/data/projects.js` and `src/data/skills.js`.

## Deploy
`vite.config.js` uses `base: './'`, so `dist/` works on GitHub Pages or any static host. Update the URL in `index.html` meta tags and `public/sitemap.xml` if the domain differs.
