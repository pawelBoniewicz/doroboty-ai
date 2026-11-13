import posthog from "posthog-js";

function send(
  level: "info" | "warn" | "error",
  message: string,
  attributes: Record<string, string>,
) {
  if (!posthog.__loaded) return;

  try {
    posthog.logger[level](message, attributes);
  } catch {
    // Log delivery must not interrupt the prototype workflow.
  }
}

export const posthogAppLogger = {
  applicationStarted() {
    send("info", "prototype application started", { event: "application_started" });
  },
  statePersistenceFailed() {
    send("warn", "prototype state persistence failed", { event: "state_persistence_failed" });
  },
  renderRecoveryShown() {
    send("error", "prototype render recovery shown", { event: "render_recovery_shown" });
  },
};
