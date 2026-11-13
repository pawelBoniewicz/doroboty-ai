import type { Action, State } from "@/features/prototype/model";

// Opt-in PostHog analytics. See docs/tasks/posthog-analytics.md for the event contract.
// Only synthetic IDs, enums and booleans may leave the browser; never free text.

type Properties = Record<string, string | boolean>;
export type AnalyticsEvent = { event: string; properties: Properties };
type Client = {
  capture: (event: string, properties?: Properties) => void;
};

// Same-origin path proxied to https://eu.i.posthog.com by Netlify and the Vite dev server.
const DEFAULT_HOST = "/ingest";
const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || DEFAULT_HOST;

let client: Client | null = null;
let loading: Promise<Client | null> | null = null;
const queue: AnalyticsEvent[] = [];

export const analyticsEnabled = Boolean(key);

/** Removes query strings (also inside the hash route) so filter search text is never sent. */
export function sanitizeUrl(raw: string): string {
  const [beforeHash, hash] = raw.split("#", 2);
  const base = beforeHash.split("?")[0];
  return hash === undefined ? base : `${base}#${hash.split("?")[0]}`;
}

/** Hash route without query, e.g. "/oferty/ai-product-manager"; "/" when there is none. */
export function routeOf(url: string): string {
  const hash = sanitizeUrl(url).split("#", 2)[1];
  return hash || "/";
}

export function toAnalyticsEvent(action: Action, next: State): AnalyticsEvent | null {
  switch (action.type) {
    case "select_person": {
      const role = next.people.find((p) => p.id === action.id)?.role ?? "signed_out";
      return { event: "role_selected", properties: { role } };
    }
    case "profile":
      return { event: "profile_saved", properties: {} };
    case "toggle_saved":
      return {
        event: "job_save_toggled",
        properties: {
          job_id: action.jobId,
          saved: next.saved.some(
            (x) => x.jobId === action.jobId && x.candidateId === next.activePersonId,
          ),
        },
      };
    case "draft":
      return { event: "application_drafted", properties: { job_id: action.jobId } };
    case "submit":
      return { event: "application_submitted", properties: { job_id: action.jobId } };
    case "stage":
      return {
        event: "application_staged",
        properties: { application_id: action.applicationId, stage: action.stage },
      };
    case "withdraw":
      return {
        event: "application_withdrawn",
        properties: { application_id: action.applicationId },
      };
    case "publish":
      return { event: "job_published", properties: { job_id: action.job.id } };
    case "company":
      return { event: "company_saved", properties: {} };
    default:
      return null;
  }
}

const URL_PROPERTIES = ["$current_url", "$referrer", "$initial_referrer", "$initial_current_url"];

function load(): Promise<Client | null> {
  if (!key || typeof window === "undefined") return Promise.resolve(null);
  loading ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: host,
        ui_host: "https://eu.posthog.com",
        defaults: "2026-08-30",
        persistence: "memory",
        person_profiles: "never",
        // Clicks and submits only; element text and attributes are masked so labels,
        // names and links never leave the browser. Input values are never captured.
        autocapture: { dom_event_allowlist: ["click", "submit"], capture_copied_text: false },
        mask_all_text: true,
        mask_all_element_attributes: true,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        capture_heatmaps: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        capture_performance: false,
        rageclick: false,
        disable_surveys: true,
        disable_product_tours: true,
        disable_conversations: true,
        disable_web_experiments: true,
        disable_external_dependency_loading: true,
        advanced_disable_flags: true,
        save_referrer: false,
        before_send: (event) => {
          if (!event) return event;
          // posthog-js drops the hash, so autocapture and store events would lose the route.
          if (event.event !== "$pageview") event.properties.$current_url = window.location.href;
          for (const name of URL_PROPERTIES) {
            const value: unknown = event.properties[name];
            if (typeof value === "string") event.properties[name] = sanitizeUrl(value);
          }
          event.properties.route = routeOf(String(event.properties.$current_url ?? ""));
          return event;
        },
      });
      client = posthog;
      for (const item of queue.splice(0)) posthog.capture(item.event, item.properties);
      return client;
    })
    .catch(() => null);
  return loading;
}

export function track(item: AnalyticsEvent | null) {
  if (!item || !key) return;
  if (client) {
    client.capture(item.event, item.properties);
    return;
  }
  if (queue.length < 50) queue.push(item);
  void load();
}

export function trackPageview(url: string) {
  track({ event: "$pageview", properties: { $current_url: sanitizeUrl(url) } });
}
