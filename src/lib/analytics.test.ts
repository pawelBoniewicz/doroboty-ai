import { describe, expect, it } from "vitest";
import { initialState, transition, type Action } from "@/features/prototype/model";
import { routeOf, sanitizeUrl, toAnalyticsEvent } from "./analytics";

const SECRET = "PRIVATE-FREE-TEXT-42";

describe("analytics event contract", () => {
  it("never includes free-text fields in event payloads", () => {
    const s = transition(initialState(), { type: "select_person", id: "candidate-anna" });
    const job = s.jobs[0];
    const actions: Action[] = [
      { type: "draft", jobId: job.id, notes: SECRET, generated: SECRET, answer: SECRET },
      {
        type: "submit",
        jobId: job.id,
        notes: SECRET,
        generated: SECRET,
        answer: SECRET,
        consent: true,
      },
      { type: "stage", applicationId: "application-example", stage: "rejected", note: SECRET },
      { type: "company", name: SECRET, description: SECRET },
      { type: "publish", job: { ...job, title: SECRET, description: SECRET } },
    ];
    for (const action of actions) {
      const payload = JSON.stringify(toAnalyticsEvent(action, s));
      expect(payload).not.toContain(SECRET);
    }
  });

  it("maps actions to allowlisted events with synthetic IDs", () => {
    const s = transition(initialState(), { type: "select_person", id: "candidate-anna" });
    expect(toAnalyticsEvent({ type: "select_person", id: "candidate-anna" }, s)).toEqual({
      event: "role_selected",
      properties: { role: "candidate" },
    });
    expect(toAnalyticsEvent({ type: "select_person", id: null }, s)?.properties.role).toBe(
      "signed_out",
    );
    expect(toAnalyticsEvent({ type: "toggle_saved", jobId: s.jobs[0].id }, s)).toEqual({
      event: "job_save_toggled",
      properties: { job_id: s.jobs[0].id, saved: false },
    });
  });

  it("removes query strings including those inside the hash route", () => {
    expect(sanitizeUrl("https://x.test/?a=1#/oferty?q=Anna%20Kowalska")).toBe(
      "https://x.test/#/oferty",
    );
    expect(sanitizeUrl("https://x.test/#/oferty/abc")).toBe("https://x.test/#/oferty/abc");
    expect(sanitizeUrl("https://x.test/path?q=1")).toBe("https://x.test/path");
  });

  it("derives the hash route without its query", () => {
    expect(routeOf("https://x.test/#/oferty?q=Anna")).toBe("/oferty");
    expect(routeOf("https://x.test/#/app/aplikacje/a1")).toBe("/app/aplikacje/a1");
    expect(routeOf("https://x.test/")).toBe("/");
  });
});
