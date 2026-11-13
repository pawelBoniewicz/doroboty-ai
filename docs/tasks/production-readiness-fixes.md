# Production-readiness repair package

## Intent and acceptance

The readiness audit (`docs/production-readiness.html`, audience confirmed as AIPH3 course participants) found preparation gaps that the agent can fix locally. The owner approved this package on 2026-11-12. Scope:

1. Prototype labeling: every public-layout screen (home, listing, offer, company, application form, person picker) shows a persistent, non-dismissable notice that this is a teaching prototype with fictional offers and that real personal data must not be entered, linking to the privacy page. Poster People notice recipe (pink paper, ink contour), Polish copy, no layout overflow at 320px.
2. Cross-tab overwrite: when another tab changes the saved scenario (`storage` event for the scenario key, or storage cleared), this tab stops persisting, shows a notice and offers "Wczytaj aktualne dane", which adopts the other tab's valid save. In-memory work keeps functioning; nothing saved by the other tab is overwritten.
3. Error visibility: a render error shows a recovery screen instead of a blank page with reload, raw-save download and a link to the help page. A new `/#/pomoc` page explains how participants report a problem (to the course instructor, with steps, URL, browser, screenshot and optionally the exported synthetic scenario). Footer links to it. No telemetry or external requests are added.
4. Documentation: post-publication smoke checklist and rollback steps for static hosting in `docs/RELEASE.md`; FEATURES.md updated for the changed behavior.
5. The "Podsumowanie" heading in the employer/candidate record margin no longer breaks inside the word.

Out of scope: choosing hosting, Git repository/versioning, incident owner, installing the Playwright browser (owner decisions).

## Validation

Implemented: `PrototypeBanner` in the public shell (`shell.tsx`, `.prototype-banner` in `poster-people.css`), `HelpPage` at `/#/pomoc` with footer and workspace links, cross-tab detection in `store.tsx` (`externalChange`, `adoptExternalState`), `AppErrorBoundary`, margin heading sizing in `records.css`, `docs/RELEASE.md`, FEATURES.md PUB-10/PUB-12/PUB-14/SYS-09/SYS-10. The generated readiness report is excluded from Prettier. Three Playwright journeys were added for the banner, help page and cross-tab protection.

Executed on 2026-11-12 (Node 24.22.1, Windows): Prettier, ESLint, `tsc`, 27 unit tests, design-system check (67 files), packet verifier and production build all pass. Playwright could not run: Chromium is not provisioned on this machine and was not installed, so the new and existing browser journeys are **not executed** here. Run `./scripts/verify` in CI or after provisioning.

Manual checks against `vite preview` of the built `dist/`: banner present with no horizontal overflow at 320px on home, listing, offer, company and help routes; banner on the 1024px+ desktop; `/#/pomoc` content renders. Two tabs: saving a profile in tab A showed the notice in tab B; saving an offer in tab B did not overwrite tab A's save; "Wczytaj aktualne dane" removed the notice and showed tab A's profile name. "Podsumowanie"/"Historia procesu" stay one line with no overflow at 1024px (24.6px), 1180px (28px) and 390px (24px). The error boundary was reviewed in code and type-checked but not triggered in a browser.

Follow-up on 2026-11-12: with the owner's approval Playwright Chromium (build 1243) was installed for the current user via `npx playwright install chromium`. `./scripts/verify` then exited 0: all gate steps including 27 unit tests and 37 Chromium journeys (the three new ones among them) passed.

Review: re-read the changed store, shell, settings, error boundary and CSS. Import/reset still replace state explicitly after confirmation and clear the cross-tab block; no remote requests or telemetry were added; the agent kit is unchanged.

## Follow-up: GitHub Pages publication

The owner chose GitHub Pages. Added `.github/workflows/pages.yml` (verify → upload `dist/` → deploy, action versions from the GitHub custom-workflow documentation read on 2026-11-12), Pages setup steps, limits and rollback in `docs/RELEASE.md`, and FEATURES.md OPS-12. Nothing was pushed, enabled or deployed. Open risk for the owner: Pages on GitHub Free requires a public repository, which would expose instructor material; use a private repository on a paid plan or a separate public participant-only repository.

