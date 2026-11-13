# PostHog product analytics

## Intent

Connect the prototype to PostHog Cloud EU so course participants can see real usage (pageviews,
funnels across the candidate and employer flows) without collecting personal data. This reverses
the earlier SYS-03 removal in an opt-in way.

## Acceptance criteria

- `posthog-js` is bundled (no remote script); it is loaded only when `VITE_POSTHOG_KEY` is set at
  build time. Without the key the app makes no external requests (existing browser tests stay
  green).
- Optional `VITE_POSTHOG_HOST` overrides the default same-origin `/ingest`.
- `/ingest/*` is proxied to `https://eu.i.posthog.com` by a Netlify rewrite (status 200) and the
  Vite dev server proxy, because ad blockers and corporate filters drop direct requests to
  posthog.com (2026-11-13: a curl event arrived while browser events did not).
- No cookies or localStorage: `persistence: "memory"`, `person_profiles: "never"`, no `identify`.
- Autocapture (enabled 2026-11-13 on request) records only `click` and `submit` with
  `mask_all_text` and `mask_all_element_attributes`, so `$elements_chain` holds tag/position
  selectors only. No session replay, heatmaps, dead clicks, rage clicks, exception capture,
  surveys, toolbar, flags or external dependency loading.
- `before_send` sets `$current_url` from the live hash route (posthog-js drops the hash) and adds
  a `route` property, both without query strings.
- Pageviews are sent manually on hash route changes with the hash query string removed
  (filter search text never leaves the browser). `before_send` strips query strings from URL
  properties as a second guard.
- Domain events come from an explicit allowlist mapped from store actions; only synthetic IDs,
  enums and booleans are sent — never notes, answers, generated text, profile or company fields.
- Unit tests prove free-text action fields never appear in event payloads.
- CSP `connect-src` stays `'self'`.
- The privacy page discloses PostHog statistics when the key is built in.
- FEATURES.md SYS-03 describes the actual behavior.

## Event contract

| Action          | Event                   | Properties                |
| --------------- | ----------------------- | ------------------------- |
| route change    | `$pageview`             | sanitized `$current_url`  |
| `select_person` | `role_selected`         | `role` (or `signed_out`)  |
| `profile`       | `profile_saved`         | none                      |
| `toggle_saved`  | `job_save_toggled`      | `job_id`, `saved`         |
| `draft`         | `application_drafted`   | `job_id`                  |
| `submit`        | `application_submitted` | `job_id`                  |
| `stage`         | `application_staged`    | `application_id`, `stage` |
| `withdraw`      | `application_withdrawn` | `application_id`          |
| `publish`       | `job_published`         | `job_id`                  |
| `company`       | `company_saved`         | none                      |

Events are emitted only after the store transition succeeds.
