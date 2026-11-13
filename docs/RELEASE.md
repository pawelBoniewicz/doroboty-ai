# Publishing the static prototype

The audience is AIPH3 course participants. The app is static files (`dist/`) with no server, database or secrets. The chosen host is **Netlify** (decided 2026-11-12, replacing the earlier GitHub Pages plan). The person who responds to outages is an owner decision recorded in `docs/production-readiness.html`.

## What the repository configures

`netlify.toml` builds with `npm run build`, publishes `dist/` and adds security headers to every file: a same-origin Content-Security-Policy, `X-Frame-Options: SAMEORIGIN` (the CV preview embeds a local PDF), `nosniff`, a referrer policy, a restrictive permissions policy and `X-Robots-Tag: noindex`. Netlify reads the Node.js version from `.nvmrc` (24). Settings in `netlify.toml` override the same settings in the Netlify UI.

The Netlify build does not run the browser tests. Pull requests run `./scripts/verify` in GitHub CI (`.github/workflows/ci.yml`); merge to `main` only when it passes. Netlify publishes `main` to production and builds a public deploy preview for each pull request.

Hash routes and the relative `base: "./"` work without redirect rules. All 37 browser journeys pass when `dist/` is served with exactly these headers (checked locally on 2026-11-12; Netlify itself not yet verified).

## One-time setup (repository administrator, Netlify account owner)

Navigation from Netlify documentation read on 2026-11-12:

1. Netlify team dashboard → **Add new project** → **Import an existing project** → GitHub; authorize the Netlify GitHub App for `pawelBoniewicz/doroboty-ai` only.
2. Select the repository. Leave build settings as detected from `netlify.toml` (command `npm run build`, publish directory `dist`) and confirm with **Publish**.
3. Project configuration → Developer settings → Continuous deployment → Branches and deploy contexts: production branch `main`; keep deploy previews for pull requests.
4. Optional analytics: Project configuration → Environment variables → add `VITE_POSTHOG_KEY` with the PostHog Cloud EU project API key (public `phc_` key, not a personal API key) and redeploy. The app sends events to same-origin `/ingest`, which the `netlify.toml` rewrite proxies to PostHog Cloud EU; the CSP stays same-origin.
5. Note the site address (`https://<name>.netlify.app`) and run the five-minute check below.

Plan notes (Netlify pricing page, 2026-11-12): Free has 300 credits per month; a production deploy costs 15 credits and bandwidth 20 credits per GB. The site is about 2.3 MB, so a course group fits easily, but roughly 20 production deploys per month would use the whole Free allowance. Linking a **private** GitHub repository on Free is not confirmed by the pricing page; check it in the Netlify UI. Repository visibility does not change what is published: only `dist/` is deployed, never `docs/source`.

## Before publishing

1. Merge to `main` only through a pull request whose CI (`./scripts/verify`) passed.
2. Tag the release commit (for example `v0.1.0`).
3. Confirm `dist/` contains only the app, demo logos, example CVs and `case/baseline.csv` (`npm run verify:packet`).

## Five-minute check after publishing

Run these against the exact production URL, in a private window:

1. The address opens over HTTPS without certificate warnings.
2. Response headers include the Content-Security-Policy and `X-Frame-Options` from `netlify.toml` (browser developer tools → Network → document).
3. The home page shows the "Prototyp do ćwiczeń" notice; the offers list and an offer detail open.
4. A hash deep link (for example `/#/oferty/ai-product-manager`) opens directly after a refresh.
5. Choose Anna Kowalska, submit an application, switch to Karolina Wiśniewska, move it to "W przeglądzie", refresh: the history keeps both stages. The CV preview shows the PDF.
6. Developer tools → Console: no Content-Security-Policy errors. Network: no requests to other hosts (with analytics on, events go to `/ingest/…` on the same host).
7. Footer links "Prywatność" and "Zgłoś problem" open.

Record the URL, deploy ID, commit, date and result in the readiness report.

## Rollback

The app keeps no server-side data, so rollback only switches files:

1. Netlify → Deploys → open the last good production deploy → **Publish deploy**. Rollbacks are instantaneous.
2. If the next push to `main` would republish the faulty version, use **Lock to stop auto publishing** on the Deploys page, fix with `git revert` through a pull request, then unlock.
3. Repeat the five-minute check.
4. Tell participants that their data stays in their browsers; if a newer version saved data an older one cannot read, the app protects the save and offers download/import/reset in Settings.

## When something breaks during a class

Participants report through the `/#/pomoc` instructions to the course instructor. First check the production URL yourself, then roll back if the latest deploy caused the problem.