## Follow-up: separate public publishing repository

The owner chose to publish from a separate public repository containing only the participant package. The package allowlist now includes `.github` and `docs/RELEASE.md`; the Pages jobs run only when the repository variable `PUBLISH_PAGES` is `true`, so forks and the private instructor repository do not deploy. A package created in the session scratchpad excluded `docs/source`/`docs/tasks`, and `npm ci` + `./scripts/verify` inside it exited 0 (27 unit tests, 37 Chromium journeys). No GitHub repository was created and nothing was pushed or deployed.

Prepared publishing folder on 2026-11-12: `C:\Users\bronpa1\doroboty-ai-prototype` (outside OneDrive), created with `npm run package:participant`, `git init -b main`, local `core.autocrlf=false`, 218 files staged with LF endings and the executable bit on `scripts/verify` and `scripts/bootstrap`. `npm ci` + `./scripts/verify` there exited 0 (27 unit tests, 37 Chromium journeys) and left no untracked files. The owner will create the commit, tag and GitHub repository personally; no commit, push or deployment was made by the agent.

## Follow-up: switch hosting to Netlify

The owner switched hosting from GitHub Pages to Netlify. Removed `.github/workflows/pages.yml`; added `netlify.toml` (build `npm run build`, publish `dist`, same-origin CSP with `frame-ancestors 'self'` for the local PDF preview, SAMEORIGIN framing, nosniff, referrer and permissions policies, noindex). `docs/RELEASE.md` now covers Netlify setup, plan credits, deploy previews, the post-publish check and rollback via "Publish deploy"; FEATURES.md OPS-09/OPS-12 and the package allowlist (`netlify.toml`) were updated. Netlify navigation and pricing come from Netlify documentation read on 2026-11-12; private-repository linking on the Free plan was not confirmed there.

Header verification: `dist/` served by a scratch static server applying exactly the `netlify.toml` headers; all 37 Playwright journeys passed, and a manual pass over listing, map, offer, application, profile, help and the employer CV tab recorded no `securitypolicyviolation` events or console CSP errors, with the PDF preview rendering. Netlify itself has not been configured or deployed. The prepared GitHub Pages folder `C:\Users\bronpa1\doroboty-ai-prototype` is obsolete for this plan.

## Deployment check (2026-11-13)

PR #1 was merged (`7e429eb`) and tagged `v0.1.0`; the owner made the Netlify project public. `https://unrivaled-cranachan-ffcc74.netlify.app/` serves HTTPS (HTTP → 301, HSTS) with all `netlify.toml` headers. Production JS, CSS, CV PDF and baseline CSV are byte-identical to a local build of `v0.1.0`, whose source fingerprint equals the assessed version; `index.html` differs only by a Netlify comment and an injected `/.netlify/scripts/hud` script. A Playwright run against production passed the post-publish journey (notice, listing, deep link, application, employer stage after reload, CV preview, privacy and help pages) with no requests to other hosts.

Correction to the earlier local header check: violation listeners were attached after page load, so load-time reports were missed. Production shows CSP reports for (1) Zod's caught `new Function` probe in our bundle (avoidable with Zod `jitless` config) and (2) inline scripts in an `about:` frame, most likely from the Netlify-injected script. The app works; these are console noise, not failures. Alerts and deploy-error visibility still need the owner.

## Follow-up: clean CSP console

Added `src/lib/zod-config.ts` (`z.config({ jitless: true })`), imported first in `src/main.tsx`, so Zod no longer probes `new Function` under the eval-free policy. Added a Playwright journey that applies the `netlify.toml` Content-Security-Policy to every response and fails on any `securitypolicyviolation`; it failed with `script-src eval` when the import was removed and passes with it. `docs/RELEASE.md` notes that Netlify's injected panel script may still report blocked inline scripts. FEATURES.md OPS-12 updated.
