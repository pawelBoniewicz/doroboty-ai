# Publishing the static prototype

The audience is AIPH3 course participants. The app is static files (`dist/`) with no server, database or secrets. The chosen host is GitHub Pages, published from a **separate public repository that contains only the baseline participant package** (decided 2026-11-12). The instructor repository stays private and never publishes. The person who responds to outages is an owner decision recorded in `docs/production-readiness.html`.

## GitHub Pages setup

`.github/workflows/pages.yml` runs only where the repository variable `PUBLISH_PAGES` is `true`, so participant forks and the instructor repository skip it. In the publishing repository it runs `./scripts/verify` on every push to `main` (or a manual run), then uploads only `dist/` and deploys it. A failing check stops the deployment. Hash routes and the relative `base: "./"` work under `https://<owner>.github.io/<repository>/` without extra configuration.

One-time setup by a repository administrator:

1. In the instructor repository, create the package in an empty folder outside it: `npm run package:participant -- /absolute/empty/folder`. It contains the app, tests, `.github` and participant docs, and excludes `docs/source`, `docs/tasks`, agent history and Git history.
2. On GitHub create a new **public** repository (for example `doroboty-ai-prototype`) without a README.
3. In the package folder: `git init -b main`, `git add .`, `git commit -m "Baseline participant package"`, add the new repository as `origin` and push `main`.
4. Repository → Settings → Secrets and variables → Actions → Variables → New repository variable: `PUBLISH_PAGES` = `true`.
5. Repository → Settings → (sidebar "Code, planning, and automation") Pages → Build and deployment → Source: **GitHub Actions**.
6. Actions → "Publish prototype to GitHub Pages" → Run workflow (or push to `main`).
7. The deploy job shows the site URL; run the five-minute check below against it.

For a later release, create a fresh package from the instructor repository, copy it over the publishing repository's files (keeping its `.git`), review `git diff`, commit with a version tag (for example `v0.1.1`) and push `main`.

Constraints from GitHub documentation (checked 2026-11-12):

- On GitHub Free, Pages works only from **public** repositories. Making this repository public would expose `docs/source` and other instructor material, which AGENTS.md forbids distributing. Use a paid plan/organization with a private repository, or publish from a separate public repository that contains only the participant package.
- A Pages site is publicly reachable on the internet even when the repository is private (access control requires GitHub Enterprise Cloud). `index.html` asks search engines not to index it, which is not access control.
- Soft limits: published site up to 1 GB, 100 GB bandwidth per month; the current build is about 2.3 MB.
- Pages does not document custom HTTP response headers, so headers such as Content-Security-Policy cannot be relied on there.

## Before publishing

1. Build from an identified version: a Git commit or tag (for example `v0.1.0`), not an untracked folder copy.
2. Run `./scripts/verify` (requires provisioned Playwright Chromium) and `npm run build`.
3. Confirm `dist/` contains only the app, demo logos, example CVs and `case/baseline.csv` (`npm run verify:packet`).
4. Keep the previous published `dist/` (or the host's previous deployment) available for rollback.

## Five-minute check after publishing

Run these against the exact published URL, in a private window:

1. The address opens over HTTPS without certificate warnings.
2. The home page shows the "Prototyp do ćwiczeń" notice; the offers list and an offer detail open.
3. A hash deep link (for example `/#/oferty/ai-product-manager`) opens directly after a refresh.
4. Choose Anna Kowalska, submit an application, switch to Karolina Wiśniewska, move it to "W przeglądzie", refresh: the history keeps both stages.
5. An example CV PDF opens from the application.
6. Browser developer tools → Network: no requests to hosts other than the published one.
7. Footer links "Prywatność" and "Zgłoś problem" open.

Record the URL, deployed version, date and result in the readiness report.

## Rollback

The app keeps no server-side data, so rollback only replaces files:

1. On GitHub: revert the faulty commit on `main` (`git revert`), which republishes the previous verified version; or re-run the "Publish prototype to GitHub Pages" workflow from the last good run. Other hosts: republish the previous `dist/`.
2. Repeat the five-minute check.
3. Tell participants that their data stays in their browsers; if a newer version saved data an older version cannot read, the app protects the save and offers download/import/reset in Settings.

## When something breaks during a class

Participants report through the `/#/pomoc` page instructions to the course instructor. First check the published URL yourself, then roll back if the latest release caused the problem.
