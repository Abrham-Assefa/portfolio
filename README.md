# Abrham Assefa — AI & Full-Stack Developer Portfolio

Interactive portfolio built with **Vite + vanilla JS/CSS** (no framework).

## Features
- Dark / light theme (remembers choice, `T` shortcut)
- Animated hero: neural-net canvas background + illustrated "developer coding" scene (typing editor, floating hearts, day/night window that follows the theme)
- Pinned scroll story: a CSS 3D laptop opens, types code, the tech stack orbits around it, then it ships
- Projects: scroll-stacking flagship cards with animated visuals + "Also shipped" spotlight grid, case-study modals (`#project/<slug>` deep links)
- Skills visualization, experience & education timeline
- Live GitHub repos (cached, with offline fallback)
- Scrolling tech-stack marquee in the Skills section
- **Blog** — latest posts on the homepage + `/blog.html` with tag filter, search, markdown articles, reading progress
- **Admin dashboard** (`/admin.html`) — sign in, write/edit/publish posts with a live markdown preview, and read client messages from the “Let's build something.” contact form (unread badges, reply by email)
- Contact form with validation (saved to Supabase → Formspree → mailto fallback)
- Command palette (`⌘/Ctrl + K` or `/`), back-to-top, two-way scroll animations (replay when scrolling down and up) with hero parallax
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

## Blog & admin (Supabase)
The blog and admin talk to [Supabase](https://supabase.com) (free tier) over its REST API — no SDK is shipped. Until it's configured, the blog shows starter posts from `src/data/posts.js` and the admin runs in a browser-local **demo mode**.

1. Create a Supabase project.
2. In **SQL Editor**, paste `supabase/schema.sql`, replace `YOUR_ADMIN_EMAIL` with your email, and run it (creates `posts` + `messages` with row-level security: the public can read published posts and send messages; only the admin can write posts and read messages).
3. **Authentication → Users → Add user** with that email and a password. Then turn off **Allow new users to sign up**.
4. Copy **Project URL** and the **anon public key** (Project Settings → API):
   - locally: put them in `.env` as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
   - GitHub Pages: repo **Settings → Secrets and variables → Actions → Variables**, add the same two names, then re-run the *Deploy to GitHub Pages* workflow.
5. Open `/admin.html`, sign in, and publish your first post.

## Deploy
Pushing to `main` builds and deploys automatically via `.github/workflows/deploy.yml` (GitHub Pages → https://abrham-assefa.github.io/portfolio/). `vite.config.js` uses `base: './'`, so `dist/` works on GitHub Pages or any static host. Update the URL in `index.html` meta tags and `public/sitemap.xml` if the domain differs.
